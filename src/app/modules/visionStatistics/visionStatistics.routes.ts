import express from "express";
import { VisionStatisticsController } from "./visionStatistics.controller.js";

const router = express.Router();

router.get("/", VisionStatisticsController.getVisionStatistics);

export const VisionStatisticsRouter = router;
