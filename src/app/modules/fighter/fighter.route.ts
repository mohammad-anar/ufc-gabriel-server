import express from "express";
import { FighterController } from "./fighter.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { FighterValidation } from "./fighter.validation.js";
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fighters
 *   description: UFC fighter catalog management
 */

/**
 * @swagger
 * /fighter:
 *   get:
 *     tags: [Fighters]
 *     summary: Get all fighters (paginated)
 *     security: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *         description: Search by name, nickname, or nationality
 *       - in: query
 *         name: divisionId
 *         schema: { type: string }
 *       - in: query
 *         name: isChampion
 *         schema: { type: boolean }
 *       - in: query
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: sortBy
 *         schema: { type: string, default: createdAt }
 *       - in: query
 *         name: sortOrder
 *         schema: { type: string, enum: [asc, desc], default: desc }
 *     responses:
 *       200:
 *         description: Paginated fighter list
 *   post:
 *     tags: [Fighters]
 *     summary: Create a fighter (Admin only)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FighterBody'
 *     responses:
 *       201:
 *         description: Fighter created
 */
router.get("/", FighterController.getAllFighters);

router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(FighterValidation.createFighterZodSchema),
  FighterController.createFighter
);

/**
 * @swagger
 * /fighter/{id}:
 *   get:
 *     tags: [Fighters]
 *     summary: Get fighter by ID with bout history
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fighter details
 *       404:
 *         description: Fighter not found
 *   patch:
 *     tags: [Fighters]
 *     summary: Update fighter details / stats (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FighterBody'
 *     responses:
 *       200:
 *         description: Fighter updated
 *   delete:
 *     tags: [Fighters]
 *     summary: Deactivate fighter (Admin only)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Fighter deactivated
 */
router.get("/:id", FighterController.getFighterById);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(FighterValidation.updateFighterZodSchema),
  FighterController.updateFighter
);

router.delete("/:id", auth(Role.ADMIN), FighterController.deleteFighter);

export const FighterRouter = router;
