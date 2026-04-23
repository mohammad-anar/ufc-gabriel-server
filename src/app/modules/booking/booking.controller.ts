import catchAsync from "../../shared/catchAsync.js";
import ApiError from "../../../errors/ApiError.js";
import { Request, Response } from "express";
import { BookingService } from "./booking.services.js";
import pick from "../../../helpers/pick.js";
import sendResponse from "../../shared/sendResponse.js";

const createBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const payload = req.body;

  if (!id) {
    throw new ApiError(404, "User not found!");
  }
  payload.userId = id;

  const result = await BookingService.createBookings(payload);

  sendResponse(res, {
    success: true,
    message: "Booking created successfully",
    statusCode: 201,
    data: result,
  });
});
const getAllBookings = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, ["status", "paymentStatus"]);
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const result = await BookingService.getAllBookings(filters, options);

  sendResponse(res, {
    success: true,
    message: "Bookings retrieved successfully",
    statusCode: 200,
    data: result,
  });
});
const getBookingById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.getBookingsById(id);

  sendResponse(res, {
    success: true,
    message: "Booking retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const getBookingsByUserId = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.getBookingsByUserId(id);

  sendResponse(res, {
    success: true,
    message: "Bookings retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const getBookingsByWorkshopId = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.getBookingsByWorkshopId(id);

  sendResponse(res, {
    success: true,
    message: "Bookings retrieved successfully",
    statusCode: 200,
    data: result,
  });
}); 

const getReviewByBookingId = async (req: Request, res: Response) => {
  const { bookingId } = req.params;

  const result = await BookingService.getReviewByBookingId(bookingId);

  res.status(200).json({
    success: true,
    message: "Review retrieved successfully",
    data: result,
  });
};

const updateBookings = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await BookingService.updateBooking(id, payload);

  sendResponse(res, {
    success: true,
    message: "Bookings updated successfully",
    statusCode: 200,
    data: result,
  });
});
const deleteBookings = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.deleteBooking(id);

  sendResponse(res, {
    success: true,
    message: "Bookings deleted successfully",
    statusCode: 200,
    data: result,
  });
});

const completeBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.completeBooking(id);

  // room should be deleted
  

  sendResponse(res, {
    success: true,
    message: "Booking completed successfully",
    statusCode: 200,
    data: result,
  });
});

const getRoomByBookingId = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.getRoomByBookingId(id);

  sendResponse(res, {
    success: true,
    message: "Room retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const rescheduleBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.rescheduleBooking(id, req.body);

  sendResponse(res, {
    success: true,
    message: "Booking rescheduled successfully",
    statusCode: 200,
    data: result,
  });
});

const markPaymentStatusPaid = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.markPaymentStatusPaid(id);

  sendResponse(res, {
    success: true,
    message: "Payment status marked as PAID successfully",
    statusCode: 200,
    data: result,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BookingService.cancelBooking(id);

  sendResponse(res, {
    success: true,
    message: "Booking cancelled and payment status set to REFUNDED successfully",
    statusCode: 200,
    data: result,
  });
});

const getWeeklyBookings = catchAsync(async (req: Request, res: Response) => {
  const { workshopId } = req.params;
  const { date, filterBy } = req.query as { date: string; filterBy: "scheduleStart" | "createdAt" };
  const result = await BookingService.getWeeklyBookings(workshopId, date, filterBy);

  sendResponse(res, {
    success: true,
    message: "Weekly bookings retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const getMonthlyBookings = catchAsync(async (req: Request, res: Response) => {
  const { workshopId } = req.params;
  const { date, filterBy } = req.query as { date: string; filterBy: "scheduleStart" | "createdAt" };
  const result = await BookingService.getMonthlyBookings(workshopId, date, filterBy);

  sendResponse(res, {
    success: true,
    message: "Monthly bookings retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

const getDailyBookings = catchAsync(async (req: Request, res: Response) => {
  const { workshopId } = req.params;
  const { date, filterBy } = req.query as { date: string; filterBy: "scheduleStart" | "createdAt" };
  const result = await BookingService.getDailyBookings(workshopId, date, filterBy);

  sendResponse(res, {
    success: true,
    message: "Daily bookings retrieved successfully",
    statusCode: 200,
    data: result,
  });
});

export const BookingController = {
  createBooking,
  getAllBookings,
  getBookingById,
  getReviewByBookingId,
  updateBookings,
  deleteBookings,
  completeBooking,
  getRoomByBookingId,
  rescheduleBooking,
  markPaymentStatusPaid,
  cancelBooking,
  getBookingsByUserId,
  getBookingsByWorkshopId,
  getWeeklyBookings,
  getMonthlyBookings,
  getDailyBookings,
};
