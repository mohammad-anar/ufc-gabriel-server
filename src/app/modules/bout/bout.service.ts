import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { ICreateBoutPayload, IPostBoutResultPayload } from "./bout.interface.js";
import { calculateAndSaveScores } from "./bout.scoring.js";

const createBout = async (payload: ICreateBoutPayload) => {
  const { fighters, ...boutData } = payload;

  if (fighters.length !== 2) {
    throw new ApiError(400, "Exactly 2 fighters are required per bout");
  }

  const result = await prisma.$transaction(async (tx) => {
    const bout = await tx.bout.create({ data: boutData });
    await tx.boutFighter.createMany({
      data: fighters.map((f) => ({ boutId: bout.id, ...f })),
    });
    return tx.bout.findUnique({
      where: { id: bout.id },
      include: { boutFighters: { include: { fighter: true } } },
    });
  });

  return result;
};

const getBoutsByEventId = async (eventId: string) => {
  return prisma.bout.findMany({
    where: { eventId },
    orderBy: { order: "asc" },
    include: {
      boutFighters: { include: { fighter: true } },
      outcome: { include: { winner: true } },
    },
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

  if (bout.outcome) {
    throw new ApiError(400, "Result has already been posted for this bout");
  }

  // Verify winner is one of the bout's fighters
  const fighterIds = bout.boutFighters.map((bf) => bf.fighterId);
  if (!fighterIds.includes(payload.winnerId)) {
    throw new ApiError(400, "Winner must be one of the bout's fighters");
  }

  const updated = await prisma.bout.update({
    where: { id },
    data: {
      outcome: {
        create: {
          winnerId: payload.winnerId,
          resultType: payload.result as any,
          isFinish: payload.isFinish ?? false,
          isTitleFight: payload.isTitleFight ?? false,
          isChampionVsChampion: payload.isChampionVsChampion ?? false,
          isWinnerAgainstRanked: payload.isWinnerAgainstRanked ?? false,
          isFiveRoundFight: payload.isFiveRoundFight ?? false,
        },
      },
    },
    include: { outcome: true },
  });

  // Trigger scoring calculation
  await calculateAndSaveScores(id);

  return updated;
};

const deleteBout = async (id: string) => {
  await getBoutById(id);
  return prisma.bout.delete({ where: { id } });
};

export const BoutService = {
  createBout,
  getBoutsByEventId,
  getBoutById,
  postBoutResult,
  deleteBout,
};
