import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { SystemScoreService } from "./systemScore.service.js";

// I'll fix the import in a moment if I messed up the name.
// Actually, I named the file systemScore.service.ts, so the import should be:
// import { SystemScoreService } from "./systemScore.service.js";

const upsertSystemScoring = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemScoreService.upsertSystemScoring(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "System scoring settings updated successfully",
    data: result,
  });
});

const getSystemScoring = catchAsync(async (req: Request, res: Response) => {
  const result = await SystemScoreService.getSystemScoring();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "System scoring settings retrieved successfully",
    data: result,
  });
});

export const SystemScoreController = {
  upsertSystemScoring,
  getSystemScoring,
};
