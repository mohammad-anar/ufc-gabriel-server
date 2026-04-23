import express from "express";
import { InvoiceController } from "./invoice.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { InvoiceValidation } from "./invoice.validation.js";
import { Role } from "../../../types/enum.js";
//role
import auth from "../../middlewares/auth.js";

const router = express.Router();

// POST /invoices/generate-monthly  →  generate invoices for all workshops for a given month
router.post(
  "/generate-monthly",
  auth(Role.ADMIN),
  validateRequest(InvoiceValidation.generateMonthlyZodSchema),
  InvoiceController.generateMonthlyInvoices,
);

// GET /invoices/monthly?month=YYYY-MM  →  list all invoices for the month
router.get("/monthly", auth(Role.ADMIN), InvoiceController.getMonthlyInvoices);

// GET /invoices/monthly/download?month=YYYY-MM  →  download all invoices as a single PDF
router.get(
  "/monthly/download",
  auth(Role.ADMIN),
  InvoiceController.downloadMonthlyInvoicesPDF,
);

// PATCH /invoices/:id/paid  →  admin marks an invoice as PAID
router.patch(
  "/:id/paid",
  auth(Role.ADMIN),
  InvoiceController.updateInvoiceStatus,
);

// GET /invoices/:id/download  →  download a single invoice by its ID
router.get(
  "/:id/download",
  auth(Role.ADMIN),
  InvoiceController.downloadInvoicePDFById,
);

// GET /invoices/workshop/:workshopId/download?month=YYYY-MM  →  download specific workshop invoice
router.get(
  "/workshop/:workshopId/download",
  auth(Role.ADMIN, Role.WORKSHOP),
  validateRequest(InvoiceValidation.downloadWorkshopInvoiceZodSchema),
  InvoiceController.downloadWorkshopInvoicePDF,
);

export const InvoiceRouter = router;
