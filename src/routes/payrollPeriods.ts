/**
 * Payroll Period Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { handleValidationErrors } from "../middleware/validator";
import {
  getPayrollPeriods,
  getPayrollPeriod,
  createPayrollPeriod,
  updatePayrollPeriod,
  processPayrollPeriod,
  approvePayrollPeriod,
  lockPayrollPeriod,
  getPayrollPeriodSummary,
  deletePayrollPeriod,
} from "../controllers/payrollPeriodController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /payroll-periods - List all payroll periods
router.get("/", requirePermission("payroll:read"), getPayrollPeriods);

// GET /payroll-periods/:id - Get single payroll period
router.get("/:id", requirePermission("payroll:read"), getPayrollPeriod);

// GET /payroll-periods/:id/summary - Get payroll period summary
router.get("/:id/summary", requirePermission("payroll:read"), getPayrollPeriodSummary);

// POST /payroll-periods - Create payroll period
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 100 })
      .withMessage("Name must be less than 100 characters"),
    body("periodType")
      .isIn(["monthly", "bi-weekly", "weekly", "custom"])
      .withMessage("Period type must be monthly, bi-weekly, weekly, or custom"),
    body("startDate")
      .isISO8601()
      .withMessage("Start date must be a valid date"),
    body("endDate")
      .isISO8601()
      .withMessage("End date must be a valid date"),
    body("payDate")
      .isISO8601()
      .withMessage("Pay date must be a valid date"),
  ],
  handleValidationErrors,
  requirePermission("payroll:create"),
  createPayrollPeriod
);

// PUT /payroll-periods/:id - Update payroll period
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .isLength({ max: 100 })
      .withMessage("Name must be less than 100 characters"),
    body("periodType")
      .optional()
      .isIn(["monthly", "bi-weekly", "weekly", "custom"])
      .withMessage("Period type must be monthly, bi-weekly, weekly, or custom"),
    body("startDate").optional().isISO8601().withMessage("Start date must be a valid date"),
    body("endDate").optional().isISO8601().withMessage("End date must be a valid date"),
    body("payDate").optional().isISO8601().withMessage("Pay date must be a valid date"),
  ],
  handleValidationErrors,
  requirePermission("payroll:update"),
  updatePayrollPeriod
);

// POST /payroll-periods/:id/process - Process payroll
router.post(
  "/:id/process",
  requirePermission("payroll:process"),
  processPayrollPeriod
);

// POST /payroll-periods/:id/approve - Approve payroll period
router.post(
  "/:id/approve",
  requirePermission("payroll:approve"),
  approvePayrollPeriod
);

// POST /payroll-periods/:id/lock - Lock payroll period
router.post(
  "/:id/lock",
  requirePermission("payroll:lock"),
  lockPayrollPeriod
);

// DELETE /payroll-periods/:id - Delete payroll period
router.delete(
  "/:id",
  requirePermission("payroll:delete"),
  deletePayrollPeriod
);

export default router;

