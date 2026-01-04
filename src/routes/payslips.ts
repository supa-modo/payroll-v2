/**
 * Payslip Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireAnyPermission } from "../middleware/rbac";
import {
  getPayslip,
  generatePayslip,
  downloadPayslip,
} from "../controllers/payslipController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /payslips/:id - Get payslip
router.get(
  "/:id",
  requireAnyPermission("payslip:read", "payslip:view", "payroll:read"),
  getPayslip
);

// POST /payrolls/:payrollId/generate-payslip - Generate payslip PDF
router.post(
  "/payrolls/:payrollId/generate-payslip",
  requireAnyPermission("payslip:generate", "payroll:process"),
  generatePayslip
);

// GET /payslips/:id/download - Download payslip PDF
router.get(
  "/:id/download",
  requireAnyPermission("payslip:read", "payslip:view", "payroll:read"),
  downloadPayslip
);

export default router;

