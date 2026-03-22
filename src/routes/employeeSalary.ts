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
  // Allow self-service employees to view their own history.
  requireAnyPermission("salary:view", "salary:assign", "employee:read", "employee:read:self"),
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
    body("modifiedComponents")
      .optional()
      .isArray()
      .withMessage("Modified components must be an array"),
    body("modifiedComponents.*.id")
      .optional()
      .isUUID()
      .withMessage("Invalid modified component ID"),
    body("modifiedComponents.*.amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Modified amount must be a positive number"),
    body("modifiedComponents.*.effectiveTo")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("Modified effectiveTo must be a valid date"),
    body("newComponents")
      .optional()
      .isArray()
      .withMessage("New components must be an array"),
    body("newComponents.*.salaryComponentId")
      .optional()
      .isUUID()
      .withMessage("Invalid salary component ID"),
    body("newComponents.*.amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Amount must be a positive number"),
    body("newComponents.*.effectiveTo")
      .optional({ nullable: true })
      .isISO8601()
      .withMessage("New component effectiveTo must be a valid date"),
    body("deletedComponentIds")
      .optional()
      .isArray()
      .withMessage("Deleted component IDs must be an array"),
    body("deletedComponentIds.*")
      .optional()
      .isUUID()
      .withMessage("Invalid deleted component ID"),
  ],
  handleValidationErrors,
  requirePermission("salary:assign"),
  createSalaryRevision
);

export default router;

