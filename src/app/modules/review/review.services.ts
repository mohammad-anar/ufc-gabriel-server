import { Prisma } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { prisma } from "../../../helpers/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";

const createReview = async (payload: Prisma.ReviewCreateInput) => {
  const result = await prisma.review.create({
    data: payload,
  });

  return result;
};

const getAllReviews = async (
  filter: {
    searchTerm?: string;
    isFlagged?: boolean;
    isHidden?: boolean;
    rating?: number;
    workshopId?: string;
  },
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.ReviewWhereInput[] = [];

  if (filter.searchTerm) {
    andConditions.push({
      OR: [
        {
          comment: {
            contains: filter.searchTerm,
            mode: "insensitive",
          },
        },
        {
          user: {
            name: {
              contains: filter.searchTerm,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (filter.isFlagged !== undefined) {
    andConditions.push({ isFlagged: filter.isFlagged });
  }

  if (filter.isHidden !== undefined) {
    andConditions.push({ isHidden: filter.isHidden });
  }

  if (filter.rating !== undefined) {
    andConditions.push({ rating: Number(filter.rating) });
  }

  if (filter.workshopId) {
    andConditions.push({
      booking: {
        workshopId: filter.workshopId,
      },
    });
  }

  const whereConditions: Prisma.ReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.review.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          phone: true,
          status: true,
        },
      },
      booking: {
        select: { workshop: { select: { workshopName: true } } },
      },
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

  const total = await prisma.review.count({
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

// get all healthy reviews not flagged and not hidden
const getPublicReviews = async () => {
  const result = await prisma.review.findMany({
    where: {
      isFlagged: false, 
      isHidden: false,
    },
    take: 10,
    skip: 0,
    include: {
      user: {select: {id:true, name:true, avatar:true, phone:true, status:true}},
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getReviewById = async (id: string) => {
  const result = await prisma.review.findUniqueOrThrow({
    where: { id },
    include: {
      user: {select: {id:true, name:true, avatar:true, phone:true, status:true}},
    },
  });

  return result;
};

const updateReview = async (id: string, payload: Prisma.ReviewUpdateInput) => {
  const result = await prisma.review.update({
    where: { id },
    data: payload,
  });

  return result;
};

const deleteReview = async (id: string) => {
  const result = await prisma.review.delete({
    where: { id },
  });

  return result;
};

const getReviewsByWorkshopId = async (workshopId: string) => {
  const result = await prisma.review.findMany({
    where: {
      booking: {
        workshopId,
      },
    },
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getReviewsByUserId = async (userId: string) => {
  const result = await prisma.review.findMany({
    where: {
      userId,
      isHidden: false, // Don't show hidden reviews to users
    },
    include: {
      booking: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const flagReview = async (id: string, isFlagged: boolean) => {
  const result = await prisma.review.update({
    where: { id },
    data: { isFlagged },
  });
  return result;
};

const hideReview = async (id: string, isHidden: boolean) => {
  const result = await prisma.review.update({
    where: { id },
    data: { isHidden },
  });
  return result;
};

const getPendingReviews = async (userId: string) => {

  const result = await prisma.booking.findMany({
    where: {
      userId,
      status: "COMPLETED",
      review: {
        is: null,
      },
    },
    include: {
      workshop: {
        select: {
          workshopName: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return result;
};

export const ReviewService = {
  createReview,
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  getReviewsByWorkshopId,
  getReviewsByUserId,
  flagReview,
  hideReview,
  getPendingReviews,
  getPublicReviews,
};
