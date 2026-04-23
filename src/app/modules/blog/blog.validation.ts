import { z } from "zod";

// Content item schema
const BlogContentSchema = z.object({
  heading: z.string({ message: "Heading is required" }),
  details: z.string({ message: "Details are required" }),
});

// Create Blog schema
export const CreateBlogSchema = z.object({
  title: z.string({ message: "Title is required" }),
  subTitle: z.string({ message: "SubTitle is required" }),
  readTime: z.string({
    message: "Read time is required",
  }),
  authorId: z.string({ message: "Author ID is required" }),
  categoryId: z.string({ message: "Category ID is required" }),
  contents: z
    .array(BlogContentSchema)
    .nonempty({ message: "Contents cannot be empty" }),
});

export const UpdateBlogSchema = z.object({
  title: z.string().optional(),
  subTitle: z.string().optional(),
  readTime: z
    .string({
      message: "Read time is required",
    })
    .optional(),
  authorId: z.string().optional(),
  categoryId: z.string().optional(),
  contents: z.array(BlogContentSchema).optional(),
});
