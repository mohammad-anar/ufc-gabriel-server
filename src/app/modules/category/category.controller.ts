import { Request, Response } from "express";
import { CategoryService } from "./category.services.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await CategoryService.createCategory(payload);

  sendResponse(res, {
    success: true,
    message: "Category created successfully",
    statusCode: 201,
    data: result,
  });
});
const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await CategoryService.getAllCategories(filters, options);

  sendResponse(res, {
    success: true,
    message: "All categories retrieved successfully",
    statusCode: 201,
    data: result,
  });
});
const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await CategoryService.getCategoryById(id);

  sendResponse(res, {
    success: true,
    message: "Category retrieved successfully",
    statusCode: 201,
    data: result,
  });
});
const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  const result = await CategoryService.updateCategory(id, payload);

  sendResponse(res, {
    success: true,
    message: "Category updated successfully",
    statusCode: 201,
    data: result,
  });
});
const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await CategoryService.deleteCategory(id);

  sendResponse(res, {
    success: true,
    message: "Category deleted successfully",
    statusCode: 201,
    data: result,
  });
});

export const CategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
