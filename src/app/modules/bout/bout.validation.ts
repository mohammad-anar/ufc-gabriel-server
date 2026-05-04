import { z } from "zod";

const boutFighterSchema = z.object({
  fighterId: z.string({ message: "Fighter ID is required" }),
  corner: z.number().int().min(1).max(2),
});

const createBoutZodSchema = z.object({
    eventId: z.string({ message: "Event ID is required" }),
    weightClass: z.string({ message: "Weight class is required" }),
    rounds: z.number().int().optional(),
    isMainEvent: z.boolean().optional(),
    isCoMainEvent: z.boolean().optional(),
    isTitleFight: z.boolean().optional(),
    isChampionVsChampion: z.boolean().optional(),
    order: z.number().int().optional(),
    fighters: z
      .array(boutFighterSchema)
      .length(2, "Exactly 2 fighters required"),
});

const postBoutResultZodSchema = z.object({
    winnerId: z.string({ message: "Winner ID is required" }),
    result: z.enum([
      "KO_TKO",
      "SUBMISSION",
      "DECISION_UNANIMOUS",
      "DECISION_SPLIT",
      "DECISION_MAJORITY",
      "DRAW",
      "NO_CONTEST",
      "DQ",
    ]),
    isFinish: z.boolean().optional(),
    isTitleFight: z.boolean().optional(),
    isChampionVsChampion: z.boolean().optional(),
    isWinnerAgainstRanked: z.boolean().optional(),
    isFiveRoundFight: z.boolean().optional(),
});

export const BoutValidation = {
  createBoutZodSchema,
  postBoutResultZodSchema,
};
