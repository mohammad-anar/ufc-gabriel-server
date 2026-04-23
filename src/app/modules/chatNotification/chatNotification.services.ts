import { prisma } from "../../../helpers/prisma.js";


/* ---------- CREATE ---------- */
const createChatNotification = async (payload: {
  userIds: string[];
  chatRoomId: string;
  messageId: string;
  triggeredById?: string;
  title?: string;
  body?: string;
}) => {
  return prisma.chatNotification.create({
    data: payload,
  });
};

/* ---------- GET ALL ---------- */
const getAllChatNotifications = async () => {
  return prisma.chatNotification.findMany({
    orderBy: { createdAt: "desc" },
  });
};


/* ---------- GET BY CHAT ROOM ---------- */
const getChatNotificationsByRoomId = async (chatRoomId: string) => {
  return prisma.chatNotification.findMany({
    where: { chatRoomId },
    orderBy: { createdAt: "desc" },
  });
};

/* ---------- MARK AS READ ---------- */
const markChatNotificationAsRead = async (id: string) => {
  return prisma.chatNotification.update({
    where: { id },
    data: { isRead: true },
  });
};

/* ---------- DELETE ---------- */
const deleteChatNotification = async (id: string) => {
  return prisma.chatNotification.delete({
    where: { id },
  });
};

export const ChatNotificationService = {
  createChatNotification,
  getAllChatNotifications,
  getChatNotificationsByRoomId,
  markChatNotificationAsRead,
  deleteChatNotification,
};
