/**
 * Expense Category Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { handleValidationErrors } from "../middleware/validator";
import {
  getExpenseCategories,
  getExpenseCategory,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "../controllers/expenseCategoryController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /expense-categories - List all expense categories
router.get("/", getExpenseCategories);

// GET /expense-categories/:id - Get single expense category
router.get("/:id", getExpenseCategory);

// POST /expense-categories - Create expense category
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
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("monthlyBudget")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Monthly budget must be a positive number"),
    body("maxAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Max amount must be a positive number"),
    body("autoApproveBelow")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Auto approve below must be a positive number"),
    body("requiresReceipt").optional().isBoolean().withMessage("requiresReceipt must be a boolean"),
    body("requiresManagerApproval")
      .optional()
      .isBoolean()
      .withMessage("requiresManagerApproval must be a boolean"),
    body("requiresFinanceApproval")
      .optional()
      .isBoolean()
      .withMessage("requiresFinanceApproval must be a boolean"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    body("displayOrder").optional().isInt({ min: 0 }).withMessage("Display order must be a non-negative integer"),
    body("glAccountCode")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("GL account code must be less than 50 characters"),
  ],
  handleValidationErrors,
  requirePermission("category:manage"),
  createExpenseCategory
);

// PUT /expense-categories/:id - Update expense category
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
    body("description")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Description must be less than 1000 characters"),
    body("monthlyBudget")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Monthly budget must be a positive number"),
    body("maxAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Max amount must be a positive number"),
    body("autoApproveBelow")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Auto approve below must be a positive number"),
    body("requiresReceipt").optional().isBoolean().withMessage("requiresReceipt must be a boolean"),
    body("requiresManagerApproval")
      .optional()
      .isBoolean()
      .withMessage("requiresManagerApproval must be a boolean"),
    body("requiresFinanceApproval")
      .optional()
      .isBoolean()
      .withMessage("requiresFinanceApproval must be a boolean"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
    body("displayOrder").optional().isInt({ min: 0 }).withMessage("Display order must be a non-negative integer"),
    body("glAccountCode")
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage("GL account code must be less than 50 characters"),
  ],
  handleValidationErrors,
  requirePermission("category:manage"),
  updateExpenseCategory
);

// DELETE /expense-categories/:id - Delete expense category
router.delete("/:id", requirePermission("expense:configure"), deleteExpenseCategory);

export default router;

