import express from "express";
import { SystemScoreController } from "./systemScore.controller.js";
import auth from "app/middlewares/auth.js";
import { Role } from "@prisma/client";

const router = express.Router();

router.get("/", SystemScoreController.getSystemScoring);
router.post("/upsert", auth(Role.ADMIN), SystemScoreController.upsertSystemScoring);

export const SystemScoreRouter = router;
