import { prisma } from "../../../helpers/prisma.js";

/**
 * After a bout result is posted, find every team that owns the winning fighter,
 * compute their points based on each league's scoring settings, and persist
 * TeamBoutScore rows + update Team.totalPoints — all in one transaction.
 */
export const calculateAndSaveScores = async (boutId: string): Promise<void> => {
  const bout = await prisma.bout.findUnique({
    where: { id: boutId },
    include: { event: true },
  });

  if (!bout || !bout.winnerId || !bout.result) return;

  // Find all team rosters that have the winning fighter
  const teamFighters = await prisma.teamFighter.findMany({
    where: { fighterId: bout.winnerId },
    include: { team: { include: { league: { include: { scoringSettings: true } } } } },
  });

  if (teamFighters.length === 0) return;

  await prisma.$transaction(async (tx) => {
    for (const tf of teamFighters) {
      const settings = tf.team.league.scoringSettings;
      if (!settings) continue;

      // Calculate points breakdown
      const winPoints = settings.winPoints;

      const isFinish =
        bout.result === "KO_TKO" || bout.result === "SUBMISSION";
      const finishBonus = isFinish ? settings.finishBonus : 0;

      const championshipPoints = bout.isTitleFight
        ? settings.winningChampionshipBout
        : 0;

      const champVsChampPoints = bout.isChampionVsChampion
        ? settings.championVsChampionWin
        : 0;

      const rankedOpponentPoints = bout.isWinnerAgainstRanked
        ? settings.winningAgainstRankedOpponent
        : 0;

      const fiveRoundPoints =
        bout.rounds === 5 ? settings.winningFiveRoundFight : 0;

      const totalPoints =
        winPoints +
        finishBonus +
        championshipPoints +
        champVsChampPoints +
        rankedOpponentPoints +
        fiveRoundPoints;

      // Create per-bout score record
      await tx.teamBoutScore.upsert({
        where: {
          teamId_boutId_fighterId: {
            teamId: tf.teamId,
            boutId,
            fighterId: bout.winnerId!,
          },
        },
        create: {
          teamId: tf.teamId,
          boutId,
          fighterId: bout.winnerId!,
          winPoints,
          finishBonus,
          championshipPoints,
          champVsChampPoints,
          rankedOpponentPoints,
          fiveRoundPoints,
          totalPoints,
        },
        update: {
          winPoints,
          finishBonus,
          championshipPoints,
          champVsChampPoints,
          rankedOpponentPoints,
          fiveRoundPoints,
          totalPoints,
        },
      });

      // Increment team's total points
      await tx.team.update({
        where: { id: tf.teamId },
        data: { totalPoints: { increment: totalPoints } },
      });

      // Track points this fighter earned while on this specific team
      await tx.teamFighter.update({
        where: { teamId_fighterId: { teamId: tf.teamId, fighterId: bout.winnerId! } },
        data: { points: { increment: totalPoints } },
      });
    }
  });
};
