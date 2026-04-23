import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Response } from "express";
import { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { ILogin, IVerifyEmail } from "./user.interface.js";
import config from "../../../config/index.js";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { emailTemplate } from "../../shared/emailTemplate.js";
import { emailHelper } from "../../../helpers/emailHelper.js";
import {
  IPaginationOptions,
  IUserFilterRequest,
} from "../../../types/pagination.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { jwtHelper } from "../../../helpers/jwtHelper.js";
import redisClient from "../../../helpers/redis.js";
import generateOTP from "../../../helpers/generateOTP.js";

// create users ================================
const createUser = async (payload: Prisma.UserCreateInput) => {
  const hashedPassword = await bcrypt.hash(
    payload.password,
    config.bcrypt_salt_round,
  );

  const isExist = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  console.log({ isExist });

  if (!!isExist) {
    throw new ApiError(409, "User already exist with this email!");
  }

  const result = await prisma.user.create({
    data: { ...payload, password: hashedPassword },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      address: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      isVerified: true,
    },
  });

  //send email
  const otp = generateOTP();

  const redisKey = `otp:${result.email}`;
  await redisClient.set(redisKey, otp, {
    EX: 300,
  });

  const values = {
    name: result.name,
    otp: otp,
    email: result.email!,
  };
  const createAccountTemplate = await emailTemplate.createAccount(values);
  await emailHelper.sendEmail(createAccountTemplate);

  return result;
};
// get all users ===============================================
const getAllUsers = async (
  filter: IUserFilterRequest,
  options: IPaginationOptions,
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filter;

  const andConditions: Prisma.UserWhereInput[] = [];
  if (filter.searchTerm) {
    andConditions.push({
      OR: ["name", "email", "phone"].map((field) => ({
        [field]: {
          contains: filter.searchTerm,
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

  // andConditions.push({
  //   isVerified: true,
  // });

  // Exclude ADMIN users
  andConditions.push({
    role: {
      not: "ADMIN",
    },
  });

  // andConditions.push({
  //   isDeleted: false,
  // });

  const whereConditions: Prisma.UserWhereInput = { AND: andConditions };

  const result = await prisma.user.findMany({
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
      name: true,
      email: true,
      phone: true,
      avatar: true,
      address: true,
      role: true,
      bikes: true,
      country: true,
      city: true,
      state: true,
      isDeleted: true,
      isVerified: true,
      status: true,
      postalCode: true,
      createdAt: true,
      updatedAt: true,
      _count: true,
    },
  });

  const total = await prisma.user.count({
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

// get user by id ================================================
const getUserById = async (id: string) => {
  const result = prisma.user.findUniqueOrThrow({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      address: true,
      role: true,
      bikes: true,
      country: true,
      city: true,
      state: true,
      isDeleted: true,
      isVerified: true,
      status: true,
      postalCode: true,
      blogs: true,
      bookings: {
        select: {
          id: true,
          createdAt: true,
          job: true,
          jobId: true,
          offer: true,
          workshop: true,
        },
      },
      jobs: true,
      reviews: true,
      createdAt: true,
      updatedAt: true,
      _count: true,
    },
  });
  return result;
};
// getMe ================================================
const getMe = async (email: string) => {
  console.log(email, "email");
  const result = prisma.user.findUniqueOrThrow({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatar: true,
      address: true,
      role: true,
      bikes: true,
      country: true,
      city: true,
      state: true,
      isDeleted: true,
      isVerified: true,
      status: true,
      postalCode: true,
      createdAt: true,
      updatedAt: true,
      _count: true,
    },
  });
  return result;
};

// update user =====================================================
const updateUser = async (email: string, payload: Prisma.UserUpdateInput) => {
  const isExist = await prisma.user.findUnique({ where: { email } });
  if (!isExist) {
    throw new ApiError(404, "User not found");
  }

  const result = await prisma.user.update({ where: { email }, data: payload });
  return result;
};

// delete user ========================================
const deleteUser = async (id: string) => {
  const result = await prisma.user.delete({ where: { id } });
  return result;
};

// login ===============================================
const login = async (payload: ILogin) => {
  const isExist = await prisma.user.findUnique({
    where: { email: payload.email, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      password: true,
      isVerified: true,
      isDeleted: true,
      status: true,
    },
  });

  if (!isExist?.email) {
    throw new ApiError(404, "User does not exist!");
  }
  if (!(isExist?.status === "ACTIVE")) {
    throw new ApiError(
      403,
      `User is ${isExist?.status}. Please contact with Admin`,
    );
  }
  if (!isExist?.isVerified) {
    throw new ApiError(
      403,
      "User is not verified! Please verify your account.",
    );
  }
  if (isExist?.isDeleted) {
    throw new ApiError(403, "User is deleted. Please contact with Admin.");
  }

  const { password, ...userData } = isExist;

  if (!isExist?.isVerified) {
    throw new ApiError(
      403,
      "You are not verifies. Please verify your account to login",
    );
  }

  // check bcrypt password
  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    isExist.password,
  );

  if (!isPasswordMatched) {
    throw new ApiError(400, "Invalid password");
  }

  const accessToken = jwtHelper.createToken(
    userData,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as SignOptions["expiresIn"],
  );
  const refreshToken = jwtHelper.createToken(
    userData,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_expire_in as SignOptions["expiresIn"],
  );

  return { accessToken, refreshToken, user: userData };
};

// verify==============================================
const verifyUser = async ({ email, otp }: IVerifyEmail) => {
  // 1. Get the user's email from the DB
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isVerified: true,
      role: true,
      address: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw new Error("User not found");

  const redisKey = `otp:${user.email}`;
  const storedOtp = await redisClient.get(redisKey);

  if (!storedOtp) throw new Error("OTP expired or not found");
  if (storedOtp !== String(otp)) throw new Error("Invalid OTP");

  // 2. Mark user as verified
  await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  // 3. Remove OTP from Redis
  await redisClient.del(redisKey);

  const accessToken = jwtHelper.createToken(
    user,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as SignOptions["expiresIn"],
  );
  const refreshToken = jwtHelper.createToken(
    user,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_expire_in as SignOptions["expiresIn"],
  );

  return { accessToken, refreshToken, user };
};

// resendOTP =========================================
const resendOTP = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, isVerified: true },
  });

  if (!user) throw new Error("User not found");
  if (user.isVerified) return { status: "already_verified" };

  // 2. Generate new OTP
  const otp = generateOTP();

  // 3. Store OTP
  const redisKey = `otp:${email}`;
  await redisClient.set(redisKey, otp, { EX: 300 });

  // 4. Prepare email template
  const values = {
    name: user.name,
    otp,
    email: email,
  };
  const otpTemplate = await emailTemplate.createAccount(values);

  // 5. Send OTP email
  await emailHelper.sendEmail(otpTemplate);

  return { status: "Otp resend successfully" };
};

const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      isVerified: true,
      isDeleted: true,
      role: true,
      phone: true,
      address: true,
      avatar: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.isVerified || user.isDeleted) {
    throw new ApiError(
      403,
      "You are not verifies. Please verify your account to reset password",
    );
  }

  const token = jwtHelper.createToken(
    user,
    config.jwt.jwt_secret as Secret,
    "15m",
  );
  const forgetPasswordTemplate = await emailTemplate.forgetPassword({
    email,
    token,
  });

  // 5. Send OTP email
  await emailHelper.sendEmail(forgetPasswordTemplate);

  return { status: "Reset password email sent" };
};

// reset password =================================================
const resetPassword = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new ApiError(404, "User not found");

  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_round),
  );

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return null;
};

// change password =================================================
const changePassword = async (
  email: string,
  newPassword: string,
  oldPassword: string,
) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new ApiError(404, "User not found");

  const isPasswordMatched = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordMatched) throw new ApiError(400, "Old password is incorrect");

  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_round),
  );

  await prisma.user.update({
    where: { email },
    data: { password: hashedPassword },
  });

  return null;
};

// refresh token
const refreshToken = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      status: true,
    },
  });
  const workshop = await prisma.workshop.findUnique({
    where: { email },
    select: {
      id: true,
      workshopName: true,
      email: true,
      phone: true,
      role: true,
      isVerified: true,
      approvalStatus: true,
    },
  });
  if (!user && !workshop) throw new ApiError(404, "User not found");
  if (user && !user.isVerified) {
    throw new ApiError(403, "User is not verified");
  }
  if (workshop && !workshop.isVerified) {
    throw new ApiError(403, "Workshop is not verified");
  }

  const payload = user || workshop;

  const accessToken = jwtHelper.createToken(
    payload as JwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as SignOptions["expiresIn"],
  );
  const refreshToken = jwtHelper.createToken(
    payload as JwtPayload,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_expire_in as SignOptions["expiresIn"],
  );

  return { accessToken, refreshToken, user };
};

// logout =============================================== remove access and refresh token from client side cookies
const logout = async (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  return null;
};

// get all jobs of a user =============================================== add filter and search like get all users
const getUserJobs = async (
  userId: string,
  options: IPaginationOptions,
  // write custom type for filter
  filter: { urgency?: string; status?: string; searchTerm?: string },
) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filter;

  const andConditions: Prisma.JobWhereInput[] = [];
  if (filter.searchTerm) {
    andConditions.push({
      OR: ["title", "description"].map((field) => ({
        [field]: {
          contains: filter.searchTerm,
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

  const whereConditions: Prisma.JobWhereInput = { AND: andConditions };

  const result = await prisma.job.findMany({
    where: {
      userId,
      ...whereConditions,
    },
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

  const total = await prisma.job.count({
    where: {
      userId,
      ...whereConditions,
    },
  });
  const totalPage = Math.ceil(total / limit);
  return { result, meta: { page, limit, total, totalPage } };
};

const getBookingsByUserId = async (userId: string) => {
  const result = await prisma.booking.findMany({
    where: {
      userId: userId,
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

export const UserService = {
  createUser,
  getAllUsers,
  getUserById,
  getMe,
  updateUser,
  deleteUser,
  login,
  verifyUser,
  resendOTP,
  forgetPassword,
  resetPassword,
  changePassword,
  refreshToken,
  logout,
  getUserJobs,
  getBookingsByUserId,
};
