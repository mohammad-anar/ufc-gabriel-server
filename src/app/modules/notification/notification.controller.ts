import catchAsync from "../../shared/catchAsync.js";
import { Request, Response } from "express";
import { NotificationService } from "./notification.services.js";
import sendResponse from "../../shared/sendResponse.js";
import pick from "../../../helpers/pick.js";

/* ---------- CREATE ---------- */
const createNotification = catchAsync(async (req: Request, res: Response) => {
  const result = await NotificationService.createNotification(req.body);

  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Notification created successfully",
    data: result,
  });
});

/* ---------- GET ALL ---------- */
const getAllNotifications = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["isRead", "searchTerm"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await NotificationService.getAllNotifications(
    filters,
    options,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notifications retrieved successfully",
    data: result,
  });
});

/* ---------- GET BY ID ---------- */
const getNotificationById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await NotificationService.getNotificationById(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notification retrieved successfully",
    data: result,
  });
});

/* ---------- GET BY USER ID ---------- */
const getNotificationsByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { userId } = req.params;

    const result = await NotificationService.getNotificationsByUserId(userId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User notifications retrieved successfully",
      data: result,
    });
  },
);

/* ---------- GET BY WORKSHOP ID ---------- */
const getNotificationsByWorkshopId = catchAsync(
  async (req: Request, res: Response) => {
    const { workshopId } = req.params;

    const result =
      await NotificationService.getNotificationsByWorkshopId(workshopId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Workshop notifications retrieved successfully",
      data: result,
    });
  },
);

/* ---------- GET BY BOOKING ID ---------- */
const getNotificationsByBookingId = catchAsync(
  async (req: Request, res: Response) => {
    const { bookingId } = req.params;

    const result =
      await NotificationService.getNotificationsByBookingId(bookingId);

    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Booking notifications retrieved successfully",
      data: result,
    });
  },
);

/* ---------- MARK AS READ ---------- */
const markAsRead = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await NotificationService.markAsRead(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notification marked as read",
    data: result,
  });
});

const markMultipleAsRead = catchAsync(async (req: Request, res: Response) => {
  const { notificationIds } = req.body; // expect array of notification IDs

  const result =
    await NotificationService.markNotificationsAsRead(notificationIds);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: `${result.count} notifications marked as read`,
    data: result,
  });
});

/* ---------- DELETE ---------- */
const deleteNotification = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await NotificationService.deleteNotification(id);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Notification deleted successfully",
    data: result,
  });
});

export const NotificationController = {
  createNotification,
  getAllNotifications,
  getNotificationById,
  getNotificationsByUserId,
  getNotificationsByWorkshopId,
  getNotificationsByBookingId,
  markAsRead,
  markMultipleAsRead,
  deleteNotification,
};
