import { Server, Socket } from "socket.io";

let io: Server | null = null;

// Store socket IDs per user
const socketMap: Map<string, Set<string>> = new Map();

export const initSocket = (server: any) => {
  io = new Server(server, {
    pingTimeout: 60000,
    cors: { origin: "*" },
  });

  io.on("connection", (socket: Socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Register user socket
    socket.on("register", (userId: string) => {
      if (!userId) return;
      if (!socketMap.has(userId)) socketMap.set(userId, new Set());
      socketMap.get(userId)!.add(socket.id);
      console.log(`✅ Registered socket ${socket.id} for user ${userId}`);
    });

    // Join a draft room
    socket.on("join_draft", (leagueId: string) => {
      if (!leagueId) return;
      socket.join(`draft:${leagueId}`);
      console.log(`📋 Socket ${socket.id} joined draft room: ${leagueId}`);
    });

    // Make a pick directly via Socket.IO
    socket.on("make_pick", async (data: { leagueId: string; fighterId: string }) => {
      try {
        const { leagueId, fighterId } = data;
        if (!leagueId || !fighterId) return;

        // 1. Find the user ID from the socket registration mapping
        let activeUserId: string | null = null;
        for (const [uid, sockets] of socketMap.entries()) {
          if (sockets.has(socket.id)) {
            activeUserId = uid;
            break;
          }
        }

        if (!activeUserId) {
          socket.emit("draft:error", { message: "Unauthenticated socket session" });
          return;
        }

        // 2. Check Saturday Lockdown Guard & League Status
        // We import Prisma dynamically or locally to avoid circular deps if needed
        const { prisma } = await import("./prisma.js");
        const systemState = await prisma.systemState.findUnique({ where: { id: 1 } });
        if (systemState?.isLocked) {
          socket.emit("draft:error", { message: "System is locked: UFC event in progress. Drafts are paused." });
          return;
        }

        const league = await prisma.league.findUnique({ where: { id: leagueId }, select: { status: true } });
        if (league?.status === "LOCKED") {
          socket.emit("draft:error", { message: "This specific league is currently locked." });
          return;
        }

        // 3. Execute the pick
        const { DraftService } = await import("../app/modules/draft/draft.service.js");
        await DraftService.pickFighter(leagueId, activeUserId, { fighterId });

      } catch (error: any) {
        socket.emit("draft:error", { message: error.message || "Failed to make pick" });
      }
    });

    // Leave a draft room
    socket.on("leave_draft", (leagueId: string) => {
      if (!leagueId) return;
      socket.leave(`draft:${leagueId}`);
      console.log(`📤 Socket ${socket.id} left draft room: ${leagueId}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
      for (const [userId, sockets] of socketMap.entries()) {
        if (sockets.has(socket.id)) {
          sockets.delete(socket.id);
          if (sockets.size === 0) socketMap.delete(userId);
        }
      }
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};

export const getSocketIds = (userId: string): string[] => {
  return Array.from(socketMap.get(userId) || []);
};

/**
 * Emit a draft event to all sockets in a draft room.
 * e.g. emitDraftEvent(leagueId, "draft:pick", { ... })
 */
export const emitDraftEvent = (leagueId: string, event: string, data: any) => {
  const socket = getIO();
  socket.to(`draft:${leagueId}`).emit(event, data);
};

/**
 * Emit a notification to a specific user.
 */
export const emitNotification = (userId: string, data: any) => {
  const socket = getIO();
  const socketIds = getSocketIds(userId);
  socketIds.forEach((id) => socket.to(id).emit("notification", data));
};
