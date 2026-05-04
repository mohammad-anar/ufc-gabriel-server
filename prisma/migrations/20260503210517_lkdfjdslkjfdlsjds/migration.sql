/*
  Warnings:

  - You are about to drop the column `isChampionVsChampion` on the `bouts` table. All the data in the column will be lost.
  - You are about to drop the column `isWinnerAgainstRanked` on the `bouts` table. All the data in the column will be lost.
  - You are about to drop the column `result` on the `bouts` table. All the data in the column will be lost.
  - You are about to drop the column `winnerId` on the `bouts` table. All the data in the column will be lost.
  - You are about to drop the column `decisionWins` on the `fighters` table. All the data in the column will be lost.
  - You are about to drop the column `formerChampionDivisions` on the `fighters` table. All the data in the column will be lost.
  - You are about to drop the column `isChampion` on the `fighters` table. All the data in the column will be lost.
  - You are about to drop the column `koWins` on the `fighters` table. All the data in the column will be lost.
  - You are about to drop the column `reach` on the `fighters` table. All the data in the column will be lost.
  - You are about to drop the column `submissionWins` on the `fighters` table. All the data in the column will be lost.
  - You are about to drop the column `titleDefenses` on the `fighters` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BoutResultType" AS ENUM ('KO_TKO', 'SUBMISSION', 'DECISION_UNANIMOUS', 'DECISION_SPLIT', 'DECISION_MAJORITY', 'DRAW', 'NO_CONTEST', 'DQ');

-- DropForeignKey
ALTER TABLE "bouts" DROP CONSTRAINT "bouts_winnerId_fkey";

-- DropIndex
DROP INDEX "bouts_winnerId_idx";

-- DropIndex
DROP INDEX "fighters_isChampion_idx";

-- AlterTable
ALTER TABLE "bouts" DROP COLUMN "isChampionVsChampion",
DROP COLUMN "isWinnerAgainstRanked",
DROP COLUMN "result",
DROP COLUMN "winnerId",
ADD COLUMN     "isFiveRoundFight" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "divisions" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "fighters" DROP COLUMN "decisionWins",
DROP COLUMN "formerChampionDivisions",
DROP COLUMN "isChampion",
DROP COLUMN "koWins",
DROP COLUMN "reach",
DROP COLUMN "submissionWins",
DROP COLUMN "titleDefenses",
ADD COLUMN     "avgL5" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bio" TEXT;

-- DropEnum
DROP TYPE "BoutResult";

-- CreateTable
CREATE TABLE "bout_results" (
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

    CONSTRAINT "bout_results_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bout_results_boutId_key" ON "bout_results"("boutId");

-- CreateIndex
CREATE INDEX "bout_results_winnerId_idx" ON "bout_results"("winnerId");

-- AddForeignKey
ALTER TABLE "bout_results" ADD CONSTRAINT "bout_results_boutId_fkey" FOREIGN KEY ("boutId") REFERENCES "bouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bout_results" ADD CONSTRAINT "bout_results_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "fighters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
