import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { getIO } from "../../../helpers/socketHelper.js";

// ─── Get Lockdown Status ──────────────────────────────────────────────────────

const getLockdownStatus = async () => {
  const state = await prisma.systemState.findUnique({
    where: { id: 1 },
  });
  return {
    isLocked: state?.isLocked ?? false,
    lastResultUpdate: state?.lastResultUpdate ?? null,
  };
};

// ─── Enable Lockdown ──────────────────────────────────────────────────────────

const enableLockdown = async () => {
  const result = await prisma.systemState.upsert({
    where: { id: 1 },
    update: { isLocked: true },
    create: { id: 1, isLocked: true },
  });

  // Broadcast to all connected clients
  try {
    const io = getIO();
    io.emit("system:lockdown", { locked: true });
  } catch {
    // Socket may not be initialized in all environments — ignore
  }

  return result;
};

// ─── Disable Lockdown ─────────────────────────────────────────────────────────

const disableLockdown = async () => {
  const result = await prisma.systemState.upsert({
    where: { id: 1 },
    update: { isLocked: false },
    create: { id: 1, isLocked: false },
  });

  try {
    const io = getIO();
    io.emit("system:lockdown", { locked: false });
  } catch {
    // ignore
  }

  return result;
};

// ─── Update Last Result Update ─────────────────────────────────────────────────

const setLastResultUpdate = async (date: Date) => {
  return prisma.systemState.upsert({
    where: { id: 1 },
    update: { lastResultUpdate: date },
    create: { id: 1, lastResultUpdate: date },
  });
}

const getDashboardStats = async () => {
  const [totalLeagues, totalUsers, totalFighters, newUsersLast30Days] = await Promise.all([
    prisma.league.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.fighter.count({ where: { isActive: true } }),
    prisma.user.count({
      where: {
        deletedAt: null,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return {
    totalLeagues,
    totalUsers,
    totalFighters,
    newUsersLast30Days,
    userGrowthDelta: totalUsers > 0 ? ((newUsersLast30Days / totalUsers) * 100).toFixed(1) + "%" : "0%",
  };
};

export const SystemService = {
  getLockdownStatus,
  enableLockdown,
  disableLockdown,
  setLastResultUpdate,
  getDashboardStats,
};
