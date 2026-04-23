import { Request, Response } from "express";
import { ChatService } from "./chat.service.js";
//role
import catchAsync from "../../shared/catchAsync.js";
import sendResponse from "../../shared/sendResponse.js";
import { Role } from "../../../types/enum.js";

const createRoom = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await ChatService.createRoom(payload);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Room created successfully",
    data: result,
  });
});

const getRoomById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ChatService.getRoomById(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Room retrieved successfully",
    data: result,
  });
});

const getMyRooms = catchAsync(async (req: Request, res: Response) => {
  const { id, role } = req.user;

  let result: any;
  if (role === Role.USER) {
    result = await ChatService.getUserRooms(id);
  } else if (role === Role.WORKSHOP) {
    result = await ChatService.getWorkshopRooms(id);
  } else {
    result = [];
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Rooms retrieved successfully",
    data: result,
  });
});

const getRoomMessages = catchAsync(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const result = await ChatService.getRoomMessages(roomId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});

const markMessagesAsRead = catchAsync(async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { id } = req.user;
  const result = await ChatService.markMessagesAsRead(roomId, id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Messages marked as read successfully",
    data: result,
  });
});

const getRoomByBookingId = catchAsync(async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  const result = await ChatService.getRoomByBookingId(bookingId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Room retrieved successfully",
    data: result,
  });
});

export const ChatController = {
  createRoom,
  getRoomById,
  getMyRooms,
  getRoomMessages,
  markMessagesAsRead,
  getRoomByBookingId,
};
