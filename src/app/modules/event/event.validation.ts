import { z } from "zod";

const createEventZodSchema = z.object({
  name: z.string({ message: "Event name is required" }),
  location: z.string({ message: "Location is required" }),
  date: z.string({ message: "Date is required" }),
  posterUrl: z.string().url().optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  bouts: z.array(
    z.object({
      weightClass: z.string({ message: "Weight class is required" }),
      rounds: z.number().int().min(1),
      isMainEvent: z.boolean().optional(),
      isCoMainEvent: z.boolean().optional(),
      fighters: z.array(
        z.object({
          fighterId: z.string({ message: "Fighter ID is required" }),
        })
      ).length(2, "Exactly 2 fighters required per bout"),
    })
  ).optional(),
});

const updateEventZodSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  date: z.string().optional(),
  posterUrl: z.string().url().nullable().optional(),
  status: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  bouts: z.array(
    z.object({
      id: z.string().optional(),
      weightClass: z.string().optional(),
      rounds: z.number().int().optional(),
      isMainEvent: z.boolean().optional(),
      isCoMainEvent: z.boolean().optional(),
      fighters: z.array(
        z.object({
          fighterId: z.string(),
        })
      ).optional(),
    })
  ).optional(),
});


const createBoutZodSchema = z.object({
  eventId: z.string({ message: "Event ID is required" }),
  weightClass: z.string({ message: "Weight class is required" }),
  rounds: z.number().int().optional(),
  isMainEvent: z.boolean().optional(),
  isCoMainEvent: z.boolean().optional(),
  fighters: z.array(
    z.object({
      fighterId: z.string({ message: "Fighter ID is required" }),
    })
  ).length(2, "Exactly 2 fighters required"),
});

const postBoutResultZodSchema = z.object({
  winnerId: z.string({ message: "Winner ID is required" }),
  winPoint: z.boolean(),
  finishBonus: z.boolean(),
  winningChampionshipBout: z.boolean(),
  championVsChampionWin: z.boolean(),
  winningAgainstRankedOpponent: z.boolean(),
  winningFiveRoundFight: z.boolean(),
});

export const EventValidation = {
  createEventZodSchema,
  updateEventZodSchema,
  createBoutZodSchema,
  postBoutResultZodSchema,
};
