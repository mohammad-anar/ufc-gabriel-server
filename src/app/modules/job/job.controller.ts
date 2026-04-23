import { Request, Response } from "express";
import { JobService } from "./job.services.js";
import catchAsync from "../../shared/catchAsync.js";
import ApiError from "../../../errors/ApiError.js";
import { getMultipleFilesPath } from "../../shared/getFilePath.js";
import config from "../../../config/index.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { prisma } from "../../../helpers/prisma.js";

const createJob = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const payload = req.body;

  if (!id) {
    throw new ApiError(401, "User not found");
  }
  payload.userId = id;

  const image = getMultipleFilesPath(req.files, "image") as string[];
  console.log(image);
  if (!image || (image && image?.length < 0)) {
    throw new ApiError(404, "Photos not uploaded.");
  }
  if (image?.length > 0) {
    const photos = image?.map((img) =>
      `${config.backend_url}`.concat(img),
    );

    if (photos.length > 0) {
      payload.photos = photos;
    }
  }

  const platformData = await prisma.platformData.findFirst();
  if (!platformData) {
    throw new ApiError(404, "Platform data not found");
  }

  // set radius from platform data
  payload.radius = platformData.maximumJobRadius;

  // console.log(payload);
  const result = await JobService.createJob(id, payload);

  sendResponse(res, {
    success: true,
    message: "Job created successfully",
    statusCode: 201,
    data: result,
  });
});
const getAllJobs = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "status", "urgency"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await JobService.getAllJobs(filters, options);

  sendResponse(res, {
    success: true,
    message: "All jobs retrieved successfully",
    statusCode: 200,
    data: result,
  });
});
const getJobById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await JobService.getJobById(id);

  sendResponse(res, {
    success: true,
    message: "Job retrieved by id successfully",
    statusCode: 200,
    data: result,
  });
});
const getJobsByUserId = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await JobService.getJobsByUserId(id);

  sendResponse(res, {
    success: true,
    message: "Job retrieved by user id successfully",
    statusCode: 200,
    data: result,
  });
});
const getOffersByJobId = catchAsync(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const { id: userId } = req.user;

  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await JobService.getOffersByJobId(jobId, userId, options);

  sendResponse(res, {
    success: true,
    message: "Job Offers retrieved by job id successfully",
    statusCode: 200,
    data: result,
  });
});
const updateJobById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId } = req.user;
  const payload = req.body;
  const result = await JobService.updateJobById(id, userId, payload);

  sendResponse(res, {
    success: true,
    message: "Job updated by id successfully",
    statusCode: 200,
    data: result,
  });
});
const deleteJobById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { id: userId } = req.user;

  const result = await JobService.deleteJob(id, userId);

  sendResponse(res, {
    success: true,
    message: "Job deleted by id successfully",
    statusCode: 200,
    data: result,
  });
});

export const JobController = {
  createJob,
  getAllJobs,
  getJobById,
  updateJobById,
  deleteJobById,
  getOffersByJobId,
  getJobsByUserId,
};
