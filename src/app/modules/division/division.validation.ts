import { z } from "zod";

const createDivisionZodSchema = z.object({

  name: z.string("Name is required"),

});

const updateDivisionZodSchema = z.object({

  name: z.string().optional(),

});

export const DivisionValidation = {
  createDivisionZodSchema,
  updateDivisionZodSchema,
};
