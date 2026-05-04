import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { ICreateEventPayload, IEventFilterRequest } from "./event.interface.js";

type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

const createEvent = async (payload: ICreateEventPayload) => {
  const { bouts, ...eventData } = payload;

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({ data: eventData });

    if (bouts && bouts.length > 0) {
      for (const boutData of bouts) {
        const { fighters, ...data } = boutData;
        const bout = await tx.bout.create({
          data: { ...data, eventId: event.id },
        });
        await tx.boutFighter.createMany({
          data: fighters.map((f) => ({ ...f, boutId: bout.id })),
        });
      }
    }

    return tx.event.findUnique({
      where: { id: event.id },
      include: {
        bouts: {
          include: { boutFighters: { include: { fighter: true } } },
        },
      },
    });
  });

  return result;
};

const getAllEvents = async (
  filter: IEventFilterRequest,
  options: IPaginationOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filter;

  const andConditions: Prisma.EventWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "location"].map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const where: Prisma.EventWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const [result, total] = await Promise.all([
    prisma.event.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: { _count: { select: { bouts: true } } },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result,
  };
};

const getEventById = async (id: string) => {
  const result = await prisma.event.findUnique({
    where: { id },
    include: {
      bouts: {
        orderBy: { order: "asc" },
        include: {
          boutFighters: { include: { fighter: true } },
          outcome: { include: { winner: true } },
        },
      },
    },
  });
  if (!result) throw new ApiError(404, "Event not found");
  return result;
};

const updateEvent = async (id: string, payload: Prisma.EventUpdateInput) => {
  await getEventById(id);
  return prisma.event.update({ where: { id }, data: payload });
};

const deleteEvent = async (id: string) => {
  await getEventById(id);
  return prisma.event.delete({ where: { id } });
};

const postResults = async (id: string) => {
  await getEventById(id);
  return prisma.event.update({
    where: { id },
    data: { hasResults: true, status: "COMPLETED" },
  });
};

export const EventService = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  postResults,
};
