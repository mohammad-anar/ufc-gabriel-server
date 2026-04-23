import { Request, Response } from "express";
import { ServiceCategoryService } from "./serviceCategory.services.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";

/* -------- CREATE CATEGORY -------- */

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await ServiceCategoryService.createCategory(req.body);

  sendResponse(res, {
    success: true,
    message: "Service category created successfully",
    statusCode: 201,
    data: result,
  });
});

/* -------- GET ALL CATEGORIES -------- */

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await ServiceCategoryService.getAllCategories(
    filters,
    options,
  );

  sendResponse(res, {
    success: true,
    message: "Service categories retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

/* -------- GET CATEGORY BY ID -------- */

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ServiceCategoryService.getCategoryById(id);

  sendResponse(res, {
    success: true,
    message: "Service category retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

/* -------- UPDATE CATEGORY -------- */

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ServiceCategoryService.updateCategory(id, req.body);

  sendResponse(res, {
    success: true,
    message: "Service category updated successfully",
    statusCode: 200,
    data: result,
  });
});

/* -------- DELETE CATEGORY -------- */

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ServiceCategoryService.deleteCategory(id);

  sendResponse(res, {
    success: true,
    message: "Service category deleted successfully",
    statusCode: 200,
    data: result,
  });
});

export const ServiceCategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
