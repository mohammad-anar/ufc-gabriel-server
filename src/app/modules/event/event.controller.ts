import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { EventService } from "./event.service.ts";
import { getSingleFilePath } from "../../shared/getFilePath.ts";

const createEvent = catchAsync(async (req: Request, res: Response) => {
  const image = getSingleFilePath(req.files, "image");
  if (image) {
    req.body.posterUrl = image;
  }
  const result = await EventService.createEvent(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Event created successfully", data: result });
});

const getAllEvents = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "status"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await EventService.getAllEvents(filters as any, options as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Events retrieved successfully", data: result });
});

const getEventById = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.getEventById(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Event retrieved successfully", data: result });
});

const updateEvent = catchAsync(async (req: Request, res: Response) => {
  const image = getSingleFilePath(req.files, "image");
  if (image) {
    req.body.posterUrl = image;
  }
  const result = await EventService.updateEvent(req.params.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Event updated successfully", data: result });
});

const deleteEvent = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.deleteEvent(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Event deleted successfully", data: result });
});

const postResults = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.postResults(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Results posted successfully", data: result });
});

// Merged Bout Controllers
const createBout = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.createBout(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Bout created successfully", data: result });
});

const getBoutById = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.getBoutById(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Bout retrieved successfully", data: result });
});

const postBoutResult = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.postBoutResult(req.params.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Bout result posted and scores calculated", data: result });
});

const deleteBout = catchAsync(async (req: Request, res: Response) => {
  const result = await EventService.deleteBout(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Bout deleted successfully", data: result });
});

export const EventController = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  postResults,
  createBout,
  getBoutById,
  postBoutResult,
  deleteBout,
};
