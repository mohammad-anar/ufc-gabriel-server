import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { ReviewService } from "./review.services.js";
import pick from "../../../helpers/pick.js";


const createReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.createReview(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data: result,
  });
});

const getAllReviews = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "isFlagged", "isHidden", "rating", "workshopId"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await ReviewService.getAllReviews(filters, options);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully",
    data: result,
  });
});

const getPublicReviews = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewService.getPublicReviews();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Public reviews retrieved successfully",
    data: result,
  });
});

const getReviewById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ReviewService.getReviewById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review retrieved successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ReviewService.updateReview(id, req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await ReviewService.deleteReview(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data: result,
  });
});

const getReviewsByWorkshopId = catchAsync(async (req: Request, res: Response) => {
  const { workshopId } = req.params;

  const result = await ReviewService.getReviewsByWorkshopId(workshopId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Workshop reviews retrieved successfully",
    data: result,
  });
});

const getReviewsByUserId = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await ReviewService.getReviewsByUserId(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User reviews retrieved successfully",
    data: result,
  });
});

const flagReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isFlagged } = req.body;
  const result = await ReviewService.flagReview(id, isFlagged);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review flagged status updated",
    data: result,
  });
});

const hideReview = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isHidden } = req.body;
  const result = await ReviewService.hideReview(id, isHidden);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review hidden status updated",
    data: result,
  });
});

const getPendingReviews = catchAsync(async (req: Request, res: Response) => {
  const user = (req as any).user;

  const result = await ReviewService.getPendingReviews(user.id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Pending reviews retrieved successfully",
    data: result,
  });
});

export const ReviewController = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByWorkshopId,
  getReviewsByUserId,
  flagReview,
  hideReview,
  getPendingReviews,
  getPublicReviews,
};
