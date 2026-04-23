//role
import express from "express";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { WorkshopOpeningHourController } from "./workshopOpeningHours.controller.js";
import { Role } from "../../../types/enum.js";
import {
  createWorkshopOpeningHourSchema,
  updateWorkshopOpeningHourSchema,
} from "./workshopOpeningHours.validation.js";

const router = express.Router();

router.get(
  "/",
  auth(Role.ADMIN),
  WorkshopOpeningHourController.getWorkshopOpeningHour,
);

router.post(
  "/",
  auth(Role.WORKSHOP),
  validateRequest(createWorkshopOpeningHourSchema),
  WorkshopOpeningHourController.createWorkshopOpeningHour,
);

router.get(
  "/:id",
  auth(Role.ADMIN, Role.WORKSHOP),
  WorkshopOpeningHourController.getWorkshopOpeningHourById,
);

router.get(
  "/workshop/:workshopId",
  auth(Role.ADMIN, Role.WORKSHOP),
  WorkshopOpeningHourController.getWorkshopOpeningHourByWorkshopId,
);

router.patch(
  "/:id",
  auth(Role.WORKSHOP),
  validateRequest(updateWorkshopOpeningHourSchema),
  WorkshopOpeningHourController.updateWorkshopOpeningHour,
);

router.patch(
  "/:id/close",
  auth(Role.ADMIN, Role.WORKSHOP),
  WorkshopOpeningHourController.makeOpeningHourClose,
);

router.delete(
  "/:id",
  auth(Role.WORKSHOP),
  WorkshopOpeningHourController.deleteWorkshopOpeningHour,
);

export const WorkshopOpeningHourRouter = router;
