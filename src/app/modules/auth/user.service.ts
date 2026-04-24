import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Secret, SignOptions } from "jsonwebtoken";
import { ILogin, IRegister, IVerifyEmail, IUserFilterRequest } from "./user.interface.js";
import config from "../../../config/index.js";
import { prisma } from "../../../helpers/prisma.js";
import ApiError from "../../../errors/ApiError.js";
import { emailTemplate } from "../../shared/emailTemplate.js";
import { emailHelper } from "../../../helpers/emailHelper.js";
import { paginationHelper } from "../../../helpers/paginationHelper.js";
import { jwtHelper } from "../../../helpers/jwtHelper.js";
import redisClient from "../../../helpers/redis.js";
import generateOTP from "../../../helpers/generateOTP.js";

type IPaginationOptions = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
};

// ─── Register ─────────────────────────────────────────────────────────────────
const createUser = async (payload: IRegister) => {
  const { password, ...rest } = payload;

  const [emailExists, usernameExists] = await Promise.all([
    prisma.user.findUnique({ where: { email: payload.email } }),
    prisma.user.findUnique({ where: { username: payload.username } }),
  ]);

  if (emailExists) throw new ApiError(409, "An account with this email already exists");
  if (usernameExists) throw new ApiError(409, "This username is already taken");

  const passwordHash = await bcrypt.hash(password, Number(config.bcrypt_salt_round));

  const result = await prisma.user.create({
    data: { ...rest, passwordHash },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isVerified: true,
      createdAt: true,
    },
  });

  // Send OTP email
  const otp = generateOTP();
  await redisClient.set(`otp:${result.email}`, otp, { EX: 300 });

  const values = { name: result.name, otp, email: result.email };
  const template = await emailTemplate.createAccount(values);
  await emailHelper.sendEmail(template);

  return result;
};

// ─── Get All Users (Admin) ────────────────────────────────────────────────────
const getAllUsers = async (filter: IUserFilterRequest, options: IPaginationOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filter;

  const andConditions: Prisma.UserWhereInput[] = [{ deletedAt: null }];

  if (searchTerm) {
    andConditions.push({
      OR: ["name", "email", "username"].map((field) => ({
        [field]: { contains: searchTerm, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: (filterData as any)[key] },
      })),
    });
  }

  const where: Prisma.UserWhereInput = { AND: andConditions };

  const [result, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { teams: true, leagueMemberships: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPage: Math.ceil(total / limit) },
    data: result,
  };
};

// ─── Get User By ID ───────────────────────────────────────────────────────────
const getUserById = async (id: string) => {
  const result = await prisma.user.findUnique({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      location: true,
      timezone: true,
      role: true,
      isVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { teams: true, leagueMemberships: true, notifications: true } },
    },
  });
  if (!result) throw new ApiError(404, "User not found");
  return result;
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
const getMe = async (id: string) => {
  return getUserById(id);
};

// ─── Update User ──────────────────────────────────────────────────────────────
const updateUser = async (id: string, payload: Prisma.UserUpdateInput) => {
  await getUserById(id);
  return prisma.user.update({
    where: { id },
    data: payload,
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      avatarUrl: true,
      bio: true,
      location: true,
      timezone: true,
      role: true,
      isVerified: true,
      updatedAt: true,
    },
  });
};

// ─── Soft Delete ──────────────────────────────────────────────────────────────
const deleteUser = async (id: string) => {
  await getUserById(id);
  return prisma.user.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

// ─── Login ───────────────────────────────────────────────────────────────────
const login = async (payload: ILogin) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      passwordHash: true,
      isVerified: true,
      deletedAt: true,
    },
  });

  if (!user) throw new ApiError(404, "No account found with this email");
  if (user.deletedAt) throw new ApiError(403, "This account has been deleted");
  if (!user.isVerified) throw new ApiError(403, "Please verify your email before logging in");

  const isMatch = await bcrypt.compare(payload.password, user.passwordHash);
  if (!isMatch) throw new ApiError(400, "Invalid password");

  // Update lastLoginAt
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const { passwordHash, deletedAt, ...userData } = user;

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

// ─── Verify Email ─────────────────────────────────────────────────────────────
const verifyUser = async ({ email, otp }: IVerifyEmail) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true, isVerified: true },
  });

  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) return { message: "Email already verified" };

  const storedOtp = await redisClient.get(`otp:${email}`);
  if (!storedOtp) throw new ApiError(400, "OTP expired or not found");
  if (storedOtp !== String(otp)) throw new ApiError(400, "Invalid OTP");

  await prisma.user.update({ where: { email }, data: { isVerified: true } });
  await redisClient.del(`otp:${email}`);

  const accessToken = jwtHelper.createToken(
    { id: user.id, email: user.email, name: user.name },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as SignOptions["expiresIn"],
  );
  const refreshToken = jwtHelper.createToken(
    { id: user.id, email: user.email, name: user.name },
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_expire_in as SignOptions["expiresIn"],
  );

  return { accessToken, refreshToken };
};

// ─── Resend OTP ───────────────────────────────────────────────────────────────
const resendOTP = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, isVerified: true },
  });
  if (!user) throw new ApiError(404, "User not found");
  if (user.isVerified) return { message: "Email already verified" };

  const otp = generateOTP();
  await redisClient.set(`otp:${email}`, otp, { EX: 300 });

  const template = await emailTemplate.createAccount({ name: user.name, otp, email });
  await emailHelper.sendEmail(template);

  return { message: "OTP resent successfully" };
};

// ─── Forget Password ──────────────────────────────────────────────────────────
const forgetPassword = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email, deletedAt: null },
    select: { id: true, name: true, email: true, isVerified: true, role: true },
  });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.isVerified) throw new ApiError(403, "Please verify your email first");

  const token = jwtHelper.createToken(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    "5m",
  );

  const template = await emailTemplate.forgetPassword({ email, token });
  await emailHelper.sendEmail(template);

  return { message: "Password reset link sent to your email" };
};

// ─── Reset Password ───────────────────────────────────────────────────────────
const resetPassword = async (userId: string, password: string) => {
  const passwordHash = await bcrypt.hash(password, Number(config.bcrypt_salt_round));
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return null;
};

// ─── Change Password ──────────────────────────────────────────────────────────
const changePassword = async (userId: string, oldPassword: string, newPassword: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) throw new ApiError(400, "Old password is incorrect");

  const passwordHash = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_round));
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  return null;
};

// ─── Refresh Token ────────────────────────────────────────────────────────────
const refreshToken = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { id: true, name: true, username: true, email: true, role: true, isVerified: true },
  });
  if (!user) throw new ApiError(404, "User not found");
  if (!user.isVerified) throw new ApiError(403, "User is not verified");

  const accessToken = jwtHelper.createToken(
    user,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_expire_in as SignOptions["expiresIn"],
  );
  const newRefreshToken = jwtHelper.createToken(
    user,
    config.jwt.jwt_secret as Secret,
    config.jwt.jwt_refresh_expire_in as SignOptions["expiresIn"],
  );

  return { accessToken, refreshToken: newRefreshToken, user };
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
};
