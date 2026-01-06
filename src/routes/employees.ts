/**
 * Employee Routes
 */

import { Router } from "express";
import * as employeeController from "../controllers/employeeController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission, requireAnyPermission } from "../middleware/rbac";
import { body, handleValidationErrors } from "../middleware/validator";
import { uploadPhoto } from "../middleware/upload";

const router = Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route   GET /api/employees
 * @desc    Get all employees
 * @access  Private
 */
router.get(
  "/",
  requireAnyPermission("employee:read", "employee:read:self"),
  employeeController.getEmployees
);

/**
 * @route   GET /api/employees/:id
 * @desc    Get single employee
 * @access  Private
 */
router.get("/:id", employeeController.getEmployee);

/**
 * @route   POST /api/employees
 * @desc    Create employee
 * @access  Private
 */
router.post(
  "/",
  [
    requirePermission("employee:create"),
    body("employeeNumber")
      .optional()
      .notEmpty()
      .withMessage("Employee number cannot be empty if provided"),
    body("firstName").notEmpty().withMessage("First name is required"),
    body("lastName").notEmpty().withMessage("Last name is required"),
    body("jobTitle").notEmpty().withMessage("Job title is required"),
    body("hireDate")
      .notEmpty()
      .withMessage("Hire date is required")
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Invalid hire date format (expected YYYY-MM-DD)"),
    body("employmentType")
      .optional()
      .isIn(["permanent", "contract", "casual", "intern"])
      .withMessage("Invalid employment type"),
    body("departmentId")
      .optional()
      .custom((value) => {
        if (value === "" || value === null || value === undefined) return true;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      })
      .withMessage("Invalid department ID"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("workEmail")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      })
      .withMessage("Invalid work email format"),
    body("personalEmail")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      })
      .withMessage("Invalid personal email format"),
    body("dateOfBirth")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      })
      .withMessage("Invalid date of birth format (expected YYYY-MM-DD)"),
    body("probationEndDate")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      })
      .withMessage("Invalid probation end date format (expected YYYY-MM-DD)"),
    body("contractEndDate")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      })
      .withMessage("Invalid contract end date format (expected YYYY-MM-DD)"),
    handleValidationErrors,
  ],
  employeeController.createEmployee
);

/**
 * @route   PUT /api/employees/:id
 * @desc    Update employee
 * @access  Private
 */
router.put(
  "/:id",
  [
    requirePermission("employee:update"),
    body("employeeNumber")
      .optional()
      .notEmpty()
      .withMessage("Employee number cannot be empty"),
    body("firstName").optional().notEmpty().withMessage("First name cannot be empty"),
    body("lastName").optional().notEmpty().withMessage("Last name cannot be empty"),
    body("jobTitle").optional().notEmpty().withMessage("Job title cannot be empty"),
    body("hireDate")
      .optional()
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage("Invalid hire date format (expected YYYY-MM-DD)"),
    body("employmentType")
      .optional()
      .isIn(["permanent", "contract", "casual", "intern"])
      .withMessage("Invalid employment type"),
    body("status")
      .optional()
      .isIn(["active", "probation", "suspended", "terminated", "resigned"])
      .withMessage("Invalid status"),
    body("departmentId")
      .optional()
      .custom((value) => {
        if (value === "" || value === null || value === undefined) return true;
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      })
      .withMessage("Invalid department ID"),
    body("email").optional().isEmail().withMessage("Invalid email format"),
    body("workEmail")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      })
      .withMessage("Invalid work email format"),
    body("personalEmail")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      })
      .withMessage("Invalid personal email format"),
    body("dateOfBirth")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      })
      .withMessage("Invalid date of birth format (expected YYYY-MM-DD)"),
    body("probationEndDate")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      })
      .withMessage("Invalid probation end date format (expected YYYY-MM-DD)"),
    body("contractEndDate")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      })
      .withMessage("Invalid contract end date format (expected YYYY-MM-DD)"),
    body("terminationDate")
      .optional()
      .custom((value) => {
        if (!value || value === "") return true;
        return /^\d{4}-\d{2}-\d{2}$/.test(value);
      })
      .withMessage("Invalid termination date format (expected YYYY-MM-DD)"),
    handleValidationErrors,
  ],
  employeeController.updateEmployee
);

/**
 * @route   POST /api/employees/:id/photo
 * @desc    Upload employee photo
 * @access  Private
 */
router.post(
  "/:id/photo",
  requirePermission("employee:update"),
  uploadPhoto("photo"),
  employeeController.uploadEmployeePhoto
);

/**
 * @route   DELETE /api/employees/:id
 * @desc    Delete employee
 * @access  Private
 */
router.delete(
  "/:id",
  requirePermission("employee:delete"),
  employeeController.deleteEmployee
);

export default router;

