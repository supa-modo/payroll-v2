/**
 * Loan Repayment Routes
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { handleValidationErrors } from "../middleware/validator";
import {
  getLoanRepayments,
  createLoanRepayment,
  getRepaymentsByPayroll,
} from "../controllers/loanRepaymentController";

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

// GET /loans/:loanId/repayments - Get repayment history
router.get("/", getLoanRepayments);

// POST /loans/:loanId/repayments - Record manual repayment
router.post(
  "/",
  [
    body("amount")
      .isFloat({ min: 0 })
      .withMessage("Amount must be a positive number"),
    body("repaymentDate")
      .optional()
      .isISO8601()
      .withMessage("Repayment date must be a valid date"),
    body("notes")
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage("Notes must be less than 1000 characters"),
  ],
  handleValidationErrors,
  createLoanRepayment
);

// GET /payrolls/:payrollId/loan-repayments - Get repayments for a payroll
router.get("/payrolls/:payrollId/loan-repayments", getRepaymentsByPayroll);

export default router;

