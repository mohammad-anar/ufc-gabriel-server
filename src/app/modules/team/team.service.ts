import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";

const getMyTeams = async (ownerId: string) => {
  return prisma.team.findMany({
    where: { ownerId },
    include: {
      league: { select: { id: true, name: true, code: true, status: true } },
      _count: { select: { teamFighters: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

const getTeamById = async (id: string, requesterId: string, role: string) => {
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      league: { select: { id: true, name: true, status: true } },
      owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
      teamFighters: {
        include: { fighter: true },
        orderBy: { acquiredAt: "asc" },
      },
      boutScores: {
        orderBy: { createdAt: "desc" },
        include: { bout: { include: { event: true } } },
      },
    },
  });
  if (!team) throw new ApiError(404, "Team not found");

  // Only owner or admin can view full score details
  if (team.ownerId !== requesterId && role !== "ADMIN") {
    // Return limited public view
    const { boutScores, ...publicTeam } = team;
    return publicTeam;
  }

  return team;
};

const getLeaderboard = async (leagueId: string) => {
  const league = await prisma.league.findUnique({
    where: { id: leagueId, deletedAt: null },
  });
  if (!league) throw new ApiError(404, "League not found");

  const teams = await prisma.team.findMany({
    where: { leagueId },
    orderBy: { totalPoints: "desc" },
    include: {
      owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
      teamFighters: { select: { points: true, fighterId: true } },
      boutScores: true,
    },
  });

  // Calculate aggregated stats for each team
  const enrichedTeams = teams.map((team, index) => {
    const wins = team.boutScores.reduce((acc, s) => acc + s.winPoints, 0);
    const championship = team.boutScores.reduce((acc, s) => acc + s.championshipPoints, 0);
    const fiveRw = team.boutScores.reduce((acc, s) => acc + s.fiveRoundPoints, 0);
    const rw = team.boutScores.reduce((acc, s) => acc + s.rankedOpponentPoints, 0);
    const fin = team.boutScores.reduce((acc, s) => acc + s.finishBonus, 0);
    const cc = team.boutScores.reduce((acc, s) => acc + s.champVsChampPoints, 0);

    return {
      ...team,
      rank: index + 1,
      stats: {
        wins,
        championship,
        fiveRw,
        rw,
        fin,
        cc,
      },
    };
  });

  return enrichedTeams;
};

const updateTeam = async (
  teamId: string,
  ownerId: string,
  payload: Pick<Prisma.TeamUpdateInput, "name" | "iconGlyph">
) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new ApiError(404, "Team not found");
  if (team.ownerId !== ownerId)
    throw new ApiError(403, "Only the team owner can update this team");

  return prisma.team.update({ where: { id: teamId }, data: payload });
};

const dropFighter = async (teamId: string, fighterId: string, ownerId: string) => {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) throw new ApiError(404, "Team not found");
  if (team.ownerId !== ownerId)
    throw new ApiError(403, "Only the team owner can drop fighters");

  const teamFighter = await prisma.teamFighter.findUnique({
    where: { teamId_fighterId: { teamId, fighterId } },
  });

  if (!teamFighter) throw new ApiError(404, "Fighter is not on this team");

  return prisma.$transaction(async (tx) => {
    // 1. Move to DroppedFighter for 3NF history
    await tx.droppedFighter.create({
      data: {
        teamId,
        fighterId,
        pointsEarned: teamFighter.points,
      },
    });

    // 2. Subtract the points from the team's total
    await tx.team.update({
      where: { id: teamId },
      data: { totalPoints: { decrement: teamFighter.points } },
    });

    // 3. Delete the active relation
    await tx.teamFighter.delete({
      where: { teamId_fighterId: { teamId, fighterId } },
    });

    return { success: true };
  });
};

const getMyTeamByLeague = async (userId: string, leagueId: string) => {
  const team = await prisma.team.findFirst({
    where: { leagueId, ownerId: userId },
    include: {
      league: { select: { id: true, name: true, status: true } },
      owner: { select: { id: true, name: true, username: true, avatarUrl: true } },
      teamFighters: {
        include: { fighter: true },
        orderBy: { acquiredAt: "asc" },
      },
      boutScores: true,
    },
  });

  if (!team) throw new ApiError(404, "Team not found in this league");

  // Calculate aggregated stats for each fighter on this team
  const enrichedTeamFighters = team.teamFighters.map((tf) => {
    const fighterScores = team.boutScores.filter((s) => s.fighterId === tf.fighterId);

    return {
      ...tf,
      wins: fighterScores.reduce((acc, s) => acc + s.winPoints, 0),
      championship: fighterScores.reduce((acc, s) => acc + s.championshipPoints, 0),
      fiveRw: fighterScores.reduce((acc, s) => acc + s.fiveRoundPoints, 0),
      rw: fighterScores.reduce((acc, s) => acc + s.rankedOpponentPoints, 0),
      fin: fighterScores.reduce((acc, s) => acc + s.finishBonus, 0),
      cc: fighterScores.reduce((acc, s) => acc + s.champVsChampPoints, 0),
    };
  });

  return { ...team, teamFighters: enrichedTeamFighters };
};

export const TeamService = {
  getMyTeams,
  getTeamById,
  getLeaderboard,
  updateTeam,
  dropFighter,
  getMyTeamByLeague,
};
