import express from "express";
import { FighterController } from "./fighter.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { FighterValidation } from "./fighter.validation.js";
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";
import fileUploadHandler from "../../middlewares/fileUploadHandler.js";

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
 *         name: isActive
 *         schema: { type: boolean }
 *       - in: query
 *         name: nationality
 *         schema: { type: string }
 *       - in: query
 *         name: minRank
 *         schema: { type: integer }
 *       - in: query
 *         name: maxRank
 *         schema: { type: integer }
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: string
 *                 description: JSON stringified payload matching FighterBody
 *                 example: '{"name": "Conor McGregor", "nationality": "Irish", "divisionId": "cm1y...", "nickname": "The Notorious", "rank": 1, "avgL5": 85, "bio": "Former double champ", "age": 35, "height": "5''9\"", "wins": 22, "losses": 6, "draws": 0}'
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image upload
 *     responses:
 *       201:
 *         description: Fighter created
 */
router.get("/", FighterController.getAllFighters);

router.post(
  "/",
  auth(Role.ADMIN),
  fileUploadHandler(),
  (req, res, next) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: string
 *                 description: JSON stringified payload matching UpdateFighterBody
 *                 example: '{"rank": 2, "wins": 23, "losses": 6}'
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image upload
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
  fileUploadHandler(),
  (req, res, next) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  validateRequest(FighterValidation.updateFighterZodSchema),
  FighterController.updateFighter
);

router.delete("/:id", auth(Role.ADMIN), FighterController.deleteFighter);

export const FighterRouter = router;
