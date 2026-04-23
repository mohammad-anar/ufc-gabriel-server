import { Request, Response } from "express";
import { NewsletterService } from "./newsletter.services.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";

const subscribe = catchAsync(async (req: Request, res: Response) => {
  const result = await NewsletterService.subscribe(req.body);

  sendResponse(res, {
    success: true,
    message: "Subscribed to newsletter successfully",
    statusCode: 201,
    data: result,
  });
});

const getAllNewsletters = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "email"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await NewsletterService.getAllNewsletters(filters, options);

  sendResponse(res, {
    success: true,
    message: "Newsletters retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

export const NewsletterController = {
  subscribe,
  getAllNewsletters,
};
