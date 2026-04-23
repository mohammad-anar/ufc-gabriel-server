import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";

const createBike = async (payload: Prisma.BikeCreateInput) => {
  const result = await prisma.bike.create({ data: payload });
  return result;
};

// const getAllBikes = async () => {};

const getBikeById = async (id: string, userId: string) => {
  const bike = await prisma.bike.findUnique({ where: { id, ownerId: userId } });
  if (!bike) {
    throw new ApiError(403, "You can't get others bike!");
  }
  const result = await prisma.bike.findUnique({ where: { id } });
  if (!result) {
    throw new ApiError(404, "Bike not found!");
  }
  return result;
};

const getBikesByUserId = async (userId: string) => {
  const result = await prisma.bike.findMany({
    where: {
      ownerId: userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};



const updateBike = async (
  id: string,
  payload: Prisma.BikeUpdateInput,
  userId: string,
) => {
  const bike = await prisma.bike.findUnique({
    where: { id, ownerId: userId },
  });
  if (!bike) {
    throw new ApiError(403, "You can't update others bike!");
  }
  const result = await prisma.bike.update({ where: { id }, data: payload });
  return result;
};

const deleteBike = async (id: string, userId: string) => {
  const bike = await prisma.bike.findUnique({
    where: { id, ownerId: userId },
  });
  if (!bike) {
    throw new ApiError(403, "You can't delete others bike!");
  }
  const result = await prisma.bike.delete({ where: { id } });
  return result;
};

export const BikeService = {
  createBike,
  getBikeById,
  getBikesByUserId,
  updateBike,
  deleteBike,
};
