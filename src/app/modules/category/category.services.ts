import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import ApiError from "../../../errors/ApiError.js";

const createCategory = async (payload: Prisma.CategoryCreateInput) => {
  const result = await prisma.category.create({
    data: payload,
  });

  return result;
};

// get all categories
const getAllCategories = async (
  filter: { searchTerm?: string | undefined },
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filter;

  const andConditions: Prisma.CategoryWhereInput[] = [];
  if (filter.searchTerm) {
    andConditions.push({
      OR: ["name"].map((field) => ({
        [field]: {
          contains: filter.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.CategoryWhereInput = { AND: andConditions };

  const result = await prisma.category.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
    select: {
      id: true,
      name: true,
    },
  });

  const total = await prisma.category.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

// get category by id
const getCategoryById = async (id: string) => {
  const result = await prisma.category.findUniqueOrThrow({ where: { id } });
  return result;
};

// update category by id
const updateCategory = async (
  id: string,
  payload: Prisma.CategoryUpdateInput,
) => {
  const category = await prisma.category.findUniqueOrThrow({ where: { id } });
  if (!category) {
    throw new ApiError(400, "Category not found!");
  }

  const result = await prisma.category.update({ where: { id }, data: payload });
  return result;
};
// update category by id
const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUniqueOrThrow({ where: { id } });
  if (!category) {
    throw new ApiError(400, "Category not found!");
  }

  const result = await prisma.category.delete({ where: { id } });
  return result;
};

export const CategoryService = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
