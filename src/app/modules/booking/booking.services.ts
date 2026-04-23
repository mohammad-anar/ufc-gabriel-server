import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { createAndEmitNotification } from "../../../helpers/socketHelper.js";

const createBookings = async (payload: Prisma.BookingCreateInput) => {
  const result = await prisma.booking.create({ data: { ...payload } });
  return result;
};
const getAllBookings = async (
  filter: { searchTerm?: string },
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.BookingWhereInput[] = [];

  if (filter.searchTerm) {
    andConditions.push({
      OR: ["title", "subTitle"].map((field) => ({
        [field]: {
          contains: filter.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditions: Prisma.BookingWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.booking.findMany({
    where: whereConditions,
    skip,
    take: limit,
    select: {
      id: true,
      createdAt: true,
      jobId: true,
      offerId: true,
      scheduleEnd: true,
      paymentStatus: true,
      scheduleStart: true,
      status: true,
      userId: true,
      updatedAt: true,
      workshopId: true,
      offer: { select: { price: true } },
      user: { select: { name: true } },
      workshop: { select: { workshopName: true } },
    },
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.booking.count({
    where: whereConditions,
  });

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: result,
  };
};
const getBookingsById = async (id: string) => {
  const result = await prisma.booking.findUniqueOrThrow({
    where: { id },
    include: {
      job: true,
      offer: true,
      review: true,
      workshop: true,
      user: true,
    },
  });
  return result;
};

// get all bookings by user id
const getBookingsByUserId = async (userId: string) => {
  const result = await prisma.booking.findMany({
    where: { userId },
    include: {
      workshop: {
        select: {
          workshopName: true,
          email: true,
          phone: true,
          address: true,
          id: true,
          ownerName: true,
        },
      },
      job: { select: { title: true, description: true, id: true } },
      offer: { select: { price: true, id: true } },
    },
  });
  return result;
};

// get all bookings by workshop id
const getBookingsByWorkshopId = async (workshopId: string) => {
  const result = await prisma.booking.findMany({ where: { workshopId } });
  return result;
};

const getReviewByBookingId = async (bookingId: string) => {
  const result = await prisma.review.findUnique({
    where: {
      bookingId,
    },
    include: {
      user: true,
      booking: true,
    },
  });

  return result;
};
const updateBooking = async (
  id: string,
  payload: Prisma.BookingUpdateInput,
) => {
  const result = await prisma.booking.update({
    where: { id },
    data: payload,
    include: {
      job: true,
    },
  });

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  await createAndEmitNotification({
    receiverUserId: result.userId,
    triggeredById: result.workshopId,
    jobId: result.jobId,
    title: "Booking updated",
    body: `Your booking for "${result.job.title}" has been updated!`,
    eventType: "BOOKING_UPDATED",
  });
  await createAndEmitNotification({
    receiverUserId: admin?.id,
    triggeredById: result.workshopId,
    jobId: result.jobId,
    title: "Booking updated",
    body: `Your booking for "${result.job.title}" has been updated!`,
    eventType: "BOOKING_UPDATED",
  });

  return result;
};
const deleteBooking = async (id: string) => {
  const result = await prisma.booking.delete({ where: { id } });
  return result;
};

// delete the room when call this api
const completeBooking = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update booking status and payment status
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: {
        status: "COMPLETED",
        paymentStatus: "PAID",
      },
      include: {
        job: true,
      },
    });

    // 2. Update job status to COMPLETED
    await tx.job.update({
      where: { id: updatedBooking.jobId },
      data: {
        status: "COMPLETED",
      },
      include: {
        offers: true,
      },
    });

    // 3. Delete the room if it exists (using deleteMany to avoid error if not found)
    await tx.room.deleteMany({
      where: { bookingId: id },
    });

    return updatedBooking;
  });

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  await createAndEmitNotification({
    receiverUserId: result.userId,
    triggeredById: result.workshopId,
    jobId: result.jobId,
    bookingId: result.id,
    title: "Booking Completed",
    body: `Your booking for "${result.job.title}" has been updated to COMPLETED!`,
    eventType: "BOOKING_COMPLETED",
  });

  await createAndEmitNotification({
    receiverUserId: admin?.id,
    triggeredById: result.workshopId,
    jobId: result.jobId,
    bookingId: result.id,
    title: "Booking updated",
    body: `Your booking for "${result.job.title}" has been updated!`,
    eventType: "BOOKING_UPDATED",
  });

  return result;
};

const getRoomByBookingId = async (bookingId: string) => {
  const result = await prisma.room.findUnique({
    where: { bookingId },
  });
  return result;
};

const rescheduleBooking = async (
  id: string,
  payload: { scheduleStart: Date; scheduleEnd: Date },
) => {
  const result = await prisma.booking.update({
    where: { id },
    data: {
      scheduleStart: payload.scheduleStart,
      scheduleEnd: payload.scheduleEnd,
    },
    include: {
      job: true,
    },
  });

  await createAndEmitNotification({
    receiverUserId: result.userId,
    triggeredById: result.workshopId,
    jobId: result.jobId,
    title: "Booking Rescheduled",
    body: `Your booking for "${result.job.title}" has been rescheduled!`,
    eventType: "BOOKING_RESCHEDULED",
  });
  return result;
};

const markPaymentStatusPaid = async (id: string) => {
  const result = await prisma.booking.update({
    where: { id },
    data: {
      paymentStatus: "PAID",
    },
  });
  return result;
};

const cancelBooking = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Update booking status and payment status
    const updatedBooking = await tx.booking.update({
      where: { id },
      data: {
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
      },
      include: {
        job: true,
      },
    });

    // 2. Delete the room if it exists
    await tx.room.deleteMany({
      where: { bookingId: id },
    });

    return updatedBooking;
  });

  await createAndEmitNotification({
    receiverUserId: result.userId,
    triggeredById: result.workshopId,
    bookingId: result.id,
    jobId: result.jobId,
    title: "Booking Completed",
    body: `Your booking for "${result.job.title}" has been updated to COMPLETED!`,
    eventType: "`BOOKING_RESCHEDULED`",
  });

  return result;
};

const getWeeklyBookings = async (
  workshopId: string,
  date?: string,
  filterBy: "scheduleStart" | "createdAt" = "scheduleStart",
) => {
  const targetDate = date ? new Date(date) : new Date();

  // Find Monday of the week
  const day = targetDate.getDay(); // 0 (Sun) to 6 (Sat)
  const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const startOfWeek = new Date(targetDate.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const result = await prisma.booking.findMany({
    where: {
      workshopId,
      [filterBy]: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
    include: {
      job: true,
      offer: true,
      user: true,
    },
    orderBy: {
      [filterBy]: "asc",
    },
  });

  return result;
};

const getMonthlyBookings = async (
  workshopId: string,
  date?: string,
  filterBy: "scheduleStart" | "createdAt" = "scheduleStart",
) => {
  const targetDate = date ? new Date(date) : new Date();
  const startOfMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    1,
  );

  const result = await prisma.booking.findMany({
    where: {
      workshopId,
      [filterBy]: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    include: {
      job: true,
      offer: true,
      user: true,
    },
    orderBy: {
      [filterBy]: "asc",
    },
  });

  return result;
};

const getDailyBookings = async (
  workshopId: string,
  date?: string,
  filterBy: "scheduleStart" | "createdAt" = "scheduleStart",
) => {
  const targetDate = date ? new Date(date) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(startOfDay.getDate() + 1);

  const result = await prisma.booking.findMany({
    where: {
      workshopId,
      [filterBy]: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
    include: {
      job: true,
      offer: true,
      user: true,
    },
    orderBy: {
      [filterBy]: "asc",
    },
  });

  return result;
};

export const BookingService = {
  createBookings,
  getAllBookings,
  getBookingsById,
  getReviewByBookingId,
  updateBooking,
  deleteBooking,
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
