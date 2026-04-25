import express from "express";
import { DivisionController } from "./division.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { DivisionValidation } from "./division.validation.js";
import auth from "../../middlewares/auth.js";
import { Role } from "@prisma/client";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Division
 *   description: Fighter divisions (Weight classes)
 */

/**
 * @swagger
 * /division:
 *   post:
 *     tags: [Division]
 *     summary: Create a new division (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DivisionBody'
 *     responses:
 *       201:
 *         description: Division created
 */
router.post(
  "/",
  auth(Role.ADMIN),
  validateRequest(DivisionValidation.createDivisionZodSchema),
  DivisionController.createDivision
);

/**
 * @swagger
 * /division:
 *   get:
 *     tags: [Division]
 *     summary: Get all divisions
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Divisions retrieved
 */
router.get("/", DivisionController.getAllDivisions);

/**
 * @swagger
 * /division/{id}:
 *   get:
 *     tags: [Division]
 *     summary: Get division by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Division retrieved
 */
router.get("/:id", DivisionController.getDivisionById);

/**
 * @swagger
 * /division/{id}:
 *   patch:
 *     tags: [Division]
 *     summary: Update division (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DivisionBody'
 *     responses:
 *       200:
 *         description: Division updated
 */
router.patch(
  "/:id",
  auth(Role.ADMIN),
  validateRequest(DivisionValidation.updateDivisionZodSchema),
  DivisionController.updateDivision
);

/**
 * @swagger
 * /division/{id}:
 *   delete:
 *     tags: [Division]
 *     summary: Delete division (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Division deleted
 */
router.delete("/:id", auth(Role.ADMIN), DivisionController.deleteDivision);

export const DivisionRoutes = router;
