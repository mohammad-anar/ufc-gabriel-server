import { Prisma } from "@prisma/client";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { ICreateBoutPayload, ICreateEventPayload, IEventFilterRequest, IPostBoutResultPayload } from "./event.interface.js";
import { calculateAndSaveScores } from "./bout.scoring.js";


type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

const createEvent = async (payload: ICreateEventPayload) => {
  const { bouts, ...eventData } = payload;

  if (eventData.date) {
    (eventData as any).date = new Date(eventData.date);
  }

  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.event.create({ data: eventData as any });


    if (bouts && bouts.length > 0) {
      for (const boutData of bouts) {
        const { fighters, ...data } = boutData;
        const bout = await tx.bout.create({
          data: { ...data, eventId: event.id },
        });
        await tx.boutFighter.createMany({
          data: fighters.map((f) => ({ ...f, boutId: bout.id })) as any,
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
        orderBy: { createdAt: "asc" },

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

const updateEvent = async (id: string, payload: any) => {
  const event = await getEventById(id);
  if (event.status === "COMPLETED") throw new ApiError(400, "Completed events cannot be updated");
  const { bouts, ...eventData } = payload;

  if (eventData.date && typeof eventData.date === "string") {
    eventData.date = new Date(eventData.date);
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update event metadata
    const updatedEvent = await tx.event.update({
      where: { id },
      data: eventData,
    });

    // 2. Handle nested bouts if provided
    if (bouts && Array.isArray(bouts)) {
      const payloadBoutIds = bouts.map((b: any) => b.id).filter((id) => !!id);

      // Delete bouts that are no longer in the payload
      await tx.bout.deleteMany({
        where: {
          eventId: id,
          id: { notIn: payloadBoutIds },
        },
      });

      for (const boutData of bouts) {
        const { id: boutId, fighters, ...data } = boutData;

        if (boutId) {
          // Update existing bout
          await tx.bout.update({
            where: { id: boutId },
            data: data,
          });

          // Sync fighters for existing bout
          if (fighters && Array.isArray(fighters)) {
            await tx.boutFighter.deleteMany({ where: { boutId } });
            await tx.boutFighter.createMany({
              data: fighters.map((f: any) => ({ fighterId: f.fighterId, boutId })),
            });
          }
        } else {
          // Create new bout for this event
          const newBout = await tx.bout.create({
            data: { ...data, eventId: id },
          });

          if (fighters && Array.isArray(fighters)) {
            await tx.boutFighter.createMany({
              data: fighters.map((f: any) => ({ fighterId: f.fighterId, boutId: newBout.id })),
            });
          }
        }
      }
    }


    return updatedEvent;
  });
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

const checkAndCompleteEvent = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      bouts: {
        include: { outcome: true },
      },
    },
  });

  if (!event) return;

  // Check if all bouts have an outcome
  const allBoutsFinished = event.bouts.length > 0 && event.bouts.every((bout) => !!bout.outcome);

  if (allBoutsFinished) {
    await prisma.event.update({
      where: { id: eventId },
      data: { hasResults: true, status: "COMPLETED" },
    });
  }
};

// Merged Bout Methods
const createBout = async (payload: ICreateBoutPayload) => {
  const { fighters, ...boutData } = payload;
  if (fighters.length !== 2) throw new ApiError(400, "Exactly 2 fighters are required per bout");

  return prisma.$transaction(async (tx) => {
    const bout = await tx.bout.create({ data: boutData });
    await tx.boutFighter.createMany({
      data: fighters.map((f) => ({ boutId: bout.id, ...f })) as any,
    });
    return tx.bout.findUnique({
      where: { id: bout.id },
      include: { boutFighters: { include: { fighter: true } } },
    });
  });
};

const getBoutById = async (id: string) => {
  const result = await prisma.bout.findUnique({
    where: { id },
    include: {
      boutFighters: { include: { fighter: true } },
      outcome: { include: { winner: true } },
      event: true,
    },
  });
  if (!result) throw new ApiError(404, "Bout not found");
  return result;
};

const postBoutResult = async (id: string, payload: IPostBoutResultPayload) => {
  const bout = await getBoutById(id);
  // Remove the check that prevents updates:
  // if (bout.outcome) throw new ApiError(400, "Result has already been posted for this bout");

  const fighterIds = bout.boutFighters.map((bf) => bf.fighterId);
  if (!fighterIds.includes(payload.winnerId)) throw new ApiError(400, "Winner must be one of the bout's fighters");

  const updated = await prisma.bout.update({
    where: { id },
    data: {
      outcome: {
        upsert: {
          create: {
            winnerId: payload.winnerId,
            winPoint: payload.winPoint,
            finishBonus: payload.finishBonus,
            winningChampionshipBout: payload.winningChampionshipBout,
            championVsChampionWin: payload.championVsChampionWin,
            winningAgainstRankedOpponent: payload.winningAgainstRankedOpponent,
            winningFiveRoundFight: payload.winningFiveRoundFight,
          },
          update: {
            winnerId: payload.winnerId,
            winPoint: payload.winPoint,
            finishBonus: payload.finishBonus,
            winningChampionshipBout: payload.winningChampionshipBout,
            championVsChampionWin: payload.championVsChampionWin,
            winningAgainstRankedOpponent: payload.winningAgainstRankedOpponent,
            winningFiveRoundFight: payload.winningFiveRoundFight,
          },
        },
      },
    },
    include: { outcome: true },
  });

  await calculateAndSaveScores(id);
  await checkAndCompleteEvent(bout.eventId);
  return updated;
};

const deleteBout = async (id: string) => {
  await getBoutById(id);
  return prisma.bout.delete({ where: { id } });
};

export const EventService = {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  postResults,
  checkAndCompleteEvent,
  createBout,
  getBoutById,
  postBoutResult,
  deleteBout,
};
