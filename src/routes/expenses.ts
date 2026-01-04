/**
 * Expense Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requirePermission, requireAnyPermission } from "../middleware/rbac";
import { handleValidationErrors } from "../middleware/validator";
import {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  submitExpense,
  approveExpense,
  rejectExpense,
  markExpenseAsPaid,
} from "../controllers/expenseController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /expenses - List all expenses
router.get(
  "/",
  requireAnyPermission("expense:view", "expense:view:self"),
  getExpenses
);

// GET /expenses/:id - Get single expense
router.get(
  "/:id",
  requireAnyPermission("expense:view", "expense:view:self"),
  getExpense
);

// POST /expenses - Create expense
router.post(
  "/",
  [
    body("categoryId").isUUID().withMessage("Category ID is required"),
    body("title")
      .trim()
      .notEmpty()
      .withMessage("Title is required")
      .isLength({ max: 255 })
      .withMessage("Title must be less than 255 characters"),
    body("amount")
      .isFloat({ min: 0 })
      .withMessage("Amount must be a positive number"),
    body("expenseDate")
      .isISO8601()
      .withMessage("Expense date is required and must be a valid date"),
    body("currency").optional().isLength({ max: 3 }).withMessage("Currency must be 3 characters"),
    body("exchangeRate")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Exchange rate must be a positive number"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Description must be less than 2000 characters"),
  ],
  handleValidationErrors,
  createExpense
);

// PUT /expenses/:id - Update expense
router.put(
  "/:id",
  [
    body("title")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Title cannot be empty")
      .isLength({ max: 255 })
      .withMessage("Title must be less than 255 characters"),
    body("amount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Amount must be a positive number"),
    body("expenseDate")
      .optional()
      .isISO8601()
      .withMessage("Expense date must be a valid date"),
    body("currency").optional().isLength({ max: 3 }).withMessage("Currency must be 3 characters"),
    body("exchangeRate")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Exchange rate must be a positive number"),
    body("description")
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage("Description must be less than 2000 characters"),
  ],
  handleValidationErrors,
  updateExpense
);

// DELETE /expenses/:id - Delete expense
router.delete(
  "/:id",
  requireAnyPermission("expense:view", "expense:view:self"),
  deleteExpense
);

// POST /expenses/:id/submit - Submit expense for approval
router.post(
  "/:id/submit",
  requirePermission("expense:submit"),
  submitExpense
);

// POST /expenses/:id/approve - Approve expense
router.post(
  "/:id/approve",
  [
    body("comments")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Comments must be less than 1000 characters"),
    body("approvalLevel")
      .optional()
      .isIn(["manager", "finance"])
      .withMessage("Approval level must be manager or finance"),
  ],
  handleValidationErrors,
  requirePermission("expense:approve"),
  approveExpense
);

// POST /expenses/:id/reject - Reject expense
router.post(
  "/:id/reject",
  [
    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Rejection reason is required")
      .isLength({ max: 500 })
      .withMessage("Reason must be less than 500 characters"),
    body("comments")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Comments must be less than 1000 characters"),
  ],
  handleValidationErrors,
  requirePermission("expense:approve"),
  rejectExpense
);

// POST /expenses/:id/mark-paid - Mark expense as paid
router.post(
  "/:id/mark-paid",
  [
    body("paymentReference")
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage("Payment reference must be less than 100 characters"),
    body("paymentMethod")
      .optional()
      .isIn(["bank", "mpesa", "cash", "cheque"])
      .withMessage("Payment method must be bank, mpesa, cash, or cheque"),
  ],
  handleValidationErrors,
    requirePermission("expense:pay"),
  markExpenseAsPaid
);

export default router;

