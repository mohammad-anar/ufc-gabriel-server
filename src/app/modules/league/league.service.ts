import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import {
  ICreateLeaguePayload,
  ILeagueFilterRequest,
  IJoinLeaguePayload,
} from "./league.interface.js";

type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

// Generate a random 6-character alphanumeric code
const generateCode = (): string => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const createLeague = async (managerId: string, payload: ICreateLeaguePayload) => {
  const {
    leagueType,
    scoringSettings,
    draftTime,
    secondsPerPick = 60,
    rosterSize = 5,
    memberLimit = 10,
    ...rest
  } = payload;

  if (leagueType === "PRIVATE" && !payload.passcode) {
    throw new ApiError(400, "Passcode is required for private leagues");
  }

  // Ensure unique code
  let code = generateCode();
  while (await prisma.league.findUnique({ where: { code } })) {
    code = generateCode();
  }

  const result = await prisma.$transaction(async (tx) => {
    const league = await tx.league.create({
      data: {
        ...rest,
        code,
        managerId,
        memberLimit,
        rosterSize,
        draftTime: new Date(draftTime),
        status: "DRAFTING",
        // null out passcode if public
        passcode: leagueType === "PRIVATE" ? payload.passcode : null,
      },
    });

    // Create default scoring settings
    await tx.leagueScoringSettings.create({
      data: {
        leagueId: league.id,
        ...(scoringSettings || {}),
      },
    });

    // Create draft session
    await tx.draftSession.create({
      data: {
        leagueId: league.id,
        status: "WAITING",
        secondsPerPick,
        totalRounds: rosterSize,
      },
    });

    // Auto-join manager as first member
    await tx.leagueMember.create({
      data: { leagueId: league.id, userId: managerId },
    });

    // Create manager's team
    await tx.team.create({
      data: {
        leagueId: league.id,
        ownerId: managerId,
        name: `Team ${managerId.slice(0, 5)}`,
      },
    });

    return tx.league.findUnique({
      where: { id: league.id },
      include: { scoringSettings: true, draftSession: true, _count: { select: { members: true } } },
    });
  });

  return result;
};

const getAllLeagues = async (
  filter: ILeagueFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, leagueType, ...filterData } = filter;

  const andConditions: Prisma.LeagueWhereInput[] = [
    { deletedAt: null },
    { status: { not: "ARCHIVED" } },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "code"].map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  // Filter by PUBLIC/PRIVATE: private leagues have a non-null passcode
  if (leagueType === "PUBLIC") {
    andConditions.push({ passcode: null });
  } else if (leagueType === "PRIVATE") {
    andConditions.push({ passcode: { not: null } });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const where: Prisma.LeagueWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.league.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: { select: { members: true, teams: true } },
        manager: { select: { id: true, name: true, avatarUrl: true } },
        scoringSettings: true,
      },
    }),
    prisma.league.count({ where }),
  ]);

  // Mask passcode — only expose whether it's private
  const sanitized = result.map((l) => ({
    ...l,
    isPrivate: l.passcode !== null,
    passcode: undefined,
  }));

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: sanitized,
  };
};
const getAdminLeagues = async (
  filter: ILeagueFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filter;

  const andConditions: Prisma.LeagueWhereInput[] = [{ deletedAt: null }];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "code"].map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  // Filter by PUBLIC/PRIVATE
  if ((filter as any).leagueType === "PUBLIC") {
    andConditions.push({ passcode: null });
  } else if ((filter as any).leagueType === "PRIVATE") {
    andConditions.push({ passcode: { not: null } });
  }

  if (Object.keys(filterData).length > 0) {
    const filters = Object.keys(filterData).map((key) => {
      let value = (filterData as any)[key];
      if (key === "isSystemGenerated" && typeof value === "string") {
        value = value === "true";
      }
      return { [key]: { equals: value } };
    });
    andConditions.push({ AND: filters });
  }



  const where: Prisma.LeagueWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.league.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        manager: true,
        scoringSettings: true,
        teams: {
          include: {
            owner: true,
            _count: { select: { teamFighters: true } },
          },
        },
        draftSession: true,
        _count: true,
      },
    }),
    prisma.league.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result,
  };
};

const getAvailableLeagues = async (
  filter: ILeagueFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, leagueType, ...filterData } = filter;

  const andConditions: Prisma.LeagueWhereInput[] = [
    { deletedAt: null },
    { status: "DRAFTING" },
  ];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "code"].map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (leagueType === "PUBLIC") {
    andConditions.push({ passcode: null });
  } else if (leagueType === "PRIVATE") {
    andConditions.push({ passcode: { not: null } });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const where: Prisma.LeagueWhereInput = { AND: andConditions };

  // Fetch with member count to filter out full leagues
  const result = await prisma.league.findMany({
    where,
    orderBy: { [sortBy]: sortOrder },
    include: {
      _count: { select: { members: true, teams: true } },
      manager: { select: { id: true, name: true, avatarUrl: true } },
      scoringSettings: true,
    },
  });

  // Filter out full leagues and apply pagination
  const filtered = result
    .filter((l) => l._count.members < l.memberLimit)
    .map((l) => ({
      ...l,
      isPrivate: l.passcode !== null,
      passcode: undefined,
    }));

  const paginatedData = filtered.slice(skip, skip + limit);
  const total = filtered.length;

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: paginatedData,
  };
};


const getMyLeagues = async (userId: string) => {
  const memberships = await prisma.leagueMember.findMany({
    where: { userId },
    include: {
      league: {
        include: {
          _count: { select: { members: true } },
          teams: {
            where: { ownerId: userId },
            select: { id: true, name: true, totalPoints: true, rank: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  });

  return memberships.map((m) => ({
    ...m.league,
    myTeam: m.league.teams[0] || null,
    isPrivate: m.league.passcode !== null,
    passcode: undefined,
  }));
};

const getLeagueById = async (id: string) => {
  const result = await prisma.league.findUnique({
    where: { id, deletedAt: null },
    include: {
      manager: { select: { id: true, name: true, avatarUrl: true } },
      scoringSettings: true,
      draftSession: true,
      teams: {
        orderBy: { totalPoints: "desc" },
        include: {
          owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
          teamFighters: { include: { fighter: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });
  if (!result) throw new ApiError(404, "League not found");
  return { ...result, isPrivate: result.passcode !== null, passcode: undefined };
};

const joinLeague = async (userId: string, payload: IJoinLeaguePayload) => {
  const league = await prisma.league.findUnique({
    where: { code: payload.code, deletedAt: null },
    include: { _count: { select: { members: true } } },
  });

  if (!league) throw new ApiError(404, "League not found with this code");
  if (league.status === "COMPLETED" || league.status === "ARCHIVED") {
    throw new ApiError(400, "This league is no longer active");
  }
  if (league._count.members >= league.memberLimit) {
    throw new ApiError(400, "This league is full");
  }

  // Check if user already joined
  const existing = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId } },
  });
  if (existing) throw new ApiError(409, "You have already joined this league");

  // Validate passcode for private leagues
  if (league.passcode && league.passcode !== payload.passcode) {
    throw new ApiError(403, "Invalid passcode");
  }

  return prisma.$transaction(async (tx) => {
    await tx.leagueMember.create({
      data: { leagueId: league.id, userId },
    });
    const team = await tx.team.create({
      data: {
        leagueId: league.id,
        ownerId: userId,
        name: payload.teamName,
      },
    });
    return { league, team };
  });
};

const joinQuickLeague = async (userId: string, teamName: string) => {
  // 1. Check if user is already in an active system-generated league
  const existingMembership = await prisma.leagueMember.findFirst({
    where: {
      userId,
      league: {
        isSystemGenerated: true,
        status: { notIn: ["COMPLETED", "ARCHIVED"] },
        deletedAt: null,
      },
    },
    include: { league: true },
  });

  if (existingMembership) {
    throw new ApiError(409, "You are already a member of an active system-generated league");
  }

  // 2. Find the one and only active system-generated league that isn't full
  const candidateLeagues = await prisma.league.findMany({
    where: {
      isSystemGenerated: true,
      status: "DRAFTING",
      deletedAt: null,
    },
    include: { _count: { select: { members: true } } },
    orderBy: { createdAt: "desc" },
  });

  let targetLeague = candidateLeagues.find(
    (l) => l._count.members < l.memberLimit
  );

  // 3. Create a new one if no available league exists
  if (!targetLeague) {
    let code = generateCode();
    while (await prisma.league.findUnique({ where: { code } })) {
      code = generateCode();
    }

    targetLeague = await prisma.$transaction(async (tx) => {
      const newLeague = await tx.league.create({
        data: {
          name: "UFC Quick League",
          code,
          managerId: userId, // First joiner is technically manager, though it's system-generated
          memberLimit: 10,
          rosterSize: 5,
          status: "DRAFTING",
          isSystemGenerated: true,
        },
      });

      await tx.leagueScoringSettings.create({ data: { leagueId: newLeague.id } });
      await tx.draftSession.create({
        data: {
          leagueId: newLeague.id,
          status: "WAITING",
          secondsPerPick: 60,
          totalRounds: 5,
        },
      });

      return { ...newLeague, _count: { members: 0 } };
    });
  }

  // 4. Atomic join within a transaction to handle concurrency
  return prisma.$transaction(async (tx) => {
    // Re-verify membership and count inside transaction
    const [isMember, currentCount] = await Promise.all([
      tx.leagueMember.findUnique({
        where: { leagueId_userId: { leagueId: targetLeague!.id, userId } },
      }),
      tx.leagueMember.count({ where: { leagueId: targetLeague!.id } }),
    ]);

    if (isMember) {
      throw new ApiError(409, "You are already a member of this league");
    }

    if (currentCount >= targetLeague!.memberLimit) {
      throw new ApiError(400, "The league just filled up. Please try again.");
    }

    await tx.leagueMember.create({
      data: { leagueId: targetLeague!.id, userId },
    });

    const team = await tx.team.create({
      data: {
        leagueId: targetLeague!.id,
        ownerId: userId,
        name: teamName,
      },
    });

    return { league: targetLeague, team };
  });
};

const updateLeague = async (
  leagueId: string,
  managerId: string,
  payload: Prisma.LeagueUpdateInput
) => {
  const league = await prisma.league.findUnique({
    where: { id: leagueId, deletedAt: null },
  });
  if (!league) throw new ApiError(404, "League not found");
  if (league.managerId !== managerId)
    throw new ApiError(403, "Only the league manager can update this league");

  return prisma.league.update({ where: { id: leagueId }, data: payload });
};

const leaveLeague = async (leagueId: string, userId: string) => {
  const league = await prisma.league.findUnique({
    where: { id: leagueId, deletedAt: null },
    include: { teams: true },
  });

  if (!league) throw new ApiError(404, "League not found");

  const userTeam = await prisma.team.findUnique({
    where: { leagueId_ownerId: { leagueId, ownerId: userId } },
  });

  if (!userTeam) throw new ApiError(404, "You don't have a team in this league");

  return await prisma.$transaction(async (tx) => {
    // 1. Delete the team (cascades to fighters, picks, etc.)
    await tx.team.delete({ where: { id: userTeam.id } });

    // 2. Delete the league membership
    await tx.leagueMember.delete({
      where: { leagueId_userId: { leagueId, userId } },
    });

    // 3. If the user is the manager, delete the entire league (soft delete)
    if (league.managerId === userId) {
      await tx.league.update({
        where: { id: leagueId },
        data: { deletedAt: new Date() },
      });
      return { message: "Left league and dissolved it (as manager)" };
    }

    return { message: "Successfully left the league" };
  });
};

const deleteLeague = async (
  leagueId: string,
  userId: string,
  role: string
) => {
  const league = await prisma.league.findUnique({
    where: { id: leagueId, deletedAt: null },
  });
  if (!league) throw new ApiError(404, "League not found");
  if (role !== "ADMIN" && league.managerId !== userId) {
    throw new ApiError(403, "You don't have permission to delete this league");
  }
  return prisma.league.update({
    where: { id: leagueId },
    data: { deletedAt: new Date() },
  });
};


const getAvailableFighters = async (
  leagueId: string,
  filter: { searchTerm?: string; divisionId?: string },
  options: IPaginationOptions
) => {
  const { limit, page, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  // Find all fighters already assigned to any team in this league
  const assignedFighterIds = (
    await prisma.teamFighter.findMany({
      where: { team: { leagueId } },
      select: { fighterId: true },
    })
  ).map((tf) => tf.fighterId);

  const andConditions: Prisma.FighterWhereInput[] = [
    { isActive: true },
    { id: { notIn: assignedFighterIds } },
  ];

  if (filter.searchTerm) {
    andConditions.push({
      OR: ["name", "nickname"].map((field) => ({
        [field]: { contains: filter.searchTerm, mode: "insensitive" },
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
      orderBy: { [sortBy || "rank"]: sortOrder || "asc" },
      include: { division: true },
    }),
    prisma.fighter.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result,
  };
};

const removeFighterFromTeam = async (leagueId: string, userId: string, fighterId: string) => {
  const team = await prisma.team.findUnique({
    where: { leagueId_ownerId: { leagueId, ownerId: userId } },
  });

  if (!team) throw new ApiError(404, "Team not found in this league");

  const teamFighter = await prisma.teamFighter.findUnique({
    where: { teamId_fighterId: { teamId: team.id, fighterId } },
  });

  if (!teamFighter) throw new ApiError(400, "The fighter is not on your team");

  return prisma.$transaction(async (tx) => {
    // Record in history
    await tx.droppedFighter.create({
      data: {
        teamId: team.id,
        fighterId,
        pointsEarned: teamFighter.points,
      },
    });

    // Remove from team
    return tx.teamFighter.delete({
      where: { teamId_fighterId: { teamId: team.id, fighterId } },
    });
  });
};

const addFighterToTeam = async (leagueId: string, userId: string, fighterId: string) => {
  const team = await prisma.team.findUnique({
    where: { leagueId_ownerId: { leagueId, ownerId: userId } },
    include: { _count: { select: { teamFighters: true } } },
  });

  if (!team) throw new ApiError(404, "Team not found in this league");

  // Check roster size
  const league = await prisma.league.findUnique({ where: { id: leagueId } });
  if (team._count.teamFighters >= (league?.rosterSize || 5)) {
    throw new ApiError(400, "Your team is already at full capacity");
  }

  // Check availability
  const isAssigned = await prisma.teamFighter.findFirst({
    where: { team: { leagueId }, fighterId },
  });
  if (isAssigned) throw new ApiError(400, "This fighter is already assigned to another team");

  const fighter = await prisma.fighter.findUnique({ where: { id: fighterId } });
  if (!fighter || !fighter.isActive) throw new ApiError(404, "Fighter not found or inactive");

  return prisma.teamFighter.create({
    data: { teamId: team.id, fighterId },
    include: { fighter: true },
  });
};

export const LeagueService = {
  createLeague,
  getAllLeagues,
  getMyLeagues,
  getLeagueById,
  joinLeague,
  joinQuickLeague,
  updateLeague,
  deleteLeague,
  leaveLeague,
  getAvailableFighters,
  addFighterToTeam,
  removeFighterFromTeam,
  getAvailableLeagues,
  getAdminLeagues,
};


