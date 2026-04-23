import { z } from "zod";
import { BookingStatus, PaymentStatus } from "../../../types/enum.js";

export const CreateBookingSchema = z.object({
  jobId: z.string({ message: "Job ID is required" }),
  offerId: z.string({ message: "Offer ID is required" }),
  workshopId: z.string({ message: "Workshop ID is required" }),
  scheduleStart: z.coerce.date({
    message: "Schedule start is required",
  }),
  scheduleEnd: z.coerce.date({ message: "Schedule end is required" }),
});

export const UpdateBookingSchema = z.object({
  scheduleStart: z.coerce.date().optional(),
  scheduleEnd: z.coerce.date().optional(),
  status: z.enum(BookingStatus).optional(),
  paymentStatus: z.enum(PaymentStatus).optional(),
});

export const RescheduleBookingSchema = z.object({
  scheduleStart: z.coerce.date({
    message: "Schedule start is required",
  }),
  scheduleEnd: z.coerce.date({
    message: "Schedule end is required",
  }),
});
