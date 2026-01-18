/**
 * Tax Remittance Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import {
  getRemittances,
  markRemittanceAsRemitted,
  getRemittanceReport,
} from "../controllers/taxRemittanceController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Get remittances - require reports:view:payroll permission
router.get("/", requirePermission("reports:view:payroll"), getRemittances);

// Mark remittance as remitted - require payroll:manage permission
router.post(
  "/:id/mark-remitted",
  requirePermission("payroll:manage"),
  markRemittanceAsRemitted
);

// Get remittance report - require reports:view:payroll permission
router.get(
  "/report",
  requirePermission("reports:view:payroll"),
  getRemittanceReport
);

export default router;
