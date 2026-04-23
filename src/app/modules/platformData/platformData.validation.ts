import { z } from "zod";

const create = z.object({
    platformFee: z
      .number()
      .min(0, "Platform fee cannot be negative"),
    maximumJobRadius: z
      .number()
      .min(0, "Maximum job radius cannot be negative"),

});

const update = z.object({
  
    platformFee: z
      .number()
      .min(0, "Platform fee cannot be negative")
      .optional(),
    maximumJobRadius: z
      .number()
      .min(0, "Maximum job radius cannot be negative")
      .optional(),
 
});

export const PlatformDataValidation = {
  create,
  update,
};
