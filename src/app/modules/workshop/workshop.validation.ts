import { z } from "zod";

// Common reusable validations
const emailSchema = z.string().email();
const phoneSchema = z.string().optional();
const stringOptional = z.string().optional();
const floatOptional = z.number().optional();

// Create Workshop Schema
export const createWorkshopSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: phoneSchema,
  avatar: stringOptional,
  workshopName: z.string().min(1, "Workshop name is required"),
  ownerName: z.string().min(1, "Owner name is required"),
  cvrNumber: z.string().min(1, "CVR number is required"),
  description: stringOptional,
  address: stringOptional,
  country: stringOptional,
  state: stringOptional,
  city: z.string().min(1, "City is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  latitude: floatOptional,
  longitude: floatOptional,
  platformFees: floatOptional,
});

// Update Workshop Schema (all fields optional)
export const updateWorkshopSchema = z.object({
  email: emailSchema.optional(),
  password: z.string().min(6).optional(),
  phone: phoneSchema,
  avatar: stringOptional,
  workshopName: z.string().min(1).optional(),
  ownerName: z.string().min(1).optional(),
  cvrNumber: z.string().min(1).optional(),
  description: stringOptional,
  address: stringOptional,
  country: stringOptional,
  state: stringOptional,
  city: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  latitude: floatOptional,
  longitude: floatOptional,
  isVerified: z.boolean().optional(),
  platformFees: floatOptional,
});
