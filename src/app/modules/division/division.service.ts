import { Division, Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { IDivisionFilterRequest } from "./division.interface.js";

const createDivision = async (data: Division): Promise<Division> => {
  const isExist = await prisma.division.findUnique({
    where: { name: data.name },
  });
  if (isExist) {
    throw new ApiError(400, "Division already exists");
  }
  return await prisma.division.create({ data });
};

const getAllDivisions = async (
  filters: IDivisionFilterRequest,
  options: { page?: number; limit?: number; sortBy?: string; sortOrder?: string }
) => {
  const { limit, page, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.DivisionWhereInput[] = [];

  if (filters.searchTerm) {
    andConditions.push({
      name: { contains: filters.searchTerm, mode: "insensitive" },
    });
  }

  const where: Prisma.DivisionWhereInput = andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.division.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy || "name"]: sortOrder || "asc" },
    include: {
      _count: {
        select: { fighters: true },
      },
    },
  });

  const total = await prisma.division.count({ where });

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result,
  };
};

const getDivisionById = async (id: string): Promise<Division | null> => {
  const result = await prisma.division.findUnique({
    where: { id },
    include: {
      _count: {
        select: { fighters: true },
      },
    },
  });
  if (!result) {
    throw new ApiError(404, "Division not found");
  }
  return result;
};

const updateDivision = async (id: string, payload: Partial<Division>): Promise<Division> => {
  const isExist = await prisma.division.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(404, "Division not found");
  }

  if (payload.name) {
    const nameExist = await prisma.division.findUnique({
      where: { name: payload.name },
    });
    if (nameExist && nameExist.id !== id) {
      throw new ApiError(400, "Division name already exists");
    }
  }

  return await prisma.division.update({ where: { id }, data: payload });
};

const deleteDivision = async (id: string): Promise<Division> => {
  const isExist = await prisma.division.findUnique({ where: { id } });
  if (!isExist) {
    throw new ApiError(404, "Division not found");
  }

  // Check if any fighters are in this division
  const fightersCount = await prisma.fighter.count({ where: { divisionId: id } });
  if (fightersCount > 0) {
    throw new ApiError(400, "Cannot delete division with active fighters");
  }

  return await prisma.division.delete({ where: { id } });
};

export const DivisionService = {
  createDivision,
  getAllDivisions,
  getDivisionById,
  updateDivision,
  deleteDivision,
};
