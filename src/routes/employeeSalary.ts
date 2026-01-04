/**
 * Employee Salary Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requirePermission, requireAnyPermission } from "../middleware/rbac";
import { handleValidationErrors } from "../middleware/validator";
import {
  getEmployeeSalary,
  assignSalaryComponents,
  getSalaryRevisionHistory,
  createSalaryRevision,
} from "../controllers/employeeSalaryController";

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

// GET /employees/:employeeId/salary - Get current salary structure
router.get(
  "/",
  requireAnyPermission("salary:view", "salary:assign", "employee:read"),
  getEmployeeSalary
);

// POST /employees/:employeeId/salary - Assign/update salary components
router.post(
  "/",
  [
    body("components")
      .isArray({ min: 1 })
      .withMessage("At least one salary component is required"),
    body("components.*.salaryComponentId")
      .isUUID()
      .withMessage("Invalid salary component ID"),
    body("components.*.amount")
      .isFloat({ min: 0 })
      .withMessage("Amount must be a positive number"),
    body("effectiveFrom")
      .optional()
      .isISO8601()
      .withMessage("Effective date must be a valid date"),
    body("effectiveTo")
      .optional()
      .isISO8601()
      .withMessage("Effective to date must be a valid date"),
    body("reason").optional().trim().isLength({ max: 500 }).withMessage("Reason must be less than 500 characters"),
  ],
  handleValidationErrors,
  requirePermission("salary:assign"),
  assignSalaryComponents
);

// GET /employees/:employeeId/salary/history - Get salary revision history
router.get(
  "/history",
  requireAnyPermission("salary:view", "salary:assign", "employee:read"),
  getSalaryRevisionHistory
);

// POST /employees/:employeeId/salary/revision - Create salary revision
router.post(
  "/revision",
  [
    body("effectiveFrom")
      .isISO8601()
      .withMessage("Effective date is required and must be a valid date"),
    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Reason is required")
      .isLength({ max: 500 })
      .withMessage("Reason must be less than 500 characters"),
    body("components")
      .optional()
      .isArray()
      .withMessage("Components must be an array"),
    body("components.*.salaryComponentId")
      .optional()
      .isUUID()
      .withMessage("Invalid salary component ID"),
    body("components.*.amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Amount must be a positive number"),
  ],
  handleValidationErrors,
  requirePermission("salary:assign"),
  createSalaryRevision
);

export default router;

