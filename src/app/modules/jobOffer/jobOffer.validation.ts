import { OfferStatus } from "../../../types/enum.js";
import { z } from "zod";

// 1️⃣ Create JobOffer Schema
export const CreateJobOfferSchema = z.object({
  jobId: z.string({ message: "Job ID is required" }),
  workshopId: z.string({ message: "Workshop ID is required" }),
  price: z
    .number({ message: "Price is required" })
    .positive("Price must be greater than 0"),
  estimatedTime: z.string({
    message: "Estimated time is required",
  }),
  message: z.string().optional(),
});

// 2️⃣ Update JobOffer Schema
export const UpdateJobOfferSchema = z.object({
  price: z.number().positive("Price must be greater than 0").optional(),
  estimatedTime: z.coerce.date().optional(),
  message: z.string().optional(),
  status: z.enum(OfferStatus).optional(),
});
