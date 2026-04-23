import { Request, Response } from "express";
import { BlogService } from "./blog.services.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { getMultipleFilesPath } from "../../shared/getFilePath.js";
import config from "../../../config/index.js";
import pick from "../../../helpers/pick.js";

/* ---------------- CREATE BLOG ---------------- */

const createBlog = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const imagesData = (await getMultipleFilesPath(
    req.files,
    "image",
  )) as string[];

  const images = imagesData?.map((image) =>
    `${config.backend_url}`.concat(image),
  );

  if (imagesData && images?.length > 0) {
    payload.images = images;
  }

  const result = await BlogService.createBlog(payload);

  sendResponse(res, {
    success: true,
    message: "Blog created successfully",
    statusCode: 201,
    data: result,
  });
});

/* ---------------- GET ALL BLOGS ---------------- */

const getAllBlogs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await BlogService.getAllBlogs(filters, options);

  sendResponse(res, {
    success: true,
    message: "Blogs retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

/* ---------------- GET BLOG BY ID ---------------- */

const getBlogById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogService.getBlogById(id);

  sendResponse(res, {
    success: true,
    message: "Blog retrieved successfully",
    statusCode: 200,
    data: result,
  });
});
const getBlogBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;

  const result = await BlogService.getBlogBySlug(slug);

  sendResponse(res, {
    success: true,
    message: "Blog retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

/* ---------------- UPDATE BLOG ---------------- */

const updateBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;

  // Handle uploaded images
  const imagesData = (await getMultipleFilesPath(
    req.files,
    "image",
  )) as string[];
  if (imagesData?.length > 0) {
    const images = imagesData.map((img) =>
      `${config.backend_url}`.concat(img),
    );
    payload.images = images;
  }

  // Update the blog
  const result = await BlogService.updateBlog(id, payload);

  sendResponse(res, {
    success: true,
    message: "Blog updated successfully",
    statusCode: 200,
    data: result,
  });
});

/* ---------------- DELETE BLOG ---------------- */

const deleteBlog = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await BlogService.deleteBlog(id);

  sendResponse(res, {
    success: true,
    message: "Blog deleted successfully",
    statusCode: 200,
    data: result,
  });
});

export const BlogController = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
};
