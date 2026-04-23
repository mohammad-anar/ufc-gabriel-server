import { BikeType, JobStatus, Urgency } from "../../../types/enum.js";
import { z } from "zod";

export const UrgencyEnum = z.enum(Urgency);
export const JobStatusEnum = z.enum(JobStatus);
export const BikeTypeEnum = z.enum(BikeType);

export const JobCategorySchema = z.object({
  categoryId: z.string({
    message: "Category ID is required",
  }),
  description: z.string({
    message: "Description is required",
  }),
});

export const CreateJobSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  address: z.string(),
  city: z.string(),
  postalCode: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  radius: z.number().optional(),
  bikeName: z.string(),
  bikeType: z.enum(BikeType),
  bikeBrand: z.string().optional(),
  preferredTime: z.string(),
  urgency: z.enum(Urgency).optional(),
  categories: z.array(JobCategorySchema).min(1),
});

export const UpdateJobSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().min(5).optional(),

  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),

  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().min(1).optional(),

  bikeName: z.string().optional(),
  bikeType: z.enum(BikeType).optional(),
  bikeBrand: z.string().optional(),
  preferredTime: z.string().optional(),
  urgency: z.enum(Urgency).optional(),
  categories: z.array(JobCategorySchema).optional(),
});
