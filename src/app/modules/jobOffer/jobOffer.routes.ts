import express from "express";
import { JobOfferController } from "./jobOffer.controller.js";
import { Role } from "../../../types/enum.js";
//role
import {
  CreateJobOfferSchema,
  UpdateJobOfferSchema,
} from "./jobOffer.validation.js";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.WORKSHOP),
  validateRequest(CreateJobOfferSchema),
  JobOfferController.createJobOffer,
);
router.post("/:id/accept", auth(Role.USER), JobOfferController.acceptJobOffer);
router.post(
  "/:id/decline",
  auth(Role.USER),
  JobOfferController.declineJobOffer,
);
router.get(
  "/my-offers/user",
  auth(Role.USER),
  JobOfferController.getJobOffersByUserId,
);
router.get(
  "/:id",
  auth(Role.WORKSHOP, Role.USER, Role.ADMIN),
  JobOfferController.getOfferById,
);
router.patch(
  "/:id",
  auth(Role.USER, Role.ADMIN),
  validateRequest(UpdateJobOfferSchema),
  JobOfferController.updateOfferById,
);
router.delete(
  "/:id",
  auth(Role.WORKSHOP, Role.ADMIN),
  JobOfferController.deleteOfferById,
);

export const JobOfferRouter = router;
