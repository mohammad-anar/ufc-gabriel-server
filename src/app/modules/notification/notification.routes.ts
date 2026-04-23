import express from "express";
import { NotificationController } from "./notification.controller.js";
import { Role } from "../../../types/enum.js";

//role
import auth from "../../middlewares/auth.js";

const router = express.Router();

/* ---------- GET ALL ---------- */
router.get(
  "/",
  auth(Role.ADMIN),
  NotificationController.getAllNotifications,
);

/* ---------- CREATE ---------- */
router.post("/", auth(Role.ADMIN), NotificationController.createNotification);

/* ---------- GET BY ID ---------- */
router.get(
  "/:id",
  auth(Role.ADMIN),
  NotificationController.getNotificationById,
);

/* ---------- GET BY USER ID ---------- */
router.get(
  "/user/:userId",
  auth(Role.ADMIN, Role.USER),
  NotificationController.getNotificationsByUserId,
);

/* ---------- GET BY WORKSHOP ID ---------- */
router.get(
  "/workshop/:workshopId",
  auth(Role.ADMIN, Role.WORKSHOP),
  NotificationController.getNotificationsByWorkshopId,
);

/* ---------- GET BY BOOKING ID ---------- */
router.get(
  "/booking/:bookingId",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  NotificationController.getNotificationsByBookingId,
);

/* ---------- MARK AS READ ---------- */
router.patch(
  "/:id/read",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  NotificationController.markAsRead,
);

router.patch(
  "/mark-read",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  NotificationController.markMultipleAsRead,
);

/* ---------- DELETE ---------- */
router.delete(
  "/:id",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  NotificationController.deleteNotification,
);

export const NotificationRouter = router;
