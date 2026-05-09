import { z } from "zod";

const pickFighterZodSchema = z.object({
    fighterId: z.string({ message: "Fighter ID is required" }),

});

const setQueueZodSchema = z.object({
    orderedFighterIds: z.array(z.string()).min(1, "At least one fighter ID is required"),
});

export const DraftValidation = {
  pickFighterZodSchema,
  setQueueZodSchema,
};
