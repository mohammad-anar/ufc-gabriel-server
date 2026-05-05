/*
  Warnings:

  - You are about to drop the column `isFiveRoundFight` on the `bouts` table. All the data in the column will be lost.
  - You are about to drop the column `order` on the `bouts` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "bouts_eventId_order_idx";

-- AlterTable
ALTER TABLE "bouts" DROP COLUMN "isFiveRoundFight",
DROP COLUMN "order";
