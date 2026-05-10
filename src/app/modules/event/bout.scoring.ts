import { prisma } from "../../../helpers/prisma.js";

/**
 * After a bout result is posted, find every team that owns the winning fighter,
 * compute their points based on each league's scoring settings and the admin's toggles,
 * and persist TeamBoutScore rows + update Team.totalPoints.
 */
export const calculateAndSaveScores = async (boutId: string): Promise<void> => {
  const bout = await prisma.bout.findUnique({
    where: { id: boutId },
    include: { outcome: true, boutFighters: true },
  });

  if (!bout) return;

  await prisma.$transaction(async (tx) => {
    // 1. Revert previous scores and fighter stats for this bout (if any)
    const existingScores = await tx.teamBoutScore.findMany({
      where: { boutId },
    });

    if (existingScores.length > 0 || bout.outcome) {
      // If we have an existing outcome, we need to revert fighter wins/losses
      const oldOutcome = bout.outcome;
      if (oldOutcome) {
        const winnerId = oldOutcome.winnerId;
        const loserId = bout.boutFighters.find(f => f.fighterId !== winnerId)?.fighterId;

        // Decrement winner's wins
        await tx.fighter.update({
          where: { id: winnerId },
          data: { wins: { decrement: 1 } },
        });

        // Decrement loser's losses
        if (loserId) {
          await tx.fighter.update({
            where: { id: loserId },
            data: { losses: { decrement: 1 } },
          });
        }
      }

      for (const score of existingScores) {
        // Subtract from team total
        await tx.team.update({
          where: { id: score.teamId },
          data: { totalPoints: { decrement: score.totalPoints } },
        });

        // Subtract from team-fighter link
        await tx.teamFighter.updateMany({
          where: { teamId: score.teamId, fighterId: score.fighterId },
          data: { points: { decrement: score.totalPoints } },
        });
      }

      // Delete old per-bout score records
      await tx.teamBoutScore.deleteMany({
        where: { boutId },
      });
    }

    // 2. If no current outcome (result was cleared), we are done
    if (!bout.outcome) return;

    const winnerId = bout.outcome.winnerId;
    const outcome = bout.outcome;
    const loserId = bout.boutFighters.find(f => f.fighterId !== winnerId)?.fighterId;

    // 3. Update overall Fighter stats
    await tx.fighter.update({
      where: { id: winnerId },
      data: { wins: { increment: 1 } },
    });

    if (loserId) {
      await tx.fighter.update({
        where: { id: loserId },
        data: { losses: { increment: 1 } },
      });
    }

    // 4. Find all team rosters that have the winning fighter
    const teamFighters = await tx.teamFighter.findMany({
      where: { fighterId: winnerId },
      include: { team: { include: { league: { include: { scoringSettings: true } } } } },
    });

    if (teamFighters.length === 0) return;

    // Fetch global system scoring settings
    const systemSettings = await tx.systemScoringSetting.findFirst();

    for (const tf of teamFighters) {
      let settings = tf.team.league.scoringSettings;

      // If system settings exist and league settings exist, ensure they are in sync
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

      // Calculate points breakdown based on outcome flags
      const winPoints = outcome.winPoint ? settings.winPoints : 0;
      const finishBonus = outcome.finishBonus ? settings.finishBonus : 0;
      const championshipPoints = outcome.winningChampionshipBout ? settings.winningChampionshipBout : 0;
      const champVsChampPoints = outcome.championVsChampionWin ? settings.championVsChampionWin : 0;
      const rankedOpponentPoints = outcome.winningAgainstRankedOpponent ? settings.winningAgainstRankedOpponent : 0;
      const fiveRoundPoints = outcome.winningFiveRoundFight ? settings.winningFiveRoundFight : 0;

      const totalPoints =
        winPoints +
        finishBonus +
        championshipPoints +
        champVsChampPoints +
        rankedOpponentPoints +
        fiveRoundPoints;

      // Create new per-bout score record
      await tx.teamBoutScore.create({
        data: {
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
      });

      // Increment team's total points
      await tx.team.update({
        where: { id: tf.teamId },
        data: { totalPoints: { increment: totalPoints } },
      });

      // Increment fighter's points on this specific team
      await tx.teamFighter.update({
        where: { teamId_fighterId: { teamId: tf.teamId, fighterId: winnerId } },
        data: { points: { increment: totalPoints } },
      });
    }
  });
};
