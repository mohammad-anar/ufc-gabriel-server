/*
  Warnings:

  - You are about to drop the column `division` on the `fighters` table. All the data in the column will be lost.
  - Added the required column `divisionId` to the `fighters` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "fighters_division_idx";

-- DropIndex
DROP INDEX "fighters_division_rank_idx";

-- AlterTable
ALTER TABLE "fighters" DROP COLUMN "division",
ADD COLUMN     "divisionId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "divisions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "divisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "divisions_name_key" ON "divisions"("name");

-- CreateIndex
CREATE INDEX "fighters_divisionId_idx" ON "fighters"("divisionId");

-- CreateIndex
CREATE INDEX "fighters_divisionId_rank_idx" ON "fighters"("divisionId", "rank");

-- AddForeignKey
ALTER TABLE "fighters" ADD CONSTRAINT "fighters_divisionId_fkey" FOREIGN KEY ("divisionId") REFERENCES "divisions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
