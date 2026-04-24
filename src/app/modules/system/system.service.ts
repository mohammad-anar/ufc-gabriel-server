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

export const SystemService = {
  getLockdownStatus,
  enableLockdown,
  disableLockdown,
  setLastResultUpdate,
};
