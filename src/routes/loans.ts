/**
 * Loan Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { handleValidationErrors } from "../middleware/validator";
import {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  approveLoan,
  completeLoan,
  writeOffLoan,
} from "../controllers/employeeLoanController";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /loans - List all loans
router.get("/", getLoans);

// GET /loans/:id - Get single loan
router.get("/:id", getLoan);

// POST /loans - Create loan
router.post(
  "/",
  [
    body("employeeId").isUUID().withMessage("Employee ID is required"),
    body("loanType")
      .trim()
      .notEmpty()
      .withMessage("Loan type is required")
      .isLength({ max: 50 })
      .withMessage("Loan type must be less than 50 characters"),
    body("principalAmount")
      .isFloat({ min: 0 })
      .withMessage("Principal amount must be a positive number"),
    body("interestRate")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Interest rate must be between 0 and 100"),
    body("repaymentStartDate")
      .isISO8601()
      .withMessage("Repayment start date is required and must be a valid date"),
    body("monthlyDeduction")
      .isFloat({ min: 0 })
      .withMessage("Monthly deduction must be a positive number"),
    body("reason")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Reason must be less than 1000 characters"),
  ],
  handleValidationErrors,
  createLoan
);

// PUT /loans/:id - Update loan
router.put(
  "/:id",
  [
    body("loanType")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Loan type cannot be empty")
      .isLength({ max: 50 })
      .withMessage("Loan type must be less than 50 characters"),
    body("principalAmount")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Principal amount must be a positive number"),
    body("interestRate")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Interest rate must be between 0 and 100"),
    body("repaymentStartDate")
      .optional()
      .isISO8601()
      .withMessage("Repayment start date must be a valid date"),
    body("monthlyDeduction")
      .optional()
      .isFloat({ min: 0 })
      .withMessage("Monthly deduction must be a positive number"),
    body("reason")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Reason must be less than 1000 characters"),
  ],
  handleValidationErrors,
  updateLoan
);

// POST /loans/:id/approve - Approve loan
router.post("/:id/approve", requirePermission("loan:approve"), approveLoan);

// POST /loans/:id/complete - Mark loan as completed
router.post("/:id/complete", requirePermission("loan:manage"), completeLoan);

// POST /loans/:id/write-off - Write off loan
router.post(
  "/:id/write-off",
  [
    body("reason")
      .trim()
      .notEmpty()
      .withMessage("Write-off reason is required")
      .isLength({ max: 1000 })
      .withMessage("Reason must be less than 1000 characters"),
  ],
  handleValidationErrors,
  requirePermission("loan:manage"),
  writeOffLoan
);

export default router;

