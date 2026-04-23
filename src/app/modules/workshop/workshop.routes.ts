import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { WorkshopController } from "./workshop.controller.js";
import { Role } from "../../../types/enum.js";
import {
  createWorkshopSchema,
  updateWorkshopSchema,
} from "./workshop.validation.js";
//role
import auth from "../../middlewares/auth.js";
import fileUploadHandler from "../../middlewares/fileUploadHandler.js";

const router = express.Router();

router.get("/", WorkshopController.getAllWorkshops);
router.get("/me", auth(Role.WORKSHOP), WorkshopController.getMe);
router.get("/me/jobs", auth(Role.WORKSHOP), WorkshopController.getNearbyJobs);

router.post(
  "/register",
  fileUploadHandler(),
  validateRequest(createWorkshopSchema),
  WorkshopController.createWorkshop,
);

router.post("/login", WorkshopController.loginWorkshop);
router.post("/verify-workshop", WorkshopController.verifyWorkshop);
router.post("/resend-otp", WorkshopController.resendWorkshopOTP);
router.post("/forget-password", WorkshopController.forgetWorkshopPassword);
router.post(
  "/reset-password",
  auth(Role.WORKSHOP),
  WorkshopController.resetWorkshopPassword,
);
router.post(
  "/change-password",
  auth(Role.WORKSHOP),
  WorkshopController.changeWorkshopPassword,
);
router.get(
  "/:id",
  auth(Role.ADMIN, Role.WORKSHOP, Role.USER),
  WorkshopController.getWorkshopById,
);
router.get(
  "/:id/bookings",
  auth(Role.ADMIN, Role.WORKSHOP, Role.USER),
  WorkshopController.getBookingsByWorkshopId,
);
router.get("/:workshopId/reviews", WorkshopController.getReviewsByWorkshopId);
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.WORKSHOP),
  fileUploadHandler(),
  validateRequest(updateWorkshopSchema),
  WorkshopController.updateWorkshop,
);

router.patch(
  "/:id/platform-fees",
  auth(Role.ADMIN),
  WorkshopController.updatePlatformFees,
);

router.patch(
  "/:id/approve",
  auth(Role.ADMIN),
  WorkshopController.approveWorkshop,
);
router.patch(
  "/:id/reject",
  auth(Role.ADMIN),
  WorkshopController.rejectWorkshop,
);
router.patch(
  "/:id/suspend",
  auth(Role.ADMIN),
  WorkshopController.suspendWorkshop,
);
router.patch(
  "/:id/unsuspend",
  auth(Role.ADMIN),
  WorkshopController.unsuspendWorkshop,
);
router.delete("/:id", WorkshopController.deleteWorkshop);

export const WorkshopRouter = router;
