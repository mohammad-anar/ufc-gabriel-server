import { z } from "zod";

const createContactZodSchema = z.object({

    fullName: z.string({
      message: "Full Name is required",
    }),
    address: z.string({
      message: "Address is required",
    }),
    email: z.email({
      message: "Invalid email format",
    }),
    phoneNumber: z.string({
      message: "Phone Number is required",
    }),
    message: z.string({
      message: "Message is required",
    }),
  
});

const createWorkshopContactZodSchema = z.object({
 
    companyName: z.string({
      message: "Company Name is required",
    }),
    fullName: z.string({
      message: "Full Name is required",
    }),
    phone: z.string({
      message: "Phone is required",
    }),
    additionalInfo: z.string().optional(),
 
});

export const ContactValidation = {
  createContactZodSchema,
  createWorkshopContactZodSchema,
};
