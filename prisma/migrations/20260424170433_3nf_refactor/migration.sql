-- CreateEnum
CREATE TYPE "TradeStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'VETOED');

-- CreateEnum
CREATE TYPE "TradeSide" AS ENUM ('SENDER_OFFERS', 'RECEIVER_OFFERS');

-- AlterTable
ALTER TABLE "draft_sessions" ADD COLUMN     "turnStartedAt" TIMESTAMP(3),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "league_members" ADD COLUMN     "isAutoPickEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "team_fighters" ADD COLUMN     "points" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "dropped_fighters" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "pointsEarned" INTEGER NOT NULL DEFAULT 0,
    "droppedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dropped_fighters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trades" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "status" "TradeStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_items" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "side" "TradeSide" NOT NULL,

    CONSTRAINT "trade_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trade_vetos" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_vetos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "draft_pick_queues" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "fighterId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_pick_queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_state" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "lastResultUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_state_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "dropped_fighters_teamId_idx" ON "dropped_fighters"("teamId");

-- CreateIndex
CREATE INDEX "dropped_fighters_fighterId_idx" ON "dropped_fighters"("fighterId");

-- CreateIndex
CREATE INDEX "trades_leagueId_idx" ON "trades"("leagueId");

-- CreateIndex
CREATE INDEX "trades_senderId_idx" ON "trades"("senderId");

-- CreateIndex
CREATE INDEX "trades_receiverId_idx" ON "trades"("receiverId");

-- CreateIndex
CREATE INDEX "trades_status_idx" ON "trades"("status");

-- CreateIndex
CREATE INDEX "trade_items_tradeId_idx" ON "trade_items"("tradeId");

-- CreateIndex
CREATE INDEX "trade_items_fighterId_idx" ON "trade_items"("fighterId");

-- CreateIndex
CREATE UNIQUE INDEX "trade_items_tradeId_fighterId_key" ON "trade_items"("tradeId", "fighterId");

-- CreateIndex
CREATE INDEX "trade_vetos_tradeId_idx" ON "trade_vetos"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "trade_vetos_tradeId_userId_key" ON "trade_vetos"("tradeId", "userId");

-- CreateIndex
CREATE INDEX "draft_pick_queues_userId_leagueId_priority_idx" ON "draft_pick_queues"("userId", "leagueId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "draft_pick_queues_userId_leagueId_fighterId_key" ON "draft_pick_queues"("userId", "leagueId", "fighterId");

-- AddForeignKey
ALTER TABLE "dropped_fighters" ADD CONSTRAINT "dropped_fighters_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dropped_fighters" ADD CONSTRAINT "dropped_fighters_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "fighters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "leagues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trades" ADD CONSTRAINT "trades_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_items" ADD CONSTRAINT "trade_items_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "fighters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_vetos" ADD CONSTRAINT "trade_vetos_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "trades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trade_vetos" ADD CONSTRAINT "trade_vetos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_pick_queues" ADD CONSTRAINT "draft_pick_queues_fighterId_fkey" FOREIGN KEY ("fighterId") REFERENCES "fighters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "draft_pick_queues" ADD CONSTRAINT "draft_pick_queues_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
