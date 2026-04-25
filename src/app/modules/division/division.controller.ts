import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { DivisionService } from "./division.service.js";

const createDivision = catchAsync(async (req: Request, res: Response) => {
  const result = await DivisionService.createDivision(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Division created successfully",
    data: result,
  });
});

const getAllDivisions = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await DivisionService.getAllDivisions(filters, options);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Divisions retrieved successfully",
    data: result,
  });
});

const getDivisionById = catchAsync(async (req: Request, res: Response) => {
  const result = await DivisionService.getDivisionById(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Division retrieved successfully",
    data: result,
  });
});

const updateDivision = catchAsync(async (req: Request, res: Response) => {
  const result = await DivisionService.updateDivision(req.params.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Division updated successfully",
    data: result,
  });
});

const deleteDivision = catchAsync(async (req: Request, res: Response) => {
  const result = await DivisionService.deleteDivision(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Division deleted successfully",
    data: result,
  });
});

export const DivisionController = {
  createDivision,
  getAllDivisions,
  getDivisionById,
  updateDivision,
  deleteDivision,
};
