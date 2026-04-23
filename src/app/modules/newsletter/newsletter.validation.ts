import { z } from "zod";

const subscribe = z.object({

    email: z.email({
      message: "Invalid email format",
    }),
  
});

export const NewsletterValidation = {
  subscribe,
};
