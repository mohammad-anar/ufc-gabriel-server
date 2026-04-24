import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { QueueService } from "./queue.service.js";

const getQueue = catchAsync(async (req: Request, res: Response) => {
  const result = await QueueService.getQueue(req.user.id, req.params.leagueId);
  sendResponse(res, { statusCode: 200, success: true, message: "Queue retrieved", data: result });
});

const upsertQueueEntry = catchAsync(async (req: Request, res: Response) => {
  const { fighterId, priority } = req.body;
  const result = await QueueService.upsertQueueEntry(
    req.user.id,
    req.params.leagueId,
    fighterId,
    priority
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Queue entry saved", data: result });
});

const removeQueueEntry = catchAsync(async (req: Request, res: Response) => {
  const result = await QueueService.removeQueueEntry(
    req.user.id,
    req.params.leagueId,
    req.params.fighterId
  );
  sendResponse(res, { statusCode: 200, success: true, message: "Fighter removed from queue", data: result });
});

const replaceQueue = catchAsync(async (req: Request, res: Response) => {
  const { entries } = req.body;
  const result = await QueueService.replaceQueue(req.user.id, req.params.leagueId, entries);
  sendResponse(res, { statusCode: 200, success: true, message: "Queue replaced", data: result });
});

export const QueueController = {
  getQueue,
  upsertQueueEntry,
  removeQueueEntry,
  replaceQueue,
};
