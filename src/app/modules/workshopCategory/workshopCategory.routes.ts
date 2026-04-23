//role
import express from "express";
import auth from "../../middlewares/auth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { WorkshopCategoryController } from "./workshopCategory.controller.js";
import { WorkshopCategoryValidation } from "./workshopCategory.validation.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

router.get(
  "/",
  auth(Role.WORKSHOP),
  WorkshopCategoryController.getAllWorkshopCategories,
);

router.post(
  "/",
  auth(Role.WORKSHOP),
  validateRequest(WorkshopCategoryValidation.createWorkshopCategoryZodSchema),
  WorkshopCategoryController.createWorkshopCategory,
);

router.get(
  "/:id",
  auth(Role.WORKSHOP),
  WorkshopCategoryController.getWorkshopCategoryById,
);

router.patch(
  "/:id",
  auth(Role.WORKSHOP),
  validateRequest(WorkshopCategoryValidation.updateWorkshopCategoryZodSchema),
  WorkshopCategoryController.updateWorkshopCategory,
);

router.delete(
  "/:id",
  auth(Role.WORKSHOP),
  WorkshopCategoryController.deleteWorkshopCategory,
);

export const WorkshopCategoryRouter = router;
