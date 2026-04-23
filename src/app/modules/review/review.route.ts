import express from "express";
import { ReviewController } from "./review.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { ReviewValidation } from "./review.validation.js";
import { Role } from "../../../types/enum.js";

//role
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.post(
  "/",
  auth(Role.USER),
  validateRequest(ReviewValidation.createReviewZodSchema),
  ReviewController.createReview,
);
router.get(
  "/",
  auth(Role.ADMIN, Role.WORKSHOP, Role.USER),
  ReviewController.getAllReviews,
);
router.get("/public", ReviewController.getPublicReviews);
router.get(
  "/:id",
  auth(Role.ADMIN, Role.WORKSHOP, Role.USER),
  ReviewController.getReviewById,
);
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.USER),
  validateRequest(ReviewValidation.updateReviewZodSchema),
  ReviewController.updateReview,
);
router.delete(
  "/:id",
  auth(Role.ADMIN, Role.USER),
  ReviewController.deleteReview,
);

router.get(
  "/workshop/:workshopId",
  auth(Role.ADMIN, Role.WORKSHOP),
  ReviewController.getReviewsByWorkshopId,
);
router.get(
  "/user/:userId",
  auth(Role.ADMIN, Role.USER),
  ReviewController.getReviewsByUserId,
);

router.patch(
  "/flag/:id",
  auth(Role.ADMIN, Role.WORKSHOP),
  ReviewController.flagReview,
);

router.patch("/hide/:id", auth(Role.ADMIN), ReviewController.hideReview);

router.get(
  "/pending-reviews/get",
  auth(Role.USER, Role.ADMIN),
  ReviewController.getPendingReviews,
);

export const ReviewRouter = router;
