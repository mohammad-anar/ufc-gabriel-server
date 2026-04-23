import { z } from "zod";

// ------------------- CREATE CATEGORY SCHEMA -------------------
export const CreateCategorySchema = z.object({
  name: z
    .string({ message: "Category name is required" })
    .min(1, "Category name cannot be empty"),
});

// ------------------- UPDATE CATEGORY SCHEMA -------------------
export const UpdateCategorySchema = z.object({
  name: z
    .string({ message: "Category name must be a string" })
    .min(1, "Category name cannot be empty")
    .optional(),
});
