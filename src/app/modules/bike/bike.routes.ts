import express from "express";
import { BikeController } from "./bike.controller.js";
//role
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

router.post("/", auth(Role.USER), BikeController.createBike);
router.get("/:id", auth(Role.USER), BikeController.getBikeById);
router.get("/user/me", auth(Role.USER), BikeController.getMyBikes);
router.get(
  "/user/:id",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  BikeController.getBikeByUserId,
);
router.patch("/:id", auth(Role.USER, Role.ADMIN), BikeController.updateBike);
router.delete("/:id", auth(Role.USER), BikeController.deleteBike);

export const BikeRouter = router;
