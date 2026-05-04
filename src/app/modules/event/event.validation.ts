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
      isTitleFight: z.boolean().optional(),
      order: z.number().int(),
      fighters: z.array(
        z.object({
          fighterId: z.string({ message: "Fighter ID is required" }),
          corner: z.number().int().min(1).max(2),
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

});

export const EventValidation = {
  createEventZodSchema,
  updateEventZodSchema,
};
