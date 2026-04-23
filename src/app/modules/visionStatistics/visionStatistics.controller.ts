import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { VisionStatisticsService } from "./visionStatistics.service.js";

const getVisionStatistics = catchAsync(async (req: Request, res: Response) => {
  const result = await VisionStatisticsService.getVisionStatistics();

  sendResponse(res, {
    success: true,
    message: "Vision statistics retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

export const VisionStatisticsController = {
  getVisionStatistics,
};
