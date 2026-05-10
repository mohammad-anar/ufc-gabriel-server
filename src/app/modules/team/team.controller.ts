import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { TeamService } from "./team.service.js";
import ApiError from "../../../errors/ApiError.js";

const getMyTeams = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.getMyTeams(req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "My teams retrieved successfully", data: result });
});

const getTeamById = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.getTeamById(req.params.id, req.user.id, req.user.role);
  sendResponse(res, { statusCode: 200, success: true, message: "Team retrieved successfully", data: result });
});

const getLeaderboard = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.getLeaderboard(req.params.leagueId);
  sendResponse(res, { statusCode: 200, success: true, message: "Leaderboard retrieved successfully", data: result });
});

const updateTeam = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.updateTeam(req.params.id, req.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Team updated successfully", data: result });
});

const dropFighter = catchAsync(async (req: Request, res: Response) => {
  const result = await TeamService.dropFighter(req.params.id, req.params.fighterId, req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter dropped successfully", data: result });
});

const getMyTeamByLeague = catchAsync(async (req: Request, res: Response) => {
  const leagueId = req.query.leagueId as string;
  if (!leagueId) {
    throw new ApiError(400, "League ID is required");
  }
  const result = await TeamService.getMyTeamByLeague(req.user.id, leagueId);
  sendResponse(res, { statusCode: 200, success: true, message: "My team retrieved successfully", data: result });
});

export const TeamController = { getMyTeams, getTeamById, getLeaderboard, updateTeam, dropFighter, getMyTeamByLeague };
