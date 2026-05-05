/*
  Warnings:

  - You are about to drop the column `isChampionVsChampion` on the `bout_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `isFinish` on the `bout_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `isFiveRoundFight` on the `bout_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `isTitleFight` on the `bout_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `isWin` on the `bout_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `isWinnerAgainstRanked` on the `bout_outcomes` table. All the data in the column will be lost.
  - You are about to drop the column `resultType` on the `bout_outcomes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bout_outcomes" DROP COLUMN "isChampionVsChampion",
DROP COLUMN "isFinish",
DROP COLUMN "isFiveRoundFight",
DROP COLUMN "isTitleFight",
DROP COLUMN "isWin",
DROP COLUMN "isWinnerAgainstRanked",
DROP COLUMN "resultType",
ADD COLUMN     "championVsChampionWin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "finishBonus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "winPoint" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "winningAgainstRankedOpponent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "winningChampionshipBout" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "winningFiveRoundFight" BOOLEAN NOT NULL DEFAULT false;
