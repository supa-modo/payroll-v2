/**
 * Authenticated user (self-service) routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireAnyPermission } from "../middleware/rbac";
import { getMyPayrolls } from "../controllers/payrollController";
import { getMySalaryRevisionHistory } from "../controllers/employeeSalaryController";
import { generateMyPayslipPDF } from "../controllers/payslipController";

const router = Router();

router.use(authenticateToken);

// GET /api/me/payrolls — payrolls for the logged-in user’s employee record
router.get(
  "/payrolls",
  requireAnyPermission(
    "payslip:view:self",
    "payroll:view",
    "payroll:read"
  ),
  getMyPayrolls
);

// GET /api/me/salary/history — salary revisions for the logged-in user’s employee
router.get(
  "/salary/history",
  requireAnyPermission(
    "employee:read:self",
    "salary:view",
    "salary:assign",
    "employee:read"
  ),
  getMySalaryRevisionHistory
);

// POST /api/me/payrolls/:payrollId/generate-payslip — member portal self-service payslip PDF
router.post(
  "/payrolls/:payrollId/generate-payslip",
  requireAnyPermission("payslip:view:self", "payslip:generate", "payroll:process"),
  generateMyPayslipPDF
);

export default router;
