import express from "express";
import { SystemController } from "./system.controller.js";
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System-wide settings — Saturday Lockdown control (Admin only)
 */

/**
 * @swagger
 * /system/lockdown:
 *   get:
 *     tags: [System]
 *     summary: Get current lockdown status (public)
 *     responses:
 *       200:
 *         description: Returns isLocked boolean and lastResultUpdate
 */
router.get("/lockdown", SystemController.getLockdownStatus);

/**
 * @swagger
 * /system/lockdown/enable:
 *   post:
 *     tags: [System]
 *     summary: Enable Saturday Lockdown — blocks all trade/roster mutations (Admin only)
 *     responses:
 *       200:
 *         description: Lockdown enabled, Socket.IO event broadcast to all clients
 */
router.post("/lockdown/enable", auth(Role.ADMIN), SystemController.enableLockdown);

/**
 * @swagger
 * /system/lockdown/disable:
 *   post:
 *     tags: [System]
 *     summary: Disable Saturday Lockdown — re-opens trades and roster changes (Admin only)
 *     responses:
 *       200:
 *         description: Lockdown disabled, Socket.IO event broadcast to all clients
 */
router.post("/lockdown/disable", auth(Role.ADMIN), SystemController.disableLockdown);

export const SystemRouter = router;
