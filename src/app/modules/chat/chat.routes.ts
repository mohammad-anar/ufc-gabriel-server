import express from "express";
import { Role } from "../../../types/enum.js";
//role
import { ChatController } from "./chat.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.USER, Role.WORKSHOP, Role.ADMIN),
  ChatController.createRoom,
);
router.get(
  "/my-rooms",
  auth(Role.USER, Role.WORKSHOP, Role.ADMIN),
  ChatController.getMyRooms,
);
router.get(
  "/booking/:bookingId",
  auth(Role.USER, Role.WORKSHOP, Role.ADMIN),
  ChatController.getRoomByBookingId,
);
router.get(
  "/:id",
  auth(Role.USER, Role.WORKSHOP, Role.ADMIN),
  ChatController.getRoomById,
);

router.get(
  "/:roomId/messages",
  auth(Role.USER, Role.WORKSHOP, Role.ADMIN),
  ChatController.getRoomMessages,
);
router.patch(
  "/:roomId/read",
  auth(Role.USER, Role.WORKSHOP),
  ChatController.markMessagesAsRead,
);

export const ChatRouter = router;
