import { Prisma } from "@prisma/client";
import slugifyModule from "slugify";
import { prisma } from "../../../helpers/prisma.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";

interface BlogPayload {
  title: string;
  subTitle: string;
  readTime: Date;
  images: string[];
  authorId: string;
  categoryId: string;
  contents: { heading: string; details: string }[];
}

const slugify = slugifyModule.default || slugifyModule;

const createBlog = async (payload: any) => {
  const { title, contents, ...rest } = payload;

  let slugBase = slugify(title, { lower: true, strict: true });
  let slug = slugBase;
  let counter = 1;

  while (await prisma.blog.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${counter++}`;
  }

  return prisma.blog.create({
    data: {
      ...rest,
      title,
      slug,
      contents: { create: contents },
    },
    include: {
      contents: true,
      category: true,
      author: true,
    },
  });
};

/* ---------------- GET ALL BLOGS ---------------- */

const getAllBlogs = async (
  filter: { searchTerm?: string },
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const andConditions: Prisma.BlogWhereInput[] = [];

  if (filter.searchTerm) {
    andConditions.push({
      OR: ["title", "subTitle"].map((field) => ({
        [field]: {
          contains: filter.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  const whereConditions: Prisma.BlogWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.blog.findMany({
    where: whereConditions,
    skip,
    take: limit,
    include: {
      contents: true,
      category: true,
      author: true,
    },
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.blog.count({
    where: whereConditions,
  });

  const totalPage = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
    data: result,
  };
};

/* ---------------- GET SINGLE BLOG ---------------- */

const getBlogById = async (id: string) => {
  const result = await prisma.blog.findUnique({
    where: { id },
    include: {
      contents: true,
      category: true,
      author: true,
    },
  });

  return result;
};

/* ---------------- UPDATE BLOG ---------------- */
const getBlogBySlug = async (slug: string) => {
  return prisma.blog.findUnique({
    where: { slug },
    include: { contents: true, category: true, author: true },
  });
};

/* ---------------- UPDATE BLOG ---------------- */

const updateBlog = async (id: string, payload: Partial<BlogPayload>) => {
  const { title, contents, images, readTime, subTitle, categoryId } = payload;

  const updateData: any = {};

  if (title) {
    let slugBase = slugify(title, { lower: true, strict: true });
    let slug = slugBase;
    let counter = 1;
    while (await prisma.blog.findUnique({ where: { slug } })) {
      slug = `${slugBase}-${counter++}`;
    }
    updateData.title = title;
    updateData.slug = slug;
  }

  if (subTitle) updateData.subTitle = subTitle;
  if (readTime) updateData.readTime = readTime;
  if (images) updateData.images = images;
  if (categoryId) updateData.categoryId = categoryId;

  if (contents) {
    updateData.contents = {
      deleteMany: {}, // remove old contents
      create: contents,
    };
  }

  const result = await prisma.blog.update({
    where: { id },
    data: updateData,
    include: {
      contents: true,
      category: true,
      author: true,
    },
  });

  return result;
};

/* ---------------- DELETE BLOG ---------------- */

const deleteBlog = async (id: string) => {
  const result = await prisma.$transaction(async (tx) => {
    await tx.blogContent.deleteMany({
      where: { blogId: id },
    });

    const deletedBlog = await tx.blog.delete({
      where: { id },
    });

    return deletedBlog;
  });

  return result;
};

export const BlogService = {
  createBlog,
  getAllBlogs,
  getBlogById,
  getBlogBySlug,
  updateBlog,
  deleteBlog,
};
