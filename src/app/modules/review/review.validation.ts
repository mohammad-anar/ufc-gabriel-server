import { z } from "zod";

const createReviewZodSchema = z.object({

    bookingId: z.string({
      message: "Booking ID is required",
    }),
    userId: z.string({
      message: "User ID is required",
    }),
    rating: z
      .number({
        message: "Rating is required",
      })
      .int()
      .min(1)
      .max(5),
    comment: z.string().optional(),
});

const updateReviewZodSchema = z.object({

    rating: z
      .number()
      .int()
      .min(1)
      .max(5)
      .optional(),
    comment: z.string().optional(),

});

export const ReviewValidation = {
  createReviewZodSchema,
  updateReviewZodSchema,
};
