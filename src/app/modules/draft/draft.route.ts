import express from "express";
import { DraftController } from "./draft.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { DraftValidation } from "./draft.validation.js";
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Draft
 *   description: Live fantasy draft — snake order, picks, and auto-pick
 */

/**
 * @swagger
 * /draft/{leagueId}:
 *   get:
 *     tags: [Draft]
 *     summary: Get draft session state including order, picks, and current turn
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Draft session with full order and pick history
 *       404:
 *         description: Draft session not found
 */
router.get("/:leagueId", auth(Role.USER, Role.ADMIN), DraftController.getDraftSession);

/**
 * @swagger
 * /draft/{leagueId}/fighters:
 *   get:
 *     tags: [Draft]
 *     summary: Get fighters not yet picked in this draft (paginated, filterable)
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *       - in: query
 *         name: division
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: rank }
 *     responses:
 *       200:
 *         description: Available fighters sorted by rank
 */
router.get(
  "/:leagueId/fighters",
  auth(Role.USER, Role.ADMIN),
  DraftController.getAvailableFighters
);

/**
 * @swagger
 * /draft/{leagueId}/start:
 *   post:
 *     tags: [Draft]
 *     summary: Start the draft — builds snake order and sets session to DRAFTING (manager or Admin)
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Draft started with full order generated
 *       400:
 *         description: Draft already started or completed
 *       403:
 *         description: Not the league manager
 */
router.post("/:leagueId/start", auth(Role.USER, Role.ADMIN), DraftController.startDraft);

/**
 * @swagger
 * /draft/{leagueId}/pick:
 *   post:
 *     tags: [Draft]
 *     summary: Pick a fighter (only the on-clock team's owner can pick)
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
 *             $ref: '#/components/schemas/PickFighterBody'
 *     responses:
 *       200:
 *         description: Fighter picked, session advanced to next turn
 *       403:
 *         description: Not your turn
 *       409:
 *         description: Fighter already picked
 */
router.post(
  "/:leagueId/pick",
  auth(Role.USER, Role.ADMIN),
  validateRequest(DraftValidation.pickFighterZodSchema),
  DraftController.pickFighter
);

/**
 * @swagger
 * /draft/{leagueId}/autopick:
 *   post:
 *     tags: [Draft]
 *     summary: Auto-pick the highest-ranked available fighter for a timed-out team (Admin only)
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
 *             required: [teamId]
 *             properties:
 *               teamId: { type: string }
 *     responses:
 *       200:
 *         description: Auto-pick completed
 */
router.post("/:leagueId/autopick", auth(Role.ADMIN), DraftController.autoPick);

router.get("/:leagueId/pre-draft", auth(Role.USER, Role.ADMIN), DraftController.getPreDraft);

router.post(
  "/:leagueId/pre-draft",
  auth(Role.USER, Role.ADMIN),
  validateRequest(DraftValidation.setQueueZodSchema),
  DraftController.updatePreDraft
);

router.patch(
  "/:leagueId/auto-pick",
  auth(Role.USER, Role.ADMIN),
  DraftController.toggleAutoPick
);


export const DraftRouter = router;

