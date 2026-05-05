import express from "express";
import { EventController } from "./event.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { EventValidation } from "./event.validation.js";
import auth from "../../middlewares/auth.js";
import { Role } from "../../../types/enum.js";
import fileUploadHandler from "../../middlewares/fileUploadHandler.js";

const router = express.Router();

// Event Routes
router.get("/", EventController.getAllEvents);
router.post(
  "/",
  auth(Role.ADMIN),
  fileUploadHandler(),
  (req, res, next) => {
    if (req.body.data) req.body = JSON.parse(req.body.data);
    next();
  },
  validateRequest(EventValidation.createEventZodSchema),
  EventController.createEvent
);

router.get("/:id", EventController.getEventById);
router.patch(
  "/:id",
  auth(Role.ADMIN),
  fileUploadHandler(),
  (req, res, next) => {
    if (req.body.data) req.body = JSON.parse(req.body.data);
    next();
  },
  validateRequest(EventValidation.updateEventZodSchema),
  EventController.updateEvent
);
router.delete("/:id", auth(Role.ADMIN), EventController.deleteEvent);
router.patch("/:id/post-results", auth(Role.ADMIN), EventController.postResults);

// Merged Bout Routes
router.post(
  "/bout",
  auth(Role.ADMIN),
  validateRequest(EventValidation.createBoutZodSchema),
  EventController.createBout
);

router.get("/bout/:id", EventController.getBoutById);

router.patch(
  "/bout/:id/result",
  auth(Role.ADMIN),
  validateRequest(EventValidation.postBoutResultZodSchema),
  EventController.postBoutResult
);

router.delete("/bout/:id", auth(Role.ADMIN), EventController.deleteBout);

export const EventRouter = router;
