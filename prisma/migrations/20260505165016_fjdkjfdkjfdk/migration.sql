/*
  Warnings:

  - You are about to drop the column `corner` on the `bout_fighters` table. All the data in the column will be lost.
  - You are about to drop the column `isTitleFight` on the `bouts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "bout_fighters" DROP COLUMN "corner";

-- AlterTable
ALTER TABLE "bouts" DROP COLUMN "isTitleFight";
