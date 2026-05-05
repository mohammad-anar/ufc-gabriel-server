import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { LeagueService } from "./league.service.js";

const getAdminLeagues = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "status", "managerId", "isSystemGenerated", "code", "leagueType"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LeagueService.getAdminLeagues(filters as any, options as any);


  sendResponse(res, { statusCode: 200, success: true, message: "Admin leagues retrieved successfully", data: result });
});

const createLeague = catchAsync(async (req: Request, res: Response) => {

  const result = await LeagueService.createLeague(req.user.id, req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "League created successfully", data: result });
});

const getAllLeagues = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "status", "leagueType"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LeagueService.getAllLeagues(filters as any, options as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Leagues retrieved successfully", data: result });
});

const getAvailableLeagues = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "leagueType"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LeagueService.getAvailableLeagues(filters as any, options as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Available leagues retrieved successfully", data: result });
});

const getMyLeagues = catchAsync(async (req: Request, res: Response) => {
  const result = await LeagueService.getMyLeagues(req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "My leagues retrieved successfully", data: result });
});

const getLeagueById = catchAsync(async (req: Request, res: Response) => {
  const result = await LeagueService.getLeagueById(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "League retrieved successfully", data: result });
});

const joinLeague = catchAsync(async (req: Request, res: Response) => {
  const result = await LeagueService.joinLeague(req.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Successfully joined the league", data: result });
});

const joinQuickLeague = catchAsync(async (req: Request, res: Response) => {
  const { teamName } = req.body;
  const result = await LeagueService.joinQuickLeague(req.user.id, teamName || `Team ${req.user.id.slice(0, 5)}`);
  sendResponse(res, { statusCode: 200, success: true, message: "Successfully joined a quick league", data: result });
});

const updateLeague = catchAsync(async (req: Request, res: Response) => {
  const result = await LeagueService.updateLeague(req.params.id, req.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "League updated successfully", data: result });
});

const deleteLeague = catchAsync(async (req: Request, res: Response) => {
  const result = await LeagueService.deleteLeague(req.params.id, req.user.id, req.user.role);
  sendResponse(res, { statusCode: 200, success: true, message: "League deleted successfully", data: result });
});

const getAvailableFighters = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "divisionId"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await LeagueService.getAvailableFighters(req.params.id, filters, options);
  sendResponse(res, { statusCode: 200, success: true, message: "Available fighters retrieved successfully", data: result });
});

const addFighter = catchAsync(async (req: Request, res: Response) => {
  const { fighterId } = req.body;
  const result = await LeagueService.addFighterToTeam(req.params.id, req.user.id, fighterId);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter added successfully", data: result });
});

const removeFighter = catchAsync(async (req: Request, res: Response) => {
  const { fighterId } = req.body;
  const result = await LeagueService.removeFighterFromTeam(req.params.id, req.user.id, fighterId);
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter removed successfully", data: result });
});

const leaveLeague = catchAsync(async (req: Request, res: Response) => {
  const result = await LeagueService.leaveLeague(req.params.id, req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Left league successfully", data: result });
});


export const LeagueController = {
  createLeague, getAllLeagues, getMyLeagues, getLeagueById,
  joinLeague, joinQuickLeague, updateLeague, deleteLeague,
  getAvailableFighters, addFighter, removeFighter, getAvailableLeagues,
  leaveLeague, getAdminLeagues
};
