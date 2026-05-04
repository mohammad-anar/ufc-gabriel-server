import express from "express";
import { SystemScoreController } from "./systemScore.controller.js";

const router = express.Router();

router.get("/", SystemScoreController.getSystemScoring);
router.post("/upsert", SystemScoreController.upsertSystemScoring);

export const SystemScoreRouter = router;
