import { Request, Response } from "express";
import { BikeService } from "./bike.services.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";

const createBike = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await BikeService.createBike(payload);

  sendResponse(res, {
    success: true,
    message: "Bike created successfully",
    statusCode: 201,
    data: result,
  });
});

const getBikeById = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const result = await BikeService.getBikeById(id, user.id);

  sendResponse(res, {
    success: true,
    message: "Bike retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const getMyBikes = async (req: Request, res: Response) => {
  const userId = req.user.id;

  const result = await BikeService.getBikesByUserId(userId);

  res.status(200).json({
    success: true,
    message: "Bikes retrieved successfully",
    data: result,
  });
};
const getBikeByUserId = async (req: Request, res: Response) => {
  const userId = req.params.id;

  const result = await BikeService.getBikesByUserId(userId);

  res.status(200).json({
    success: true,
    message: "Bikes retrieved successfully",
    data: result,
  });
};

const updateBike = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const payload = req.body;
  const { id } = req.params;
  const result = await BikeService.updateBike(id, payload, user.id);

  sendResponse(res, {
    success: true,
    message: "Bike updated successfully",
    statusCode: 200,
    data: result,
  });
});
const deleteBike = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { id } = req.params;
  const result = await BikeService.deleteBike(id, user.id);

  sendResponse(res, {
    success: true,
    message: "Bike deleted successfully",
    statusCode: 200,
    data: result,
  });
});

export const BikeController = {
  createBike,
  getBikeById,
  getMyBikes,
  updateBike,
  deleteBike,
  getBikeByUserId
};
