import express from "express";
import { Role } from "../../../types/enum.js";
//role
import { AnalyticsController } from "./analytics.controller.js";
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.get("/user", auth(Role.USER), AnalyticsController.getUserAnalytics);
router.get(
  "/workshop",
  auth(Role.WORKSHOP),
  AnalyticsController.getWorkshopAnalytics,
);

router.get(
  "/weekly-bookings",
  auth(Role.WORKSHOP),
  AnalyticsController.getWeeklyBookingCount,
);
router.get("/admin", auth(Role.ADMIN), AnalyticsController.getAdminAnalytics);
router.get(
  "/monthly-report",
  auth(Role.ADMIN),
  AnalyticsController.getMonthlyReport,
);

router.get(
  "/export/users",
  auth(Role.ADMIN),
  AnalyticsController.exportUsersCSV,
);
router.get(
  "/export/workshops",
  auth(Role.ADMIN),
  AnalyticsController.exportWorkshopsCSV,
);
router.get("/export/jobs", auth(Role.ADMIN), AnalyticsController.exportJobsCSV);
router.get(
  "/export/bookings",
  auth(Role.ADMIN),
  AnalyticsController.exportBookingsCSV,
);

export const AnalyticsRouter = router;
