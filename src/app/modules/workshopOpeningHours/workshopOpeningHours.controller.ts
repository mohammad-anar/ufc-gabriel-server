import { Request, Response } from "express";
import { WorkshopOpeningHourServices } from "./workshopOpeningHours.services.js"
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";

const createWorkshopOpeningHour = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopOpeningHourServices.createWorkshopOpeningHour(req.body);

  sendResponse(res, {
    success: true,
    message: "Workshop opening hour created successfully",
    statusCode: 201,
    data: result,
  });
});

const getWorkshopOpeningHour = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopOpeningHourServices.getWorkshopOpeningHour();

  sendResponse(res, {
    success: true,
    message: "Workshop opening hour fetched successfully",
    statusCode: 200,
    data: result,
  });
});

const getWorkshopOpeningHourById = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopOpeningHourServices.getWorkshopOpeningHourById(req.params.id);

  sendResponse(res, {
    success: true,
    message: "Workshop opening hour fetched successfully",
    statusCode: 200,
    data: result,
  });
});

const getWorkshopOpeningHourByWorkshopId = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopOpeningHourServices.getWorkshopOpeningHourByWorkshopId(req.params.workshopId);

  sendResponse(res, {
    success: true,
    message: "Workshop opening hour fetched successfully",
    statusCode: 200,
    data: result,
  });
});

const updateWorkshopOpeningHour = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopOpeningHourServices.updateWorkshopOpeningHour(req.params.id, req.body);

  sendResponse(res, {
    success: true,
    message: "Workshop opening hour updated successfully",
    statusCode: 200,
    data: result,
  });
});

const makeOpeningHourClose = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopOpeningHourServices.makeOpeningHourClose(req.params.id);

  sendResponse(res, {
    success: true,
    message: "Workshop opening hour closed successfully",
    statusCode: 200,
    data: result,
  });
});

const deleteWorkshopOpeningHour = catchAsync(async (req: Request, res: Response) => {
  const result = await WorkshopOpeningHourServices.deleteWorkshopOpeningHour(req.params.id);

  sendResponse(res, {
    success: true,
    message: "Workshop opening hour deleted successfully",
    statusCode: 200,
    data: result,
  });
});

export const WorkshopOpeningHourController = {
    createWorkshopOpeningHour,
    getWorkshopOpeningHour,
    getWorkshopOpeningHourById,
    getWorkshopOpeningHourByWorkshopId,
    updateWorkshopOpeningHour,
    makeOpeningHourClose,
    deleteWorkshopOpeningHour
}