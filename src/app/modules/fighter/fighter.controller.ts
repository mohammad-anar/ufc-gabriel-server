import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { FighterService } from "./fighter.service.js";
import { getSingleFilePath } from "../../shared/getFilePath.js";

const createFighter = catchAsync(async (req: Request, res: Response) => {
  const avatarUrl = getSingleFilePath(req.files, "image");
  if (avatarUrl) {
    req.body.avatarUrl = avatarUrl;
  }

  const result = await FighterService.createFighter(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Fighter created successfully", data: result });
});

const getAllFighters = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "divisionId", "isChampion", "isActive"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await FighterService.getAllFighters(filters as any, options as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighters retrieved successfully", data: result });
});

const getFighterById = catchAsync(async (req: Request, res: Response) => {
  const result = await FighterService.getFighterById(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter retrieved successfully", data: result });
});

const updateFighter = catchAsync(async (req: Request, res: Response) => {
  const avatarUrl = getSingleFilePath(req.files, "image");
  if (avatarUrl) {
    req.body.avatarUrl = avatarUrl;
  }

  const result = await FighterService.updateFighter(req.params.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter updated successfully", data: result });
});

const deleteFighter = catchAsync(async (req: Request, res: Response) => {
  const result = await FighterService.deleteFighter(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter deactivated successfully", data: result });
});

export const FighterController = { createFighter, getAllFighters, getFighterById, updateFighter, deleteFighter };
