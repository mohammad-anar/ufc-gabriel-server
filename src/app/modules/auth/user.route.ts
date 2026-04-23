//role
import express from "express";
import { UserController } from "./user.controller.js";
import { UserValidation } from "./user.validation.js";
import auth from "../../middlewares/auth.js";
import fileUploadHandler from "../../middlewares/fileUploadHandler.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

router.get("/users", UserController.getAllUsers);
router.get("/user/me", auth(Role.USER, Role.ADMIN), UserController.getMe);
// get jobs for user
router.get(
  "/user/me/jobs",
  auth(Role.USER, Role.ADMIN),
  UserController.getUserJobs,
);
router.post(
  "/register",
  fileUploadHandler(),
  validateRequest(UserValidation.createUserZodSchema),
  UserController.createUser,
);
router.post("/login", UserController.login);
router.post("/verify-user", UserController.verifyUser);
router.post("/resend-otp", UserController.resendOTP);
router.post("/forget-password", UserController.forgetPassword);
router.post(
  "/reset-password",
  auth(Role.USER, Role.ADMIN, Role.WORKSHOP),
  UserController.resetPassword,
);
router.post(
  "/change-password",
  auth(Role.USER, Role.ADMIN, Role.WORKSHOP),
  UserController.changePassword,
);
router.post(
  "/refresh",
  auth(Role.USER, Role.ADMIN, Role.WORKSHOP),
  UserController.refreshToken,
);
router.post(
  "/logout",
  auth(Role.USER, Role.ADMIN, Role.WORKSHOP),
  UserController.logout,
);
router.get("/user/:id", auth(Role.ADMIN), UserController.getUserById);
router.get(
  "/user/bookings/me",
  auth(Role.USER),
  UserController.getBookingsByUserId,
);

router.patch(
  "/user/:id",
  auth(Role.ADMIN, Role.USER),
  fileUploadHandler(),
  validateRequest(UserValidation.updateUserZodSchema),
  UserController.updateUser,
);
router.patch("/user/:id/ban", auth(Role.ADMIN), UserController.banUser);
router.patch("/user/:id/unban", auth(Role.ADMIN), UserController.unBanUser);
router.delete("/user:id", UserController.deleteUser);

export const UserRouter = router;
