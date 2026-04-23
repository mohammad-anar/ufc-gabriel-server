import { Prisma } from "@prisma/client";
import catchAsync from "../../shared/catchAsync.js";
import { getSingleFilePath } from "../../shared/getFilePath.js";
import { Request, Response } from "express";
import { UserService } from "./user.service.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import config from "../../../config/index.js";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const payload: Prisma.UserCreateInput = req.body;
  const image = getSingleFilePath(req.files, "image") as string;
  const url = `${config.backend_url}`.concat(image);

  if (image) {
    payload.avatar = url;
  }

  // service will handle hashing of the plain password
  const result = await UserService.createUser(payload);

  sendResponse(res, {
    success: true,
    message: "User registered!",
    statusCode: 201,
    data: result,
  });
});
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, [
    "role",
    "status",
    "isVerified",
    "isDeleted",
    "searchTerm",
  ]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await UserService.getAllUsers(filters, options);

  sendResponse(res, {
    success: true,
    message: "Users retrieve successfully",
    statusCode: 200,
    data: result,
  });
});
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getUserById(id as string);

  sendResponse(res, {
    success: true,
    message: "User retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

// me ==============
const getMe = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.user;
  const result = await UserService.getMe(email as string);

  sendResponse(res, {
    success: true,
    message: "User data retrieved successfully",
    statusCode: 200,
    data: result,
  });
});
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.user;
  const payload = req.body;
  const image = getSingleFilePath(req.files, "image") as string;
  const url = `${config.backend_url}`.concat(image);
  if (image) {
    payload.avatar = url;
  }
  const result = await UserService.updateUser(email, payload);

  sendResponse(res, {
    success: true,
    message: "User updated successfully",
    statusCode: 200,
    data: result,
  });
});
const banUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const isExist = await prisma.user.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(404, "User not found");
  }
  const result = await UserService.updateUser(isExist?.email as string, {
    status: "BANNED",
  });

  sendResponse(res, {
    success: true,
    message: "User banned successfully",
    statusCode: 200,
    data: result,
  });
});
const unBanUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const isExist = await prisma.user.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(404, "User not found");
  }
  const result = await UserService.updateUser(isExist?.email as string, {
    status: "ACTIVE",
  });

  sendResponse(res, {
    success: true,
    message: "User unbanned successfully",
    statusCode: 200,
    data: result,
  });
});
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteUser(id as string);

  sendResponse(res, {
    success: true,
    message: "User deleted successfully",
    statusCode: 200,
    data: result,
  });
});
const login = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await UserService.login(payload);

  // set cookies on client side
  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 days
  });
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  sendResponse(res, {
    success: true,
    message: "User logged in successfully",
    statusCode: 200,
    data: result,
  });
});
const verifyUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await UserService.verifyUser(payload);

  sendResponse(res, {
    success: true,
    message: "User verification successfully",
    statusCode: 200,
    data: result,
  });
});
const resendOTP = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await UserService.resendOTP(email);

  sendResponse(res, {
    success: true,
    message: "OTP resent successfully",
    statusCode: 200,
    data: result,
  });
});
const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await UserService.forgetPassword(email);

  sendResponse(res, {
    success: true,
    message: "Password reset OTP sent successfully",
    statusCode: 200,
    data: result,
  });
});
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.user;
  const { password } = req.body;
  const result = await UserService.resetPassword(email, password);

  sendResponse(res, {
    success: true,
    message: "Your password reset successfully",
    statusCode: 200,
    data: result,
  });
});
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.user;
  const { oldPassword, newPassword } = req.body;
  const result = await UserService.changePassword(
    email,
    oldPassword,
    newPassword,
  );

  sendResponse(res, {
    success: true,
    message: "Your password changed successfully",
    statusCode: 200,
    data: result,
  });
});
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.user;
  const result = await UserService.refreshToken(email);

  sendResponse(res, {
    success: true,
    message: "Your refresh token generated successfully",
    statusCode: 200,
    data: result,
  });
});
const logout = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.logout(res);

  sendResponse(res, {
    success: true,
    message: "You have logged out successfully",
    statusCode: 200,
    data: result,
  });
});

const getUserJobs = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const filters = pick(req.query, ["urgency", "status", "searchTerm"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);

  const result = await UserService.getUserJobs(id, options, filters);

  sendResponse(res, {
    success: true,
    message: "User jobs retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const getBookingsByUserId = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await UserService.getBookingsByUserId(id);

  sendResponse(res, {
    success: true,
    message: "Booking retrieved successfully",
    statusCode: 200,
    data: result,
  });
});
export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  getMe,
  updateUser,
  banUser,
  unBanUser,
  deleteUser,
  login,
  verifyUser,
  resendOTP,
  forgetPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
  getUserJobs,
  getBookingsByUserId,
};
