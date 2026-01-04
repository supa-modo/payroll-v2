/**
 * Salary Component Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { handleValidationErrors } from "../middleware/validator";
import {
  getSalaryComponents,
  getSalaryComponent,
  createSalaryComponent,
  updateSalaryComponent,
  deleteSalaryComponent,
} from "../controllers/salaryComponentController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);
router.use(requirePermission("salary:configure"));

// GET /salary-components - List all salary components
router.get("/", getSalaryComponents);

// GET /salary-components/:id - Get single salary component
router.get("/:id", getSalaryComponent);

// POST /salary-components - Create salary component
router.post(
  "/",
  [
    body("name")
      .trim()
      .notEmpty()
      .withMessage("Name is required")
      .isLength({ max: 100 })
      .withMessage("Name must be less than 100 characters"),
    body("code")
      .trim()
      .notEmpty()
      .withMessage("Code is required")
      .isLength({ max: 50 })
      .withMessage("Code must be less than 50 characters"),
    body("type")
      .isIn(["earning", "deduction"])
      .withMessage("Type must be either 'earning' or 'deduction'"),
    body("category")
      .trim()
      .notEmpty()
      .withMessage("Category is required")
      .isLength({ max: 50 })
      .withMessage("Category must be less than 50 characters"),
    body("calculationType")
      .optional()
      .isIn(["fixed", "percentage"])
      .withMessage("Calculation type must be either 'fixed' or 'percentage'"),
    body("defaultAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Default amount must be a positive number"),
    body("percentageValue")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Percentage value must be between 0 and 100"),
    body("isTaxable").optional().isBoolean().withMessage("isTaxable must be a boolean"),
    body("isStatutory").optional().isBoolean().withMessage("isStatutory must be a boolean"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    body("displayOrder").optional().isInt({ min: 0 }).withMessage("Display order must be a non-negative integer"),
  ],
  handleValidationErrors,
  createSalaryComponent
);

// PUT /salary-components/:id - Update salary component
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
    body("code")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Code cannot be empty")
      .isLength({ max: 50 })
      .withMessage("Code must be less than 50 characters"),
    body("type")
      .optional()
      .isIn(["earning", "deduction"])
      .withMessage("Type must be either 'earning' or 'deduction'"),
    body("category")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Category cannot be empty")
      .isLength({ max: 50 })
      .withMessage("Category must be less than 50 characters"),
    body("calculationType")
      .optional()
      .isIn(["fixed", "percentage"])
      .withMessage("Calculation type must be either 'fixed' or 'percentage'"),
    body("defaultAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Default amount must be a positive number"),
    body("percentageValue")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Percentage value must be between 0 and 100"),
    body("isTaxable").optional().isBoolean().withMessage("isTaxable must be a boolean"),
    body("isStatutory").optional().isBoolean().withMessage("isStatutory must be a boolean"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    body("displayOrder").optional().isInt({ min: 0 }).withMessage("Display order must be a non-negative integer"),
  ],
  handleValidationErrors,
  updateSalaryComponent
);

// DELETE /salary-components/:id - Delete salary component
router.delete("/:id", deleteSalaryComponent);

export default router;

