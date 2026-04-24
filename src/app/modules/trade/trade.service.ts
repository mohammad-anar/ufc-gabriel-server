import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { ICreateTradePayload } from "./trade.interface.js";
import { emitNotification } from "../../../helpers/socketHelper.js";

// ─── Create Trade Offer ───────────────────────────────────────────────────────

const createTrade = async (
  leagueId: string,
  senderId: string,
  payload: ICreateTradePayload
) => {

  const { receiverId, senderFighterIds, receiverFighterIds, message } = payload;

  if (senderId === receiverId) {
    throw new ApiError(400, "You cannot trade with yourself");
  }

  // Verify both users are in this league
  const [senderMember, receiverMember] = await Promise.all([
    prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: senderId } },
    }),
    prisma.leagueMember.findUnique({
      where: { leagueId_userId: { leagueId, userId: receiverId } },
    }),
  ]);
  if (!senderMember) throw new ApiError(403, "You are not a member of this league");
  if (!receiverMember) throw new ApiError(404, "Receiver is not a member of this league");

  // Verify sender owns senderFighterIds
  const senderTeam = await prisma.team.findUnique({
    where: { leagueId_ownerId: { leagueId, ownerId: senderId } },
    include: { teamFighters: { select: { fighterId: true } } },
  });
  if (!senderTeam) throw new ApiError(404, "Your team was not found in this league");

  const senderRoster = new Set(senderTeam.teamFighters.map((f) => f.fighterId));
  for (const id of senderFighterIds) {
    if (!senderRoster.has(id)) {
      throw new ApiError(400, `Fighter ${id} is not on your roster`);
    }
  }

  // Verify receiver owns receiverFighterIds
  const receiverTeam = await prisma.team.findUnique({
    where: { leagueId_ownerId: { leagueId, ownerId: receiverId } },
    include: { teamFighters: { select: { fighterId: true } } },
  });
  if (!receiverTeam) throw new ApiError(404, "Receiver team not found");

  const receiverRoster = new Set(receiverTeam.teamFighters.map((f) => f.fighterId));
  for (const id of receiverFighterIds) {
    if (!receiverRoster.has(id)) {
      throw new ApiError(400, `Fighter ${id} is not on the receiver's roster`);
    }
  }

  // Check for existing pending trade between the same parties in this league
  const existing = await prisma.trade.findFirst({
    where: {
      leagueId,
      senderId,
      receiverId,
      status: "PENDING",
    },
  });
  if (existing) {
    throw new ApiError(409, "You already have a pending trade offer with this user in this league");
  }

  const trade = await prisma.trade.create({
    data: {
      leagueId,
      senderId,
      receiverId,
      message,
      status: "PENDING",
      items: {
        create: [
          ...senderFighterIds.map((id) => ({ fighterId: id, side: "SENDER_OFFERS" as any })),
          ...receiverFighterIds.map((id) => ({ fighterId: id, side: "RECEIVER_OFFERS" as any })),
        ]
      }
    },
    include: {
      sender: { select: { id: true, name: true, username: true } },
      receiver: { select: { id: true, name: true, username: true } },
    },
  });

  // Notify receiver
  emitNotification(receiverId, {
    type: "TRADE_OFFER",
    title: "New Trade Offer",
    message: `${trade.sender.name} sent you a trade offer in your league`,
    tradeId: trade.id,
    leagueId,
  });

  return trade;
};

// ─── Get Trades for a League ──────────────────────────────────────────────────

const getLeagueTrades = async (leagueId: string, status?: string) => {
  const where: any = { leagueId };
  if (status) where.status = status;

  return prisma.trade.findMany({
    where,
    include: {
      sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, username: true, avatarUrl: true } },
      vetos: { include: { user: { select: { id: true, name: true, username: true } } } },
      items: { include: { fighter: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─── Get Single Trade ─────────────────────────────────────────────────────────

const getTradeById = async (tradeId: string) => {
  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      sender: { select: { id: true, name: true, username: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, username: true, avatarUrl: true } },
      vetos: { include: { user: { select: { id: true, name: true, username: true } } } },
      items: { include: { fighter: true } },
    },
  });
  if (!trade) throw new ApiError(404, "Trade not found");
  return trade;
};

// ─── Accept Trade ─────────────────────────────────────────────────────────────

const acceptTrade = async (tradeId: string, receiverId: string) => {
  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: { items: true },
  });
  if (!trade) throw new ApiError(404, "Trade not found");
  if (trade.receiverId !== receiverId) {
    throw new ApiError(403, "Only the trade receiver can accept this trade");
  }
  if (trade.status !== "PENDING") {
    throw new ApiError(400, `Trade is already ${trade.status.toLowerCase()}`);
  }

  // Execute the swap in a transaction
  return prisma.$transaction(async (tx) => {
    const [senderTeam, receiverTeam] = await Promise.all([
      tx.team.findUnique({
        where: { leagueId_ownerId: { leagueId: trade.leagueId, ownerId: trade.senderId } },
      }),
      tx.team.findUnique({
        where: { leagueId_ownerId: { leagueId: trade.leagueId, ownerId: trade.receiverId } },
      }),
    ]);
    if (!senderTeam || !receiverTeam) throw new ApiError(500, "Teams not found for trade execution");

    const senderFighterIds = trade.items.filter(i => i.side === "SENDER_OFFERS").map(i => i.fighterId);
    const receiverFighterIds = trade.items.filter(i => i.side === "RECEIVER_OFFERS").map(i => i.fighterId);

    // Remove fighters from sender → give to receiver
    for (const fId of senderFighterIds) {
      const tf = await tx.teamFighter.findUnique({
        where: { teamId_fighterId: { teamId: senderTeam.id, fighterId: fId } },
      });
      if (!tf) throw new ApiError(400, `Sender no longer owns fighter ${fId}`);
      // Subtract points from sender team
      await tx.team.update({
        where: { id: senderTeam.id },
        data: { totalPoints: { decrement: tf.points } },
      });
      await tx.teamFighter.delete({
        where: { teamId_fighterId: { teamId: senderTeam.id, fighterId: fId } },
      });
      await tx.teamFighter.create({
        data: { teamId: receiverTeam.id, fighterId: fId, points: 0 },
      });
    }

    // Remove fighters from receiver → give to sender
    for (const fId of receiverFighterIds) {
      const tf = await tx.teamFighter.findUnique({
        where: { teamId_fighterId: { teamId: receiverTeam.id, fighterId: fId } },
      });
      if (!tf) throw new ApiError(400, `Receiver no longer owns fighter ${fId}`);
      // Subtract points from receiver team
      await tx.team.update({
        where: { id: receiverTeam.id },
        data: { totalPoints: { decrement: tf.points } },
      });
      await tx.teamFighter.delete({
        where: { teamId_fighterId: { teamId: receiverTeam.id, fighterId: fId } },
      });
      await tx.teamFighter.create({
        data: { teamId: senderTeam.id, fighterId: fId, points: 0 },
      });
    }

    const updatedTrade = await tx.trade.update({
      where: { id: tradeId },
      data: { status: "ACCEPTED" },
    });

    // Notify sender
    emitNotification(trade.senderId, {
      type: "TRADE_ACCEPTED",
      title: "Trade Accepted",
      message: "Your trade offer was accepted!",
      tradeId,
      leagueId: trade.leagueId,
    });

    return updatedTrade;
  });
};

// ─── Reject Trade ─────────────────────────────────────────────────────────────

const rejectTrade = async (tradeId: string, userId: string) => {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) throw new ApiError(404, "Trade not found");

  // Only receiver can formally reject
  if (trade.receiverId !== userId) {
    throw new ApiError(403, "Only the receiver can reject this trade");
  }
  if (trade.status !== "PENDING") {
    throw new ApiError(400, `Trade is already ${trade.status.toLowerCase()}`);
  }

  const updated = await prisma.trade.update({
    where: { id: tradeId },
    data: { status: "REJECTED" },
  });

  emitNotification(trade.senderId, {
    type: "TRADE_REJECTED",
    title: "Trade Rejected",
    message: "Your trade offer was rejected.",
    tradeId,
    leagueId: trade.leagueId,
  });

  return updated;
};

// ─── Cancel Trade (sender cancels their own pending offer) ────────────────────

const cancelTrade = async (tradeId: string, senderId: string) => {
  const trade = await prisma.trade.findUnique({ where: { id: tradeId } });
  if (!trade) throw new ApiError(404, "Trade not found");

  if (trade.senderId !== senderId) {
    throw new ApiError(403, "Only the sender can cancel this trade");
  }
  if (trade.status !== "PENDING") {
    throw new ApiError(400, `Cannot cancel a trade with status: ${trade.status}`);
  }

  return prisma.trade.update({
    where: { id: tradeId },
    data: { status: "REJECTED" }, // Use REJECTED to represent cancellation
  });
};

// ─── Veto Trade ───────────────────────────────────────────────────────────────

const vetoTrade = async (tradeId: string, userId: string) => {
  const trade = await prisma.trade.findUnique({
    where: { id: tradeId },
    include: {
      vetos: true,
      // Count league members to determine veto threshold
    },
  });
  if (!trade) throw new ApiError(404, "Trade not found");
  if (trade.status !== "PENDING") {
    throw new ApiError(400, "Only PENDING trades can be vetoed");
  }

  // Must be a league member (but NOT the sender or receiver)
  const member = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: trade.leagueId, userId } },
  });
  if (!member) throw new ApiError(403, "You are not a member of this league");
  if (trade.senderId === userId || trade.receiverId === userId) {
    throw new ApiError(403, "Trade participants cannot veto their own trade");
  }

  // Prevent duplicate veto
  const alreadyVetoed = trade.vetos.some((v) => v.userId === userId);
  if (alreadyVetoed) throw new ApiError(409, "You have already vetoed this trade");

  // Get total league member count for veto threshold
  const memberCount = await prisma.leagueMember.count({
    where: { leagueId: trade.leagueId },
  });
  // Veto threshold: floor(memberCount / 2) — majority of non-participants
  const vetoThreshold = Math.floor(memberCount / 2);

  return prisma.$transaction(async (tx) => {
    await tx.tradeVeto.create({ data: { tradeId, userId } });

    const currentVetoCount = trade.vetos.length + 1;

    if (currentVetoCount >= vetoThreshold) {
      const updated = await tx.trade.update({
        where: { id: tradeId },
        data: { status: "VETOED" },
      });

      // Notify both parties
      [trade.senderId, trade.receiverId].forEach((uid) =>
        emitNotification(uid, {
          type: "TRADE_VETOED",
          title: "Trade Vetoed",
          message: `Your trade was vetoed by the league (${currentVetoCount}/${vetoThreshold} required vetos)`,
          tradeId,
          leagueId: trade.leagueId,
        })
      );

      return { ...updated, vetoCount: currentVetoCount, vetoed: true };
    }

    return {
      tradeId,
      vetoCount: currentVetoCount,
      vetoThreshold,
      vetoed: false,
      message: `Veto recorded (${currentVetoCount}/${vetoThreshold} required to cancel)`,
    };
  });
};

export const TradeService = {
  createTrade,
  getLeagueTrades,
  getTradeById,
  acceptTrade,
  rejectTrade,
  cancelTrade,
  vetoTrade,
};
