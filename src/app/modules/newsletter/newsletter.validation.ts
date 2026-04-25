import { z } from "zod";

const createNewsletterZodSchema = z.object({
  body: z.object({
    title: z.string({ required_error: "Title is required" }),
    description: z.string({ required_error: "Description is required" }),
  }),
});

const updateNewsletterZodSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }),
});

export const NewsletterValidation = {
  createNewsletterZodSchema,
  updateNewsletterZodSchema,
};
