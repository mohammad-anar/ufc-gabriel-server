//role
import express from "express";
import { BookingController } from "./booking.controller.js";
import {
  CreateBookingSchema,
  RescheduleBookingSchema,
} from "./booking.validation.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

router.get("/", auth(Role.ADMIN), BookingController.getAllBookings);
router.post(
  "/",
  auth(Role.USER),
  validateRequest(CreateBookingSchema),
  BookingController.createBooking,
);
router.get(
  "/:id",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  BookingController.getBookingById,
);

// get all bookings by user id
router.get(
  "/user/:id",
  auth(Role.ADMIN, Role.USER),
  BookingController.getBookingsByUserId,
);

// get all bookings by workshop id
router.get(
  "/workshop/:id",
  auth(Role.ADMIN, Role.WORKSHOP),
  BookingController.getBookingsByWorkshopId,
);

router.get(
  "/weekly/workshop/:workshopId",
  auth(Role.ADMIN, Role.WORKSHOP),
  BookingController.getWeeklyBookings,
);

router.get(
  "/monthly/workshop/:workshopId",
  auth(Role.ADMIN, Role.WORKSHOP),
  BookingController.getMonthlyBookings,
);

router.get(
  "/daily/workshop/:workshopId",
  auth(Role.ADMIN, Role.WORKSHOP),
  BookingController.getDailyBookings,
);

router.get(
  "/:id/reviews",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  BookingController.getReviewByBookingId,
);
// get room by booking id
router.get(
  "/:id/room",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  BookingController.getRoomByBookingId,
);

router.patch("/:id", auth(Role.WORKSHOP), BookingController.updateBookings);
router.patch(
  "/:id/reschedule",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  validateRequest(RescheduleBookingSchema),
  BookingController.rescheduleBooking,
);
router.patch(
  "/:id/mark-payment-paid",
  auth(Role.ADMIN, Role.WORKSHOP),
  BookingController.markPaymentStatusPaid,
);
router.patch(
  "/:id/cancel",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  BookingController.cancelBooking,
);
router.patch(
  "/:id/completed",
  auth(Role.WORKSHOP),
  BookingController.completeBooking,
);
router.delete("/:id", auth(Role.ADMIN), BookingController.deleteBookings);

export const BookingRouter = router;
