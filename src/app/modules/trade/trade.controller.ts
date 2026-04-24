import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { TradeService } from "./trade.service.js";

const createTrade = catchAsync(async (req: Request, res: Response) => {
  const result = await TradeService.createTrade(
    req.params.leagueId,
    req.user.id,
    req.body
  );
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Trade offer sent successfully",
    data: result,
  });
});

const getLeagueTrades = catchAsync(async (req: Request, res: Response) => {
  const { status } = pick(req.query, ["status"]) as { status?: string };
  const result = await TradeService.getLeagueTrades(req.params.leagueId, status);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Trades retrieved successfully",
    data: result,
  });
});

const getTradeById = catchAsync(async (req: Request, res: Response) => {
  const result = await TradeService.getTradeById(req.params.tradeId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Trade retrieved successfully",
    data: result,
  });
});

const acceptTrade = catchAsync(async (req: Request, res: Response) => {
  const result = await TradeService.acceptTrade(req.params.tradeId, req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Trade accepted — rosters swapped successfully",
    data: result,
  });
});

const rejectTrade = catchAsync(async (req: Request, res: Response) => {
  const result = await TradeService.rejectTrade(req.params.tradeId, req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Trade rejected",
    data: result,
  });
});

const cancelTrade = catchAsync(async (req: Request, res: Response) => {
  const result = await TradeService.cancelTrade(req.params.tradeId, req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Trade cancelled",
    data: result,
  });
});

const vetoTrade = catchAsync(async (req: Request, res: Response) => {
  const result = await TradeService.vetoTrade(req.params.tradeId, req.user.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Veto submitted",
    data: result,
  });
});

export const TradeController = {
  createTrade,
  getLeagueTrades,
  getTradeById,
  acceptTrade,
  rejectTrade,
  cancelTrade,
  vetoTrade,
};
