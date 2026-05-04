import { prisma } from "../../../helpers/prisma.js";

/**
 * After a bout result is posted, find every team that owns the winning fighter,
 * compute their points based on each league's scoring settings, and persist
 * TeamBoutScore rows + update Team.totalPoints — all in one transaction.
 */
export const calculateAndSaveScores = async (boutId: string): Promise<void> => {
  const bout = await prisma.bout.findUnique({
    where: { id: boutId },
    include: { event: true, outcome: true },
  });

  if (!bout || !bout.outcome) return;

  const winnerId = bout.outcome.winnerId;

  // Find all team rosters that have the winning fighter
  const teamFighters = await prisma.teamFighter.findMany({
    where: { fighterId: winnerId },
    include: { team: { include: { league: { include: { scoringSettings: true } } } } },
  });

  if (teamFighters.length === 0) return;

  // Fetch global system scoring settings
  const systemSettings = await prisma.systemScoringSetting.findFirst();

  await prisma.$transaction(async (tx) => {
    for (const tf of teamFighters) {
      let settings = tf.team.league.scoringSettings;

      // If system settings exist, update the league's settings to stay in sync
      if (systemSettings && settings) {
        settings = await tx.leagueScoringSettings.update({
          where: { id: settings.id },
          data: {
            winPoints: systemSettings.winPoint,
            finishBonus: systemSettings.finishBonus,
            winningChampionshipBout: systemSettings.winningChampionshipBout,
            championVsChampionWin: systemSettings.championVsChampionWin,
            winningAgainstRankedOpponent: systemSettings.winningAgainstRankedOpponent,
            winningFiveRoundFight: systemSettings.winningFiveRoundFight,
            systemScoringSettingId: systemSettings.id,
          },
        });
      }

      if (!settings) continue;

      // Calculate points breakdown
      const winPoints = settings.winPoints;

      const finishBonus = bout.outcome!.isFinish ? settings.finishBonus : 0;

      const championshipPoints = bout.outcome!.isTitleFight
        ? settings.winningChampionshipBout
        : 0;

      const champVsChampPoints = bout.outcome!.isChampionVsChampion
        ? settings.championVsChampionWin
        : 0;

      const rankedOpponentPoints = bout.outcome!.isWinnerAgainstRanked
        ? settings.winningAgainstRankedOpponent
        : 0;

      const fiveRoundPoints = bout.outcome!.isFiveRoundFight
        ? settings.winningFiveRoundFight
        : 0;

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
            fighterId: winnerId,
          },
        },
        create: {
          teamId: tf.teamId,
          boutId,
          fighterId: winnerId,
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
        where: { teamId_fighterId: { teamId: tf.teamId, fighterId: winnerId } },
        data: { points: { increment: totalPoints } },
      });
    }
  });
};
