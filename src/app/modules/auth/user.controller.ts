import { Request, Response } from "express";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";
import { UserService } from "./user.service.js";
import config from "../../../config/index.js";
import { getSingleFilePath } from "../../shared/getFilePath.js";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const avatarUrl = getSingleFilePath(req.files, "image");
  if (avatarUrl) {
    req.body.avatarUrl = avatarUrl;
  }

  const result = await UserService.createUser(req.body);
  sendResponse(res, { statusCode: 201, success: true, message: "Registration successful! Please verify your email.", data: result });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["searchTerm", "role", "isVerified"]);
  const options = pick(req.query, ["page", "limit", "sortBy", "sortOrder"]);
  const result = await UserService.getAllUsers(filters as any, options as any);
  sendResponse(res, { statusCode: 200, success: true, message: "Users retrieved successfully", data: result });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getUserById(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "User retrieved successfully", data: result });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getMe(req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Profile retrieved successfully", data: result });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const avatarUrl = getSingleFilePath(req.files, "image");
  if (avatarUrl) {
    req.body.avatarUrl = avatarUrl;
  }

  const result = await UserService.updateUser(req.user.id, req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Profile updated successfully", data: result });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.deleteUser(req.params.id);
  sendResponse(res, { statusCode: 200, success: true, message: "User deleted successfully", data: result });
});

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.login(req.body);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: config.node_env === "production",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, { statusCode: 200, success: true, message: "Login successful", data: result });
});

const verifyUser = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.verifyUser(req.body);
  sendResponse(res, { statusCode: 200, success: true, message: "Email verified successfully", data: result });
});

const resendOTP = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.resendOTP(req.body.email);
  sendResponse(res, { statusCode: 200, success: true, message: "OTP resent successfully", data: result });
});

const forgetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.forgetPassword(req.body.email);
  sendResponse(res, { statusCode: 200, success: true, message: "Password reset link sent", data: result });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.resetPassword(req.user.id, req.body.password);
  sendResponse(res, { statusCode: 200, success: true, message: "Password reset successfully", data: result });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  const result = await UserService.changePassword(req.user.id, oldPassword, newPassword);
  sendResponse(res, { statusCode: 200, success: true, message: "Password changed successfully", data: result });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.refreshToken(req.user.id);
  sendResponse(res, { statusCode: 200, success: true, message: "Token refreshed successfully", data: result });
});

const logout = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  sendResponse(res, { statusCode: 200, success: true, message: "Logged out successfully", data: null });
});

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  getMe,
  updateUser,
  deleteUser,
  login,
  verifyUser,
  resendOTP,
  forgetPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
};
