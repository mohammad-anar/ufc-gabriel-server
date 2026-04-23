import { Request, Response } from "express";
import { AnalyticsService } from "./analytics.service.js";
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";

const getUserAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await AnalyticsService.getUserAnalytics(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User analytics retrieved successfully",
    data: result,
  });
});

const getWorkshopAnalytics = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await AnalyticsService.getWorkshopAnalytics(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Workshop analytics retrieved successfully",
    data: result,
  });
});

const getAdminAnalytics = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.getAdminAnalytics();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin analytics retrieved successfully",
    data: result,
  });
});

const getMonthlyReport = catchAsync(async (req: Request, res: Response) => {
  const { year, month } = req.query;
  const now = new Date();
  const reportYear = year ? parseInt(year as string) : now.getFullYear();
  const reportMonth = month ? parseInt(month as string) : now.getMonth() + 1;

  const result = await AnalyticsService.getMonthlyReport(reportYear, reportMonth);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Monthly report retrieved successfully",
    data: result,
  });
});

const exportUsersCSV = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.exportUsersCSV();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=users.csv");
  res.status(200).send(result);
});

const exportWorkshopsCSV = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.exportWorkshopsCSV();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=workshops.csv");
  res.status(200).send(result);
});

const exportJobsCSV = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.exportJobsCSV();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=jobs.csv");
  res.status(200).send(result);
});

const exportBookingsCSV = catchAsync(async (req: Request, res: Response) => {
  const result = await AnalyticsService.exportBookingsCSV();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=bookings.csv");
  res.status(200).send(result);
});

const getWeeklyBookingCount = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await AnalyticsService.getWeeklyBookingCount(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Weekly booking count retrieved successfully",
    data: result,
  });
});

export const AnalyticsController = {
  getUserAnalytics,
  getWorkshopAnalytics,
  getAdminAnalytics,
  getMonthlyReport,
  exportUsersCSV,
  exportWorkshopsCSV,
  exportJobsCSV,
  exportBookingsCSV,
  getWeeklyBookingCount,
};
