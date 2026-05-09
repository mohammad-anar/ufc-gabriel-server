import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { DraftService } from "./draft.service.js";

const getDraftSession = catchAsync(async (req: Request, res: Response) => {
  const result = await DraftService.getDraftSession(req.params.leagueId, req.user?.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Draft session retrieved successfully", data: result });
});

const getAvailableFighters = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "divisionId"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await DraftService.getAvailableFighters(req.params.leagueId, filters as any, options as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Available fighters retrieved successfully", data: result });
});

const startDraft = catchAsync(async (req: Request, res: Response) => {
  const result = await DraftService.startDraft(req.params.leagueId, req.user.id, req.user.role);
  sendResponse(res, { statusCode: 200, success: true, message: "Draft started successfully", data: result });
});

const pickFighter = catchAsync(async (req: Request, res: Response) => {
  const result = await DraftService.pickFighter(req.params.leagueId, req.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter picked successfully", data: result });
});

const autoPick = catchAsync(async (req: Request, res: Response) => {
  const { teamId } = req.body;
  const result = await DraftService.autoPick(req.params.leagueId, teamId);
  sendResponse(res, { statusCode: 200, success: true, message: "Auto-pick successful", data: result });
});

const updatePreDraft = catchAsync(async (req: Request, res: Response) => {
  const { orderedFighterIds } = req.body;
  const result = await DraftService.updatePreDraft(req.params.leagueId, req.user.id, orderedFighterIds);
  sendResponse(res, { statusCode: 200, success: true, message: "Pre-draft list updated successfully", data: result });
});

const getPreDraft = catchAsync(async (req: Request, res: Response) => {
  const result = await DraftService.getPreDraft(req.params.leagueId, req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Pre-draft list retrieved successfully", data: result });
});

const toggleAutoPick = catchAsync(async (req: Request, res: Response) => {
  const { enabled } = req.body;
  const result = await DraftService.toggleAutoPick(req.params.leagueId, req.user.id, enabled);
  sendResponse(res, { statusCode: 200, success: true, message: "Auto-pick status updated", data: result });
});

export const DraftController = {
  getDraftSession,
  getAvailableFighters,
  startDraft,
  pickFighter,
  autoPick,
  updatePreDraft,
  getPreDraft,
  toggleAutoPick,
};


