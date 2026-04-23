import express from "express";
import { ContactController } from "./contact.controller.js";
import { ContactValidation } from "./contact.validation.js";
import validateRequest from "../../middlewares/validateRequest.js";

const router = express.Router();

router.post(
  "/",
  validateRequest(ContactValidation.createContactZodSchema),
  ContactController.sendContactEmail
);

router.post(
  "/workshop",
  validateRequest(ContactValidation.createWorkshopContactZodSchema),
  ContactController.sendWorkshopContactEmail
);

export const ContactRouter = router;
