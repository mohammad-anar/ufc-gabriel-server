import { Prisma } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { prisma } from "../../../helpers/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";

/* -------- CREATE CATEGORY -------- */

const createCategory = async (payload: { name: string }) => {
  const result = await prisma.serviceCategory.create({
    data: payload,
  });

  return result;
};

/* -------- GET ALL CATEGORIES -------- */

const getAllCategories = async (
  filter: { searchTerm?: string },
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.ServiceCategoryWhereInput[] = [];

  if (filter.searchTerm) {
    andConditions.push({
      name: {
        contains: filter.searchTerm,
        mode: "insensitive",
      },
    });
  }

  const whereConditions: Prisma.ServiceCategoryWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.serviceCategory.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
  });

  const total = await prisma.serviceCategory.count({
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

/* -------- GET CATEGORY BY ID -------- */

const getCategoryById = async (id: string) => {
  const result = await prisma.serviceCategory.findUnique({
    where: { id },
  });

  return result;
};

/* -------- UPDATE CATEGORY -------- */

const updateCategory = async (id: string, payload: { name?: string }) => {
  const result = await prisma.serviceCategory.update({
    where: { id },
    data: payload,
  });

  return result;
};

/* -------- DELETE CATEGORY -------- */

const deleteCategory = async (id: string) => {
  const result = await prisma.serviceCategory.delete({
    where: { id },
  });

  return result;
};

export const ServiceCategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
