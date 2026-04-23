//role
import express from "express";
import auth from "../../middlewares/auth.js";
import { ActivityController } from "./activity.controller.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

router.get("/daily-feed", auth(Role.ADMIN), ActivityController.getActivityFeed);

router.get(
  "/my-activities",
  auth(Role.USER, Role.ADMIN),
  ActivityController.getMyActivities,
);
router.get(
  "/workshop-activities",
  auth(Role.WORKSHOP, Role.ADMIN),
  ActivityController.getWorkshopActivities,
);

export const ActivityRouter = router;
