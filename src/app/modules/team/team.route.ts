import express from "express";
import { TeamController } from "./team.controller.js";
import auth from "../../middlewares/auth.js";
import lockdownGuard from "../../middlewares/lockdownGuard.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Teams
 *   description: Fantasy team management and leaderboards
 */

/**
 * @swagger
 * /team/my:
 *   get:
 *     tags: [Teams]
 *     summary: Get all teams owned by the authenticated user
 *     responses:
 *       200:
 *         description: List of user's teams across all leagues
 */
router.get("/my", auth(Role.USER, Role.ADMIN), TeamController.getMyTeams);

/**
 * @swagger
 * /team/leaderboard/{leagueId}:
 *   get:
 *     tags: [Teams]
 *     summary: Get ranked leaderboard for a league
 *     security: []
 *     parameters:
 *       - in: path
 *         name: leagueId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Teams sorted by total points with rank assigned
 *       404:
 *         description: League not found
 */
router.get("/leaderboard/:leagueId", TeamController.getLeaderboard);

/**
 * @swagger
 * /team/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team by ID with fighters and bout scores
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Team details (full scores for owner/admin, limited for others)
 *       404:
 *         description: Team not found
 *   patch:
 *     tags: [Teams]
 *     summary: Update team name or icon (owner only)
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
 *               iconGlyph: { type: string }
 *     responses:
 *       200:
 *         description: Team updated
 *       403:
 *         description: Not the team owner
 */
router.get("/:id", auth(Role.USER, Role.ADMIN), TeamController.getTeamById);
router.patch("/:id", auth(Role.USER, Role.ADMIN), TeamController.updateTeam);

/**
 * @swagger
 * /team/{id}/fighter/{fighterId}:
 *   delete:
 *     tags: [Teams]
 *     summary: Drop a fighter from the team (3NF integrity protected)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: path
 *         name: fighterId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fighter dropped successfully
 *       403:
 *         description: Not the team owner or system locked
 *       404:
 *         description: Team or Fighter not found
 */
router.delete("/:id/fighter/:fighterId", auth(Role.USER, Role.ADMIN), lockdownGuard, TeamController.dropFighter);

export const TeamRouter = router;
