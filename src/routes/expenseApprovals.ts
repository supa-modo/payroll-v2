/**
 * Expense Approval Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireAnyPermission } from "../middleware/rbac";
import { getExpenseApprovals } from "../controllers/expenseApprovalController";

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

// GET /expenses/:expenseId/approvals - Get approval history
router.get(
  "/",
  requireAnyPermission("expense:view", "expense:view:self"),
  getExpenseApprovals
);

export default router;

