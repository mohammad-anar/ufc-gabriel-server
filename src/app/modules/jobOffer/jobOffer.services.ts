import { Prisma } from "@prisma/client";
import { JobStatus } from "../../../types/enum.js";
import { ChatService } from "../chat/chat.service.js";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { calculateDistance } from "../../../helpers/distance.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { timeInHours } from "../../../helpers/timeConvertHelper.js";
import { createAndEmitNotification } from "../../../helpers/socketHelper.js";

const createJobOffer = async (payload: any) => {
  // check if already sent offer for this job then throw a error message
  const isExistOffer = await prisma.jobOffer.findFirst({
    where: {
      jobId: payload.jobId,
      workshopId: payload.workshopId,
    },
  });

  if (isExistOffer) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You have already sent an offer for this job",
    );
  }

  // 1. Fetch Job and Workshop to get coordinates
  const [job, workshop] = await Promise.all([
    prisma.job.findUnique({ where: { id: payload.jobId } }),
    prisma.workshop.findUnique({ where: { id: payload.workshopId } }),
  ]);

  let distance: number | undefined;
  if (
    job?.latitude &&
    job?.longitude &&
    workshop?.latitude &&
    workshop?.longitude
  ) {
    distance = calculateDistance(
      job.latitude,
      job.longitude,
      workshop.latitude,
      workshop.longitude,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const newOffer = await tx.jobOffer.create({
      data: {
        ...payload,
        distance,
      },
      include: {
        job: true,
        booking: true,
        workshop: true,
      },
    });

    try {
      await createAndEmitNotification({
        receiverUserId: newOffer.job.userId,
        triggeredById: newOffer.workshopId,
        jobId: newOffer.jobId,
        title: "Get New Job Offer!",
        body: `Your've got a new offer for "${newOffer.job.title}"!`,
        eventType: "JOB_OFFER_RECEIVED",
      });
    } catch (error) {
      console.error("Failed to send notification:", error);
    }

    // Update job to include this workshopId in workshopIds array
    await tx.job.update({
      where: { id: payload.jobId },
      data: {
        workshopIds: {
          push: payload.workshopId,
        },
      },
    });

    return newOffer;
  });

  return result;
};

const getOfferById = async (id: string) => {
  const result = await prisma.jobOffer.findUniqueOrThrow({ where: { id } });
  return result;
};

// add pagination here
const getJobOffersByUserId = async (
  userId: string,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const result = await prisma.jobOffer.findMany({
    where: { job: { userId } },
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      workshop: { select: { id: true, workshopName: true } },
    },
  });

  const total = await prisma.jobOffer.count({
    where: { job: { userId } },
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

const updateOfferById = async (
  id: string,
  payload: Prisma.JobOfferUpdateInput,
) => {
  const result = await prisma.jobOffer.update({ where: { id }, data: payload });
  return result;
};

const deleteOffer = async (id: string) => {
  const result = await prisma.jobOffer.delete({ where: { id } });
  return result;
};

const acceptOffer = async (id: string, userId: string) => {
  // 1. Fetch offer and verify job status
  const offer = await prisma.jobOffer.findUniqueOrThrow({
    where: { id },
    include: { job: true, workshop: true },
  });

  // if have accepted offer then return
  const acceptedOffer = await prisma.jobOffer.findFirst({
    where: { jobId: offer.jobId, status: "ACCEPTED" },
  });
  if (acceptedOffer) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This job already has an accepted offer",
    );
  }

  if (offer.job.userId !== userId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "You are not authorized to accept this offer",
    );
  }

  const allowedStatuses: JobStatus[] = [JobStatus.PENDING, JobStatus.OPEN];
  if (!allowedStatuses.includes(offer.job.status as JobStatus)) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This job already has an accepted offer or is no longer pending or open",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // 2. Update Offer status
    const updatedOffer = await tx.jobOffer.update({
      where: { id },
      data: { status: "ACCEPTED" },
    });

    // need to reject other offers
    await tx.jobOffer.updateMany({
      where: { jobId: offer.jobId, status: "PENDING" },
      data: { status: "REJECTED" },
    });

    // 3. Update Job status
    await tx.job.update({
      where: { id: offer.jobId },
      data: { status: "IN_PROGRESS" },
    });

    // 4. Create Booking
    const booking = await tx.booking.create({
      data: {
        jobId: offer.jobId,
        offerId: offer.id,
        userId: offer.job.userId,
        workshopId: offer.workshopId,
        scheduleStart: new Date(),
        scheduleEnd: new Date(new Date(timeInHours(offer.estimatedTime))),
        status: "CONFIRMED",
      },
    });

    // 5. Create Chat Room
    const room = await ChatService.createRoom(
      {
        bookingId: booking.id,
        userId: offer.job.userId,
        workshopId: offer.workshopId,
        name: `${offer.job.title} - Chat`,
      },
      tx,
    );

    return { offer: updatedOffer, booking, room };
  });

  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
  });

  // 6. Send notification to workshop
  try {
    await createAndEmitNotification({
      receiverWorkshopId: offer.workshopId,
      triggeredById: offer.job.userId,
      jobId: offer.jobId,
      bookingId: result.booking.id,
      title: "Offer Accepted!",
      body: `Your offer for "${offer.job.title}" has been accepted!`,
      eventType: "OFFER_ACCEPTED",
    });

    await createAndEmitNotification({
      receiverUserId: admin?.id,
      triggeredById: offer.workshopId,
      jobId: offer.jobId,
      bookingId: result.booking.id,
      title: "Booking confirmed",
      body: `Your booking for "${offer.job.title}" has been confirmed!`,
      eventType: "BOOKING_CONFIRMED",
    });
  } catch (error) {
    console.error("Failed to send notification:", error);
  }

  return result;
};

export const JobOfferServices = {
  createJobOffer,
  getOfferById,
  getJobOffersByUserId,
  updateOfferById,
  deleteOffer,
  acceptOffer,
};
