import { Prisma } from "@prisma/client";
import config from "../../../config/index.js";
import { emailHelper } from "../../../helpers/emailHelper.js";
import { prisma } from "../../../helpers/prisma.js";
import { INewsletterFilterRequest } from "./newsletter.interface.js";
import { IPaginationOptions } from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";

const subscribe = async (payload: Prisma.NewsletterCreateInput) => {
  const result = await prisma.newsletter.create({
    data: payload,
  });

  // send email to admin
  await emailHelper.sendEmail({
    to: config.email.from as string,
    subject: "New Newsletter Subscription",
    html: `
    <h1>New Newsletter Subscription</h1>
    <p>Email: ${payload.email}</p>
    `,
  });
  return result;
};

const getAllNewsletters = async (
  params: INewsletterFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.NewsletterWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: ["email"].map((field) => ({
        [field]: {
          contains: searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.NewsletterWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.newsletter.findMany({
    where: whereConditions,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? {
            [options.sortBy]: options.sortOrder,
          }
        : {
            createdAt: "desc",
          },
  });

  const total = await prisma.newsletter.count({
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

export const NewsletterService = {
  subscribe,
  getAllNewsletters,
};
