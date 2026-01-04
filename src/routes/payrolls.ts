/**
 * Payroll Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requirePermission, requireAnyPermission } from "../middleware/rbac";
import { handleValidationErrors } from "../middleware/validator";
import {
  getPayrolls,
  getPayroll,
  updatePayroll,
  approvePayroll,
  markPayrollAsPaid,
} from "../controllers/payrollController";

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

// GET /payroll-periods/:periodId/payrolls - Get all payrolls for period
router.get(
  "/",
  requireAnyPermission("payroll:read", "payroll:view"),
  getPayrolls
);

// GET /payrolls/:id - Get single payroll
router.get(
  "/:id",
  requireAnyPermission("payroll:read", "payroll:view"),
  getPayroll
);

// PUT /payrolls/:id - Update payroll
router.put(
  "/:id",
  [
    body("paymentMethod")
      .optional()
      .isIn(["bank", "mpesa", "cash", "cheque"])
      .withMessage("Payment method must be bank, mpesa, cash, or cheque"),
    body("bankAccount").optional().trim().isLength({ max: 50 }).withMessage("Bank account must be less than 50 characters"),
    body("mpesaPhone").optional().trim().isLength({ max: 20 }).withMessage("M-Pesa phone must be less than 20 characters"),
  ],
  handleValidationErrors,
  requirePermission("payroll:update"),
  updatePayroll
);

// POST /payrolls/:id/approve - Approve individual payroll
router.post(
  "/:id/approve",
  requirePermission("payroll:approve"),
  approvePayroll
);

// POST /payrolls/:id/mark-paid - Mark payroll as paid
router.post(
  "/:id/mark-paid",
  [
    body("paymentReference")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Payment reference must be less than 100 characters"),
  ],
  handleValidationErrors,
  requirePermission("payroll:mark-paid"),
  markPayrollAsPaid
);

export default router;

