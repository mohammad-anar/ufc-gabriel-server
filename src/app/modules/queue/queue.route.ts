import express from "express";
import { QueueController } from "./queue.controller.js";
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: DraftQueue
 *   description: User draft pick wishlist (auto-pick source when timer expires)
 */

/**
 * @swagger
 * /queue/{leagueId}:
 *   get:
 *     tags: [DraftQueue]
 *     summary: Get the authenticated user's pick queue for a league
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Ordered list of fighters the user wants to pick (ascending priority)
 *   put:
 *     tags: [DraftQueue]
 *     summary: Replace entire queue (for drag-and-drop reordering)
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [entries]
 *             properties:
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [fighterId, priority]
 *                   properties:
 *                     fighterId: { type: string }
 *                     priority: { type: integer }
 *     responses:
 *       200:
 *         description: Queue replaced with new order
 */
router.get("/:leagueId", auth(Role.USER, Role.ADMIN), QueueController.getQueue);
router.put("/:leagueId", auth(Role.USER, Role.ADMIN), QueueController.replaceQueue);

/**
 * @swagger
 * /queue/{leagueId}/entry:
 *   post:
 *     tags: [DraftQueue]
 *     summary: Add or update a single fighter in the queue
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fighterId, priority]
 *             properties:
 *               fighterId: { type: string }
 *               priority: { type: integer, minimum: 1 }
 *     responses:
 *       200:
 *         description: Queue entry saved
 */
router.post("/:leagueId/entry", auth(Role.USER, Role.ADMIN), QueueController.upsertQueueEntry);

/**
 * @swagger
 * /queue/{leagueId}/entry/{fighterId}:
 *   delete:
 *     tags: [DraftQueue]
 *     summary: Remove a fighter from the pick queue
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: fighterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fighter removed from queue
 */
router.delete(
  "/:leagueId/entry/:fighterId",
  auth(Role.USER, Role.ADMIN),
  QueueController.removeQueueEntry
);

export const QueueRouter = router;
