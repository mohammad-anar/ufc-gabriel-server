import express from "express";
import { BlogCategoryController } from "./blogCategory.controller.js";
//role
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";

const router = express.Router();

router.get("/", BlogCategoryController.getAllCategories);

router.post("/", auth(Role.ADMIN), BlogCategoryController.createCategory);

router.get("/:id", BlogCategoryController.getCategoryById);

router.patch("/:id", auth(Role.ADMIN), BlogCategoryController.updateCategory);

router.delete("/:id", auth(Role.ADMIN), BlogCategoryController.deleteCategory);

export const BlogCategoryRouter = router;
