import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";

// ─── Get Queue for a User in a League ────────────────────────────────────────

const getQueue = async (userId: string, leagueId: string) => {
  return prisma.draftPickQueue.findMany({
    where: { userId, leagueId },
    include: { fighter: true },
    orderBy: { priority: "asc" },
  });
};

// ─── Upsert Queue Entry (add or update priority) ─────────────────────────────

const upsertQueueEntry = async (
  userId: string,
  leagueId: string,
  fighterId: string,
  priority: number
) => {
  // Verify fighter exists and is active
  const fighter = await prisma.fighter.findUnique({ where: { id: fighterId } });
  if (!fighter || !fighter.isActive) throw new ApiError(404, "Fighter not found or inactive");

  // Verify session exists
  const session = await prisma.draftSession.findUnique({ where: { leagueId } });
  if (!session) throw new ApiError(404, "No draft session found for this league");
  if (session.status === "COMPLETED") {
    throw new ApiError(400, "Draft is already completed");
  }

  // Verify fighter is not already picked
  const alreadyPicked = await prisma.draftPick.findFirst({
    where: { draftSessionId: session.id, fighterId },
  });
  if (alreadyPicked) throw new ApiError(409, "This fighter has already been picked");

  return prisma.draftPickQueue.upsert({
    where: { userId_leagueId_fighterId: { userId, leagueId, fighterId } },
    update: { priority },
    create: { userId, leagueId, fighterId, priority },
    include: { fighter: { select: { id: true, name: true, divisionId: true, rank: true } } },
  });
};

// ─── Remove Queue Entry ───────────────────────────────────────────────────────

const removeQueueEntry = async (
  userId: string,
  leagueId: string,
  fighterId: string
) => {
  const entry = await prisma.draftPickQueue.findUnique({
    where: { userId_leagueId_fighterId: { userId, leagueId, fighterId } },
  });
  if (!entry) throw new ApiError(404, "Queue entry not found");

  return prisma.draftPickQueue.delete({
    where: { userId_leagueId_fighterId: { userId, leagueId, fighterId } },
  });
};

// ─── Replace Entire Queue (bulk reorder) ─────────────────────────────────────

const replaceQueue = async (
  userId: string,
  leagueId: string,
  entries: { fighterId: string; priority: number }[]
) => {
  const session = await prisma.draftSession.findUnique({ where: { leagueId } });
  if (!session) throw new ApiError(404, "No draft session found for this league");

  return prisma.$transaction(async (tx) => {
    // Clear existing queue
    await tx.draftPickQueue.deleteMany({ where: { userId, leagueId } });

    // Bulk insert with new priorities
    if (entries.length > 0) {
      await tx.draftPickQueue.createMany({
        data: entries.map((e) => ({ userId, leagueId, fighterId: e.fighterId, priority: e.priority })),
      });
    }

    return tx.draftPickQueue.findMany({
      where: { userId, leagueId },
      include: { fighter: { select: { id: true, name: true, divisionId: true, rank: true } } },
      orderBy: { priority: "asc" },
    });
  });
};

export const QueueService = {
  getQueue,
  upsertQueueEntry,
  removeQueueEntry,
  replaceQueue,
};
