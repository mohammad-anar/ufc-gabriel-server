import express from "express";
import validateRequest from "../../middlewares/validateRequest.js";
import { Role } from "../../../types/enum.js";

//role
import { JobController } from "./job.controller.js";
import { CreateJobSchema, UpdateJobSchema } from "./job.validation.js";
import auth from "../../middlewares/auth.js";
import fileUploadHandler from "../../middlewares/fileUploadHandler.js";

const router = express.Router();

router.get("/", auth(Role.ADMIN), JobController.getAllJobs);
router.post(
  "/",
  fileUploadHandler(),
  auth(Role.USER),
  validateRequest(CreateJobSchema),
  JobController.createJob,
);
router.get(
  "/:id",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  JobController.getJobById,
);
router.get(
  "/user/:id",
  auth(Role.ADMIN, Role.USER),
  JobController.getJobsByUserId,
);
router.get(
  "/:jobId/offers",
  auth(Role.ADMIN, Role.USER, Role.WORKSHOP),
  JobController.getOffersByJobId,
);
router.patch(
  "/:id",
  auth(Role.ADMIN, Role.USER),
  fileUploadHandler(),
  validateRequest(UpdateJobSchema),
  JobController.updateJobById,
);
router.delete("/:id", auth(Role.ADMIN, Role.USER), JobController.deleteJobById);

export const JobRouter = router;
