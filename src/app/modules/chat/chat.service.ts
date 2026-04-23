import { MessageType } from "../../../types/enum.js";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";

const createRoom = async (
  payload: {
    bookingId?: string;
    userId: string;
    workshopId: string;
    name?: string;
  },
  tx?: any,
) => {
  const client = tx || prisma;

  if (payload.bookingId) {
    // Check if room already exists for this booking
    const existingRoom = await client.room.findUnique({
      where: { bookingId: payload.bookingId },
    });

    if (existingRoom) {
      return existingRoom;
    }
  } else {
    // Check if room already exists for this user-workshop pair without a booking
    const existingRoom = await client.room.findFirst({
      where: {
        userId: payload.userId,
        workshopId: payload.workshopId,
        bookingId: null,
      },
    });

    if (existingRoom) {
      return existingRoom;
    }
  }

  const result = await client.room.create({
    data: payload as any,
  });

  return result;
};

const getRoomById = async (id: string) => {
  const result = await prisma.room.findUniqueOrThrow({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      workshop: { select: { id: true, workshopName: true, avatar: true } },
      booking: true,
      lastMessage: true,
    },
  });

  if (result.lastMessage) {
    (result.lastMessage as any).sender =
      result.lastMessage.senderId === result.userId
        ? result.user
        : {
            id: result.workshop.id,
            name: (result.workshop as any).workshopName,
            avatar: result.workshop.avatar,
          };
  }

  return result;
};

const getUserRooms = async (userId: string) => {
  const rooms = await prisma.room.findMany({
    where: { userId },
    include: {
      workshop: {
        select: { id: true, workshopName: true, email: true, avatar: true },
      },
      user: { select: { id: true, name: true, email: true, avatar: true } },
      lastMessage: true,
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              isRead: false,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return rooms.map((room) => {
    const { _count, ...rest } = room;
    if (room.lastMessage) {
      (room.lastMessage as any).sender =
        room.lastMessage.senderId === room.userId
          ? room.user
          : {
              id: room.workshop.id,
              name: (room.workshop as any).workshopName,
              avatar: room.workshop.avatar,
            };
    }
    return { ...rest, unreadCount: _count.messages };
  });
};

const getWorkshopRooms = async (workshopId: string) => {
  const rooms = await prisma.room.findMany({
    where: { workshopId },
    include: {
      workshop: {
        select: { id: true, workshopName: true, avatar: true },
      },
      user: { select: { id: true, name: true, avatar: true } },
      lastMessage: true,
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: workshopId },
              isRead: false,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  return rooms.map((room) => {
    const { _count, ...rest } = room;
    if (room.lastMessage) {
      (room.lastMessage as any).sender =
        room.lastMessage.senderId === room.userId
          ? room.user
          : {
              id: room.workshop.id,
              name: (room.workshop as any).workshopName,
              avatar: room.workshop.avatar,
            };
    }
    return { ...rest, unreadCount: _count.messages };
  });
};

const getRoomMessages = async (roomId: string) => {
  const room = await prisma.room.findUniqueOrThrow({
    where: { id: roomId },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      workshop: { select: { id: true, workshopName: true, avatar: true } },
    },
  });

  const messages = await prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((msg) => ({
    ...msg,
    sender:
      msg.senderId === room.userId
        ? room.user
        : {
            id: room.workshop.id,
            name: (room.workshop as any).workshopName,
            avatar: room.workshop.avatar,
          },
  }));
};

const saveMessage = async (payload: {
  roomId: string;
  senderId: string;
  content: string;
  type?: MessageType;
}) => {
  const room = await prisma.room.findUnique({
    where: { id: payload.roomId },
  });

  if (!room) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Room not found");
  }

  // Create message and update room's last message in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: {
        roomId: payload.roomId,
        senderId: payload.senderId,
        content: payload.content,
        type: payload.type || MessageType.TEXT,
      },
    });

    await tx.room.update({
      where: { id: payload.roomId },
      data: {
        lastMessageId: msg.id,
        lastMessageAt: msg.createdAt,
      },
    });

    return {
      ...msg,
      sender:
        msg.senderId === room.userId
          ? await prisma.user.findUnique({
              where: { id: room.userId },
              select: { id: true, name: true, avatar: true },
            })
          : await prisma.workshop.findUnique({
              where: { id: room.workshopId },
              select: { id: true, workshopName: true, avatar: true },
            }),
    };
  });

  // Normalize workshop name if needed for the returned sender object
  if (result.sender && (result.sender as any).workshopName) {
    (result.sender as any).name = (result.sender as any).workshopName;
  }

  return result;
};

const markMessagesAsRead = async (roomId: string, senderId: string) => {
  // Mark all messages in room sent by OTHERS as read
  const result = await prisma.message.updateMany({
    where: {
      roomId,
      senderId: { not: senderId },
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return result;
};

const getRoomByBookingId = async (bookingId: string) => {
  const result = await prisma.room.findUnique({
    where: { bookingId },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      workshop: { select: { id: true, workshopName: true, avatar: true } },
      booking: true,
      lastMessage: true,
    },
  });

  if (result?.lastMessage) {
    (result.lastMessage as any).sender =
      result.lastMessage.senderId === result.userId
        ? result.user
        : {
            id: result.workshop.id,
            name: (result.workshop as any).workshopName,
            avatar: result.workshop.avatar,
          };
  }

  return result;
};

export const ChatService = {
  createRoom,
  getRoomById,
  getRoomByBookingId,
  getUserRooms,
  getWorkshopRooms,
  getRoomMessages,
  saveMessage,
  markMessagesAsRead,
};
