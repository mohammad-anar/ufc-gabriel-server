import { z } from "zod";

export const createWorkshopOpeningHourSchema = z.object({
  workshopId: z.string({
    message: "Workshop ID is required",
  }),

  day: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),

  openTime: z
    .string()
    .optional()
    .refine((val) => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
      message: "openTime must be in HH:mm format",
    }),

  closeTime: z
    .string()
    .optional()
    .refine((val) => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
      message: "closeTime must be in HH:mm format",
    }),

  isClosed: z.boolean().optional().default(false),
});


export const updateWorkshopOpeningHourSchema = z.object({
  workshopId: z.string().optional(),

  day: z
    .enum([
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ])
    .optional(),

  openTime: z
    .string()
    .optional()
    .refine((val) => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
      message: "openTime must be in HH:mm format",
    }),

  closeTime: z
    .string()
    .optional()
    .refine((val) => !val || /^([01]\d|2[0-3]):([0-5]\d)$/.test(val), {
      message: "closeTime must be in HH:mm format",
    }),

  isClosed: z.boolean().optional(),
});