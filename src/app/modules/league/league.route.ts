import express from "express";
import { LeagueController } from "./league.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { LeagueValidation } from "./league.validation.js";
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Leagues
 *   description: Fantasy league creation, joining, and management
 */

/**
 * @swagger
 * /league:
 *   get:
 *     tags: [Leagues]
 *     summary: Get all public active leagues (paginated)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *       - in: query
 *         name: leagueType
 *         schema: { type: string, enum: [PUBLIC, PRIVATE] }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [DRAFTING, ACTIVE, COMPLETED, ARCHIVED] }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Paginated league list (passcodes masked)
 *   post:
 *     tags: [Leagues]
 *     summary: Create a new league
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeagueBody'
 *     responses:
 *       201:
 *         description: League created with scoring settings and draft session
 */
router.get("/", LeagueController.getAllLeagues);

router.get("/admin/all", auth(Role.ADMIN), LeagueController.getAdminLeagues);

router.get("/available", LeagueController.getAvailableLeagues);


/**
 * @swagger
 * /league/my/leagues:
 *   get:
 *     tags: [Leagues]
 *     summary: Get leagues the authenticated user has joined
 *     responses:
 *       200:
 *         description: User's leagues with their team in each
 */
router.get("/my/leagues", auth(Role.USER, Role.ADMIN), LeagueController.getMyLeagues);

router.post(
  "/",
  auth(Role.USER, Role.ADMIN),
  validateRequest(LeagueValidation.createLeagueZodSchema),
  LeagueController.createLeague
);

/**
 * @swagger
 * /league/join:
 *   post:
 *     tags: [Leagues]
 *     summary: Join a league by code (and passcode if private)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JoinLeagueBody'
 *     responses:
 *       200:
 *         description: Successfully joined, team auto-created
 *       403:
 *         description: Invalid passcode
 *       409:
 *         description: Already a member
 */
router.post(
  "/join",
  auth(Role.USER, Role.ADMIN),
  validateRequest(LeagueValidation.joinLeagueZodSchema),
  LeagueController.joinLeague
);

/**
 * @swagger
 * /league/join-quick:
 *   post:
 *     tags: [Leagues]
 *     summary: Auto-join a system-generated league (creates one if none available)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teamName: { type: string, example: "My Team" }
 *     responses:
 *       200:
 *         description: Joined a quick league
 */
router.post("/quick-join", auth(Role.USER, Role.ADMIN), LeagueController.joinQuickLeague);

/**
 * @swagger
 * /league/{id}:
 *   get:
 *     tags: [Leagues]
 *     summary: Get league by ID with teams sorted by total points
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: League details with leaderboard
 *       404:
 *         description: League not found
 *   patch:
 *     tags: [Leagues]
 *     summary: Update league settings (manager only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               draftTime: { type: string, format: date-time }
 *               secondsPerPick: { type: integer }
 *     responses:
 *       200:
 *         description: League updated
 *       403:
 *         description: Not the league manager
 *   delete:
 *     tags: [Leagues]
 *     summary: Soft-delete league (manager or Admin)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: League deleted
 */
router.get("/:id", LeagueController.getLeagueById);

router.patch(
  "/:id",
  auth(Role.USER, Role.ADMIN),
  validateRequest(LeagueValidation.updateLeagueZodSchema),
  LeagueController.updateLeague
);

router.delete("/:id", auth(Role.USER, Role.ADMIN), LeagueController.deleteLeague);

router.post("/:id/leave", auth(Role.USER, Role.ADMIN), LeagueController.leaveLeague);


router.get("/:id/available-fighters", auth(Role.USER, Role.ADMIN), LeagueController.getAvailableFighters);

router.post(
  "/:id/add-fighter",
  auth(Role.USER, Role.ADMIN),
  validateRequest(LeagueValidation.addFighterZodSchema),
  LeagueController.addFighter
);

router.post(
  "/:id/remove-fighter",
  auth(Role.USER, Role.ADMIN),
  validateRequest(LeagueValidation.removeFighterZodSchema),
  LeagueController.removeFighter
);

// --- Pre-draft & Auto Pick ---
router.get("/:id/pre-draft", auth(Role.USER, Role.ADMIN), LeagueController.getPreDraft);
router.post(
  "/:id/pre-draft",
  auth(Role.USER, Role.ADMIN),
  validateRequest(LeagueValidation.updatePreDraftZodSchema),
  LeagueController.updatePreDraft
);
router.patch(
  "/:id/auto-pick",
  auth(Role.USER, Role.ADMIN),
  validateRequest(LeagueValidation.toggleAutoPickZodSchema),
  LeagueController.toggleAutoPick
);

export const LeagueRouter = router;

