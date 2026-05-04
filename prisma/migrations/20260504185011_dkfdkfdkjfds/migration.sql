/*
  Warnings:

  - You are about to drop the `bout_results` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "bout_results" DROP CONSTRAINT "bout_results_boutId_fkey";

-- DropForeignKey
ALTER TABLE "bout_results" DROP CONSTRAINT "bout_results_winnerId_fkey";

-- AlterTable
ALTER TABLE "league_scoring_settings" ADD COLUMN     "systemScoringSettingId" TEXT;

-- DropTable
DROP TABLE "bout_results";

-- CreateTable
CREATE TABLE "bout_outcomes" (
    "id" TEXT NOT NULL,
    "boutId" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "resultType" "BoutResultType" NOT NULL,
    "isFinish" BOOLEAN NOT NULL DEFAULT false,
    "isTitleFight" BOOLEAN NOT NULL DEFAULT false,
    "isChampionVsChampion" BOOLEAN NOT NULL DEFAULT false,
    "isWinnerAgainstRanked" BOOLEAN NOT NULL DEFAULT false,
    "isFiveRoundFight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bout_outcomes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_scoring_settings" (
    "id" TEXT NOT NULL,
    "winPoint" INTEGER NOT NULL DEFAULT 1,
    "finishBonus" INTEGER NOT NULL DEFAULT 1,
    "winningChampionshipBout" INTEGER NOT NULL DEFAULT 1,
    "championVsChampionWin" INTEGER NOT NULL DEFAULT 1,
    "winningAgainstRankedOpponent" INTEGER NOT NULL DEFAULT 1,
    "winningFiveRoundFight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_scoring_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bout_outcomes_boutId_key" ON "bout_outcomes"("boutId");

-- CreateIndex
CREATE INDEX "bout_outcomes_winnerId_idx" ON "bout_outcomes"("winnerId");

-- AddForeignKey
ALTER TABLE "bout_outcomes" ADD CONSTRAINT "bout_outcomes_boutId_fkey" FOREIGN KEY ("boutId") REFERENCES "bouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bout_outcomes" ADD CONSTRAINT "bout_outcomes_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "fighters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_scoring_settings" ADD CONSTRAINT "league_scoring_settings_systemScoringSettingId_fkey" FOREIGN KEY ("systemScoringSettingId") REFERENCES "system_scoring_settings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
