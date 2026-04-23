import { z } from "zod";

export const createWorkshopCategoryZodSchema = z.object({
 
    workshopId: z.string({
      message: "Workshop ID is required",
    }),
    categoryId: z.string({
      message: "Category ID is required",
    }),
 
});

export const updateWorkshopCategoryZodSchema = z.object({
  
    workshopId: z.string().optional(),
    categoryId: z.string().optional(),
  
});

export const WorkshopCategoryValidation = {
  createWorkshopCategoryZodSchema,
  updateWorkshopCategoryZodSchema,
};
