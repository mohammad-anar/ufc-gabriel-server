import express from "express";
import { ServiceCategoryController } from "./serviceCategory.controller.js";
import { Role } from "../../../types/enum.js";

//role
import auth from "../../middlewares/auth.js";

const router = express.Router();

router.get("/", ServiceCategoryController.getAllCategories);

router.post("/", auth(Role.ADMIN), ServiceCategoryController.createCategory);

router.get("/:id", ServiceCategoryController.getCategoryById);

router.patch(
  "/:id",
  auth(Role.ADMIN),
  ServiceCategoryController.updateCategory,
);

router.delete(
  "/:id",
  auth(Role.ADMIN),
  ServiceCategoryController.deleteCategory,
);

export const ServiceCategoryRouter = router;
