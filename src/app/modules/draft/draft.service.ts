import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { IDraftFilterRequest, IPickFighterPayload } from "./draft.interface.js";
import { emitDraftEvent } from "../../../helpers/socketHelper.js";

type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build the list of already-picked fighter IDs for a draft session */
const getPickedIds = async (draftSessionId: string): Promise<string[]> =>
  (
    await prisma.draftPick.findMany({
      where: { draftSessionId },
      select: { fighterId: true },
    })
  ).map((p) => p.fighterId);

// ─── Get Draft Session ────────────────────────────────────────────────────────

const getDraftSession = async (leagueId: string) => {
  const session = await prisma.draftSession.findUnique({
    where: { leagueId },
    include: {
      league: {
        select: { id: true, name: true, memberLimit: true, rosterSize: true },
      },
      draftOrder: {
        orderBy: { overallPick: "asc" },
        include: {
          team: {
            include: {
              owner: { select: { id: true, name: true, avatarUrl: true } },
            },
          },
        },
      },
      draftPicks: {
        orderBy: { pickedAt: "asc" },
        include: {
          fighter: true,
          team: { select: { id: true, name: true } },
        },
      },
    },
  });
  if (!session) throw new ApiError(404, "Draft session not found for this league");
  return session;
};

// ─── Get Available Fighters ───────────────────────────────────────────────────

const getAvailableFighters = async (
  leagueId: string,
  filter: IDraftFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const session = await prisma.draftSession.findUnique({ where: { leagueId } });
  if (!session) throw new ApiError(404, "Draft session not found");

  const pickedFighterIds = await getPickedIds(session.id);

  const andConditions: Prisma.FighterWhereInput[] = [
    { isActive: true },
    { id: { notIn: pickedFighterIds } },
  ];

  if (filter.searchTerm) {
    andConditions.push({
      OR: ["name", "nickname"].map((f) => ({
        [f]: { contains: filter.searchTerm, mode: "insensitive" },
      })),
    });
  }
  if (filter.divisionId) {
    andConditions.push({ divisionId: filter.divisionId });
  }

  const where: Prisma.FighterWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.fighter.findMany({
      where,
      skip,
      take: limit,
      orderBy:
        sortBy === "rank"
          ? [{ rank: "asc" }, { name: "asc" }]
          : { [sortBy]: sortOrder as any },
    }),
    prisma.fighter.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result,
  };
};

// ─── Start Draft ──────────────────────────────────────────────────────────────

const startDraft = async (
  leagueId: string,
  requesterId: string,
  role: string
) => {
  const league = await prisma.league.findUnique({
    where: { id: leagueId, deletedAt: null },
    include: { teams: true, _count: { select: { members: true } } },
  });
  if (!league) throw new ApiError(404, "League not found");
  if (role !== "ADMIN" && league.managerId !== requesterId) {
    throw new ApiError(403, "Only the league manager or admin can start the draft");
  }

  const session = await prisma.draftSession.findUnique({ where: { leagueId } });
  if (!session) throw new ApiError(404, "Draft session not found");
  if (session.status !== "WAITING" && session.status !== "OPEN") {
    throw new ApiError(400, `Cannot start draft — current status is ${session.status}`);
  }

  const teams = league.teams;
  const n = teams.length;
  
  // Public Room Timer Extension Logic
  if (!league.passcode && n < league.memberLimit) {
    const newDraftTime = new Date(Date.now() + 5 * 60 * 1000);
    await prisma.league.update({
      where: { id: leagueId },
      data: { draftTime: newDraftTime },
    });

    emitDraftEvent(leagueId, "draft:timer_extended", {
      message: "Not enough players to start. Draft timer extended by 5 minutes.",
      newDraftTime,
    });

    throw new ApiError(400, "Not enough players to start public draft. Timer extended by 5 minutes.");
  }

  if (n < 2) throw new ApiError(400, "At least 2 teams are required to start the draft");

  const totalRounds = league.rosterSize;
  const draftOrderData: {
    draftSessionId: string;
    teamId: string;
    round: number;
    pickPosition: number;
    overallPick: number;
  }[] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const isEvenRound = round % 2 === 0;
    const teamOrder = isEvenRound ? [...teams].reverse() : [...teams];

    teamOrder.forEach((team, pos) => {
      const overallPick = (round - 1) * n + pos + 1;
      draftOrderData.push({
        draftSessionId: session.id,
        teamId: team.id,
        round,
        pickPosition: pos + 1,
        overallPick,
      });
    });
  }

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    await tx.draftOrder.deleteMany({ where: { draftSessionId: session.id } });
    await tx.draftOrder.createMany({ data: draftOrderData });

    return tx.draftSession.update({
      where: { id: session.id },
      data: {
        status: "DRAFTING",
        startedAt: now,
        currentRound: 1,
        currentPickIndex: 0,
        totalRounds,
        turnStartedAt: now,
        version: { increment: 1 },
      },
      include: {
        draftOrder: {
          orderBy: { overallPick: "asc" },
          include: { team: true },
        },
      },
    });
  });

  emitDraftEvent(leagueId, "draft:started", {
    leagueId,
    draftSessionId: result.id,
    currentPickIndex: result.currentPickIndex,
    secondsPerPick: result.secondsPerPick,
    turnStartedAt: result.turnStartedAt,
  });

  return result;
};

// ─── Core Pick Logic (shared by manual pick and auto-pick) ────────────────────

const executePick = async (
  leagueId: string,
  userId: string,
  fighterId: string
) => {
  // Load session with current version for optimistic locking
  const session = await prisma.draftSession.findUnique({
    where: { leagueId },
    include: {
      draftOrder: { orderBy: { overallPick: "asc" } },
    },
  });

  if (!session) throw new ApiError(404, "Draft session not found");
  if (session.status !== "DRAFTING") {
    throw new ApiError(400, `Draft is not in progress — status: ${session.status}`);
  }

  const currentOrderSlot = session.draftOrder[session.currentPickIndex];
  if (!currentOrderSlot) {
    throw new ApiError(400, "Invalid pick index — draft may be complete");
  }

  const team = await prisma.team.findUnique({ where: { id: currentOrderSlot.teamId } });
  if (!team || team.ownerId !== userId) {
    throw new ApiError(403, "It is not your turn to pick");
  }

  const alreadyPicked = await prisma.draftPick.findUnique({
    where: {
      draftSessionId_fighterId: {
        draftSessionId: session.id,
        fighterId,
      },
    },
  });
  if (alreadyPicked) throw new ApiError(409, "This fighter has already been picked");

  const fighter = await prisma.fighter.findUnique({ where: { id: fighterId } });
  if (!fighter || !fighter.isActive) throw new ApiError(404, "Fighter not found or inactive");

  const totalPicks = session.draftOrder.length;
  const nextPickIndex = session.currentPickIndex + 1;
  const isDraftComplete = nextPickIndex >= totalPicks;
  const nextRound = isDraftComplete
    ? session.currentRound
    : session.draftOrder[nextPickIndex]?.round ?? session.currentRound;

  const now = new Date();

  // ── Optimistic Locking Transaction ────────────────────────────────────────
  return prisma.$transaction(async (tx) => {
    // Atomic version guard — only proceeds if nobody else advanced the session
    const updated = await tx.draftSession.updateMany({
      where: { id: session.id, version: session.version },
      data: {
        currentPickIndex: nextPickIndex,
        currentRound: nextRound,
        status: isDraftComplete ? "COMPLETED" : "DRAFTING",
        completedAt: isDraftComplete ? now : undefined,
        turnStartedAt: isDraftComplete ? undefined : now,
        version: { increment: 1 },
      },
    });

    if (updated.count === 0) {
      throw new ApiError(
        409,
        "Race condition: another pick was submitted simultaneously. Please try again."
      );
    }

    await tx.draftPick.create({
      data: {
        draftSessionId: session.id,
        teamId: currentOrderSlot.teamId,
        fighterId,
        round: currentOrderSlot.round,
        pickNumber: currentOrderSlot.overallPick,
      },
    });

    await tx.teamFighter.create({
      data: { teamId: currentOrderSlot.teamId, fighterId },
    });

    if (isDraftComplete) {
      await tx.league.update({
        where: { id: leagueId },
        data: { status: "ACTIVE" },
      });
    }

    // If user missed a pick before → flag for auto-pick on future turns
    const member = await tx.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId } },
    });
    // Reset auto-pick flag on a successful manual pick (user is back)
    if (member?.isAutoPickEnabled) {
      await tx.leagueMember.update({
        where: { leagueId_userId: { leagueId, userId } },
        data: { isAutoPickEnabled: false },
      });
    }

    return { session: { ...session, currentPickIndex: nextPickIndex, status: isDraftComplete ? "COMPLETED" : "DRAFTING" }, fighter, team };
  });
};

// ─── Manual Pick Fighter ──────────────────────────────────────────────────────

const pickFighter = async (
  leagueId: string,
  userId: string,
  payload: IPickFighterPayload
) => {
  const result = await executePick(leagueId, userId, payload.fighterId);

  emitDraftEvent(leagueId, "draft:pick", {
    leagueId,
    teamId: result.team.id,
    fighter: result.fighter,
    pickIndex: result.session.currentPickIndex - 1,
    nextPickIndex: result.session.currentPickIndex,
    isDraftComplete: result.session.status === "COMPLETED",
    turnStartedAt: new Date(),
  });

  return result;
};

// ─── Auto-Pick (timer expired) ────────────────────────────────────────────────

/**
 * Called when a team's pick timer expires.
 * Priority:
 *   1. Lowest-priority queue entry for the current user that's still available
 *   2. Highest-ranked active fighter (lowest rank number = best)
 */
const autoPick = async (leagueId: string, teamId: string) => {
  const session = await prisma.draftSession.findUnique({ where: { leagueId } });
  if (!session) throw new ApiError(404, "Draft session not found");
  if (session.status !== "DRAFTING") {
    throw new ApiError(400, `Draft is not in DRAFTING state — status: ${session.status}`);
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new ApiError(404, "Team not found");

  const pickedIds = await getPickedIds(session.id);

  // 1. Try queue
  const queueEntry = await prisma.draftPickQueue.findFirst({
    where: {
      userId: team.ownerId,
      leagueId,
      fighterId: { notIn: pickedIds },
      fighter: { isActive: true },
    },
    orderBy: { priority: "asc" },
    include: { fighter: true },
  });

  let fighterId: string;

  if (queueEntry) {
    fighterId = queueEntry.fighterId;
  } else {
    // 2. Best available by rank
    const topFighter = await prisma.fighter.findFirst({
      where: { isActive: true, id: { notIn: pickedIds } },
      orderBy: [{ rank: "asc" }, { wins: "desc" }],
    });
    if (!topFighter) throw new ApiError(404, "No available fighters for auto-pick");
    fighterId = topFighter.id;
  }

  // Mark user as auto-pick enabled (future turns auto-pick instantly)
  await prisma.leagueMember.update({
    where: { leagueId_userId: { leagueId, userId: team.ownerId } },
    data: { isAutoPickEnabled: true },
  });

  const result = await executePick(leagueId, team.ownerId, fighterId);

  emitDraftEvent(leagueId, "draft:autopick", {
    leagueId,
    teamId,
    fighter: result.fighter,
    source: queueEntry ? "queue" : "best_available",
    nextPickIndex: result.session.currentPickIndex,
    isDraftComplete: result.session.status === "COMPLETED",
    turnStartedAt: new Date(),
  });

  return result;
};

export const DraftService = {
  getDraftSession,
  getAvailableFighters,
  startDraft,
  pickFighter,
  autoPick,
};
