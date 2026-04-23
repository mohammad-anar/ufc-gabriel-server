import { z } from "zod";

const createServiceCategorySchema = z.object({
  body: z.object({
    name: z.string({ message: "Name is required" }).min(1),
  }),
});

const updateServiceCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
  }),
});

export const ServiceCategoryValidation = {
  createServiceCategorySchema,
  updateServiceCategorySchema,
};
