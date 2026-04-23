import { Prisma } from "@prisma/client";

import bcrypt from "bcryptjs";
import { Secret, SignOptions } from "jsonwebtoken";
import config from "../../../config/index.js";
import ApiError from "../../../errors/ApiError.js";
import { emailHelper } from "../../../helpers/emailHelper.js";
import generateOTP from "../../../helpers/generateOTP.js";
import { jwtHelper } from "../../../helpers/jwtHelper.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { prisma } from "../../../helpers/prisma.js";
import redisClient from "../../../helpers/redis.js";
import {
  IPaginationOptions,
  IUserFilterRequest,
} from "../../../types/pagination.js";
import { emailTemplate } from "../../shared/emailTemplate.js";
import { ILogin, IVerifyEmail } from "../auth/user.interface.js";
import { InvoiceService } from "../invoice/invoice.service.js";
import { createAndEmitNotification } from "../../../helpers/socketHelper.js";

interface GetNearbyJobsParams {
  workshopId: string;
  search?: string;
  category?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// create workshop ================================
const createWorkshop = async (payload: Prisma.WorkshopCreateInput) => {
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_round,
  );

  const result = await prisma.$transaction(async (tx) => {
    // 1. Create workshop
    const workshop = await tx.workshop.create({
      data: {
        ...payload,
        password: hashedPassword,
      },
    });

    // 2. Generate OTP + store in Redis
    const otp = generateOTP();
    await redisClient.set(`otp:${workshop.email}`, otp, { EX: 300 });

    // 3. Send email
    const template = await emailTemplate.createAccount({
      name: workshop.workshopName,
      otp,
      email: workshop.email,
    });

    await emailHelper.sendEmail(template);

    // 4. Find admin
    const admin = await tx.user.findFirst({
      where: { role: "ADMIN" },
    });

    // 6. Emit notification (real-time)
    if (admin) {
      await createAndEmitNotification({
        receiverUserId: admin.id,
        triggeredById: workshop.id,
        title: "New Workshop Registration",
        body: `A new workshop has been registered: ${workshop.workshopName}`,
        eventType: "WORKSHOP_REGISTERED",
      });
    }

    return workshop;
  });

  return result;
};

// get all workshops ===============================================
const getAllWorkshops = async (
  params: IUserFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const { searchTerm, ...filterData } = params;

  const andConditions: Prisma.WorkshopWhereInput[] = [];

  if (searchTerm) {
    andConditions.push({
      OR: ["workshopName", "ownerName", "address", "description"].map(
        (field) => ({
          [field]: {
            contains: searchTerm,
            mode: "insensitive",
          },
        }),
      ),
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

  const whereConditions: Prisma.WorkshopWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.workshop.findMany({
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

    select: {
      id: true,
      workshopName: true,
      email: true,
      phone: true,
      address: true,
      description: true,
      avatar: true,
      role: true,
      isVerified: true,
      approvalStatus: true,
      avgRating: true,
      city: true,
      country: true,
      ownerName: true,
      latitude: true,
      longitude: true,
      cvrNumber: true,
      createdAt: true,
      updatedAt: true,
      state: true,
      _count: {
        select: {
          bookings: true,
          categories: true,
          jobs: true,
          rooms: true,
        },
      },
    },
  });

  const total = await prisma.workshop.count({
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

const getWorkshopById = async (id: string) => {
  const result = await prisma.workshop.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      workshopName: true,
      email: true,
      phone: true,
      address: true,
      description: true,
      avatar: true,
      role: true,
      isVerified: true,
      approvalStatus: true,
      avgRating: true,
      city: true,
      country: true,
      ownerName: true,
      latitude: true,
      longitude: true,
      cvrNumber: true,
      createdAt: true,
      updatedAt: true,
      state: true,
      bookings: true,
      categories: true,
      workshopOpeningHours: true,
      postalCode: true,
      invoices: true,
      jobs: true,
      reviewsCount: true,
      rooms: true,
      _count: true,
    },
  });

  return result;
};
const getMe = async (email: string) => {
  const result = await prisma.workshop.findUniqueOrThrow({
    where: { email },
    select: {
      id: true,
      workshopName: true,
      email: true,
      phone: true,
      address: true,
      description: true,
      avatar: true,
      role: true,
      isVerified: true,
      approvalStatus: true,
      avgRating: true,
      city: true,
      country: true,
      ownerName: true,
      latitude: true,
      longitude: true,
      cvrNumber: true,
      createdAt: true,
      updatedAt: true,
      state: true,
      categories: true,
      workshopOpeningHours: true,
      postalCode: true,
      _count: true,
    },
  });

  return result;
};

const updateWorkshop = async (
  id: string,
  payload: Prisma.WorkshopUpdateInput,
) => {
  const result = await prisma.workshop.update({
    where: { id },
    data: payload,
  });

  // If platformFees is updated, recalculate current month's invoice
  if (payload.platformFees !== undefined) {
    await InvoiceService.recalculateWorkshopInvoice(id);
  }

  return result;
};

const updatePlatformFees = async (id: string, platformFees: number) => {
  const result = await prisma.workshop.update({
    where: { id },
    data: {
      platformFees: platformFees,
    },
  });

  // Recalculate current month's invoice
  await InvoiceService.recalculateWorkshopInvoice(id);

  return result;
};

const deleteWorkshop = async (id: string) => {
  const result = await prisma.workshop.delete({
    where: { id },
  });

  return result;
};

const loginWorkshop = async (payload: ILogin) => {
  const isExist = await prisma.workshop.findUnique({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      workshopName: true,
      email: true,
      phone: true,
      password: true,
      isVerified: true,
      role: true,
      approvalStatus: true,
    },
  });

  if (!isExist?.email) {
    throw new ApiError(404, "User does not exist!");
  }
  if (!(isExist?.approvalStatus === "APPROVED")) {
    throw new ApiError(
      403,
      `Your approval status is ${isExist?.approvalStatus}. Please contact with Admin`,
    );
  }
  if (!isExist?.isVerified) {
    throw new ApiError(
      403,
      "User is not verified! Please verify your account.",
    );
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    isExist.password,
  );

  if (!isPasswordMatched) {
    throw new ApiError(400, "Invalid password");
  }

  const { password, ...workshopData } = isExist;

  const accessToken = jwtHelper.createToken(
    workshopData,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as SignOptions["expiresIn"],
  );

  const refreshToken = jwtHelper.createToken(
    workshopData,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_expire_in as SignOptions["expiresIn"],
  );

  return { accessToken, refreshToken, workshop: workshopData };
};

const verifyWorkshop = async ({ email, otp }: IVerifyEmail) => {
  const workshop = await prisma.workshop.findUnique({
    where: { email },
  });

  if (!workshop) throw new ApiError(404, "Workshop not found");

  const redisKey = `otp:${email}`;
  const storedOtp = await redisClient.get(redisKey);

  if (!storedOtp) throw new ApiError(400, "OTP expired");
  if (storedOtp !== String(otp)) throw new ApiError(400, "Invalid OTP");

  await prisma.workshop.update({
    where: { email },
    data: { isVerified: true },
  });

  await redisClient.del(redisKey);

  const { password, ...workshopData } = workshop;

  // const accessToken = jwtHelper.createToken(
  //   workshopData,
  //   config.jwt.jwt_secret as Secret,
  //   config.jwt.jwt_expire_in as SignOptions["expiresIn"],
  // );

  // const refreshToken = jwtHelper.createToken(
  //   workshopData,
  //   config.jwt.jwt_secret as Secret,
  //   config.jwt.jwt_refresh_expire_in as SignOptions["expiresIn"],
  // );

  return { workshop: workshopData };
};

const resendWorkshopOTP = async (email: string) => {
  const workshop = await prisma.workshop.findUnique({
    where: { email },
  });

  if (!workshop) throw new ApiError(404, "Workshop not found");
  if (workshop.isVerified) return { status: "already_verified" };

  const otp = generateOTP();

  await redisClient.set(`otp:${email}`, otp, { EX: 300 });

  const template = await emailTemplate.createAccount({
    name: workshop.workshopName,
    otp,
    email,
  });

  await emailHelper.sendEmail(template);

  return { status: "OTP resent successfully" };
};

const forgetWorkshopPassword = async (email: string) => {
  const workshop = await prisma.workshop.findUnique({
    where: { email },
  });

  if (!workshop) throw new ApiError(404, "Workshop not found");
  if (!workshop.isVerified) throw new ApiError(403, "Workshop not verified");

  const token = jwtHelper.createToken(
    { id: workshop.id, email: workshop.email, role: workshop.role },
    config.jwt.jwt_secret as Secret,
    "15m",
  );

  const template = await emailTemplate.forgetPasswordWorkshop({
    email,
    token,
  });

  await emailHelper.sendEmail(template);

  return { status: "Reset password email sent" };
};

const resetWorkshopPassword = async (email: string, password: string) => {
  const workshop = await prisma.workshop.findUnique({
    where: { email },
  });

  if (!workshop) throw new ApiError(404, "Workshop not found");

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_round),
  );

  await prisma.workshop.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return null;
};

const changeWorkshopPassword = async (
  email: string,
  newPassword: string,
  oldPassword: string,
) => {
  const workshop = await prisma.workshop.findUnique({
    where: { email },
  });

  if (!workshop) throw new ApiError(404, "Workshop not found");

  const isPasswordMatched = await bcrypt.compare(
    oldPassword,
    workshop.password,
  );

  if (!isPasswordMatched) throw new ApiError(400, "Old password incorrect");

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_round),
  );

  await prisma.workshop.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return null;
};

// add searching and filtering on getNearbyJobs service
// const getNearbyJobs = async (workshopId: string) => {
//   const workshop = await prisma.workshop.findUnique({
//     where: { id: workshopId },
//   });

//   if (!workshop?.latitude || !workshop?.longitude) {
//     throw new Error("Workshop location not set");
//   }

//   const nearByJobs = await prisma.$queryRaw`
//     SELECT *
//     FROM "Job"
//     WHERE status = 'OPEN'
//     AND ST_DWithin(
//       ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography,
//       ST_SetSRID(ST_MakePoint(${workshop.longitude}, ${workshop.latitude}), 4326)::geography,
//       "radius" * 1000
//     )
//     ORDER BY "createdAt" DESC
//   `;

//   // is this workshop already send exist on workshopIds then add a field that offerSend:true else false
//   const result = (nearByJobs as any[])?.map((job: any) => {
//     if (job.workshopIds.includes(workshopId)) {
//       return { ...job, offerSend: true };
//     }
//     return { ...job, offerSend: false };
//   });

//   return result;
// };

// include categories in the response

const getNearbyJobs = async ({
  workshopId,
  search,
  category,
  sortOrder = "desc",
  page = 1,
  limit = 10,
}: GetNearbyJobsParams) => {
  if (!workshopId) {
    throw new Error("workshopId is required");
  }

  const workshop = await prisma.workshop.findUnique({
    where: { id: workshopId },
  });

  if (!workshop?.latitude || !workshop?.longitude) {
    throw new Error("Workshop location not set");
  }

  const offset = (page - 1) * limit;

  // Search across title AND description
  const searchClause = search
    ? Prisma.sql`AND (j."title" ILIKE ${`%${search}%`} OR j."description" ILIKE ${`%${search}%`})`
    : Prisma.empty;

  // Filter by category name — uses INNER JOIN logic via EXISTS to avoid row duplication
  const categoryClause = category
    ? Prisma.sql`AND EXISTS (
        SELECT 1 FROM "JobCategory" jc2
        INNER JOIN "Category" c2 ON c2.id = jc2."categoryId"
        WHERE jc2."jobId" = j.id AND c2.name ILIKE ${`%${category}%`}
      )`
    : Prisma.empty;

  const orderClause =
    sortOrder === "asc"
      ? Prisma.sql`ORDER BY j."createdAt" ASC`
      : Prisma.sql`ORDER BY j."createdAt" DESC`;

  const [nearByJobs, countResult] = await Promise.all([
    prisma.$queryRaw`
      SELECT 
        j.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', jc.id,
              'categoryId', jc."categoryId",
              'name', c.name,
              'description', jc.description,
              'createdAt', jc."createdAt"
            )
          ) FILTER (WHERE jc.id IS NOT NULL),
          '[]'
        ) AS categories
      FROM "Job" j
      LEFT JOIN "JobCategory" jc ON jc."jobId" = j.id
      LEFT JOIN "Category" c ON c.id = jc."categoryId"
      WHERE j.status = 'OPEN'
      ${searchClause}
      ${categoryClause}
      AND ST_DWithin(
        ST_SetSRID(ST_MakePoint(j."longitude", j."latitude"), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${workshop.longitude}, ${workshop.latitude}), 4326)::geography,
        j."radius" * 1000
      )
      GROUP BY j.id
      ${orderClause}
      LIMIT ${limit} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)
      FROM (
        SELECT 1
        FROM "Job" j
        WHERE j.status = 'OPEN'
        ${searchClause}
        ${categoryClause}
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(j."longitude", j."latitude"), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${workshop.longitude}, ${workshop.latitude}), 4326)::geography,
          j."radius" * 1000
        )
      ) AS total_count
    `,
  ]);

  const total = Number(countResult[0].count);
  const totalPages = Math.ceil(total / limit);

  const data = (nearByJobs as any[]).map((job: any) => ({
    ...job,
    offerSend: job.workshopIds.includes(workshopId),
  }));

  return {
    meta: {
      total,
      totalPages,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data,
  };
};
const getReviewsByWorkshopId = async (workshopId: string) => {
  const result = await prisma.review.findMany({
    where: {
      booking: {
        workshopId: workshopId,
      },
    },
    select: {
      booking: {
        select: {
          review: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

const getBookingsByWorkshopId = async (workshopId: string) => {
  const result = await prisma.booking.findMany({
    where: {
      workshopId: workshopId,
    },
    include: {
      job: true,
      offer: true,
      review: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
          role: true,
        },
      },
      workshop: {
        select: {
          id: true,
          ownerName: true,
          email: true,
          phone: true,
          avatar: true,
          role: true,
          avgRating: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return result;
};

export const WorkshopService = {
  createWorkshop,
  getAllWorkshops,
  getWorkshopById,
  getMe,
  updateWorkshop,
  deleteWorkshop,
  loginWorkshop,
  verifyWorkshop,
  resendWorkshopOTP,
  forgetWorkshopPassword,
  resetWorkshopPassword,
  changeWorkshopPassword,
  getNearbyJobs,
  getReviewsByWorkshopId,
  getBookingsByWorkshopId,
  updatePlatformFees,
};
