import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { IFighterFilterRequest, IPaginationOptions } from "./fighter.interface.js";

const createFighter = async (payload: Prisma.FighterCreateInput) => {
  const result = await prisma.fighter.create({ data: payload });
  return result;
};

const getAllFighters = async (
  filter: IFighterFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, minRank, maxRank, ...filterData } = filter;

  const andConditions: Prisma.FighterWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "nickname", "nationality"].map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (minRank) {
    andConditions.push({
      rank: { gte: Number(minRank) },
    });
  }

  if (maxRank) {
    andConditions.push({
      rank: { lte: Number(maxRank) },
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => {
        let value = (filterData as any)[key];
        if (value === "true") value = true;
        if (value === "false") value = false;

        return {
          [key]: { equals: value },
        };
      }),
    });
  }

  const where: Prisma.FighterWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.fighter.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { division: true },
    }),
    prisma.fighter.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result,
  };
};

const getFighterById = async (id: string) => {
  const result = await prisma.fighter.findUnique({
    where: { id },
    include: {
      division: true,
      boutFighters: { include: { bout: true } },
    },
  });
  if (!result) throw new ApiError(404, "Fighter not found");
  return result;
};

const updateFighter = async (
  id: string,
  payload: Prisma.FighterUpdateInput
) => {
  await getFighterById(id);
  return prisma.fighter.update({ where: { id }, data: payload });
};

const deleteFighter = async (id: string) => {
  await getFighterById(id);
  return prisma.fighter.update({ where: { id }, data: { isActive: false } });
};

export const FighterService = {
  createFighter,
  getAllFighters,
  getFighterById,
  updateFighter,
  deleteFighter,
};
