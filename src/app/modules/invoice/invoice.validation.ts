import { z } from "zod";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format")
  .optional();

const generateMonthlyZodSchema = z.object({
  month: monthSchema,
});

const getMonthlyZodSchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"),
});

const updateInvoiceStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(["PAID", "SENT", "CANCELLED"]),
  }),
});

const downloadWorkshopInvoiceZodSchema = z.object({
  query: z.object({
    month: z
      .string()
      .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format"),
  }),
});

export const InvoiceValidation = {
  generateMonthlyZodSchema,
  getMonthlyZodSchema,
  updateInvoiceStatusZodSchema,
  downloadWorkshopInvoiceZodSchema,
};