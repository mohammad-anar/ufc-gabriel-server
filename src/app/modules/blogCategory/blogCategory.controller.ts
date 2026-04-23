import { Request, Response } from "express";
import { BlogCategoryService } from "./blogCategory.services.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";

/* -------- CREATE CATEGORY -------- */

const createCategory = catchAsync(async (req: Request, res: Response) => {
  const result = await BlogCategoryService.createCategory(req.body);

  sendResponse(res, {
    success: true,
    message: "Category created successfully",
    statusCode: 201,
    data: result,
  });
});

/* -------- GET ALL CATEGORIES -------- */

const getAllCategories = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await BlogCategoryService.getAllCategories(filters, options);

  sendResponse(res, {
    success: true,
    message: "Categories retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

/* -------- GET CATEGORY BY ID -------- */

const getCategoryById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogCategoryService.getCategoryById(id);

  sendResponse(res, {
    success: true,
    message: "Category retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

/* -------- UPDATE CATEGORY -------- */

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogCategoryService.updateCategory(id, req.body);

  sendResponse(res, {
    success: true,
    message: "Category updated successfully",
    statusCode: 200,
    data: result,
  });
});

/* -------- DELETE CATEGORY -------- */

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogCategoryService.deleteCategory(id);

  sendResponse(res, {
    success: true,
    message: "Category deleted successfully",
    statusCode: 200,
    data: result,
  });
});

export const BlogCategoryController = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
