import express from "express";
import { ChatNotificationController } from "./chatNotification.controller.js";
import { Role } from "../../../types/enum.js";
//role
import auth from "../../middlewares/auth.js";

const router = express.Router();

/* ---------- CREATE ---------- */
// router.post(
//   "/",
//   auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
//   ChatNotificationController.createChatNotification,
// );

/* ---------- GET ALL ---------- */
// router.get(
//   "/",
//   auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
//   ChatNotificationController.getAllChatNotifications,
// );

/* ---------- GET BY USER ---------- */
// router.get(
//   "/user/:userId",
//   auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
//   ChatNotificationController.getChatNotificationsByUserId,
// );

/* ---------- GET BY CHAT ROOM ---------- */
router.get(
  "/room/:chatRoomId",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  ChatNotificationController.getChatNotificationsByRoomId,
);

/* ---------- MARK AS READ ---------- */
router.patch(
  "/:id/read",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  ChatNotificationController.markAsRead,
);

/* ---------- DELETE ---------- */
router.delete(
  "/:id",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  ChatNotificationController.deleteChatNotification,
);

export const ChatNotificationRouter = router;
