/**
 * Expense Document Routes
 */

import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import { requireAnyPermission } from "../middleware/rbac";
import { upload } from "../middleware/upload";
import {
  getExpenseDocuments,
  uploadExpenseDocument,
  downloadExpenseDocument,
  deleteExpenseDocument,
} from "../controllers/expenseDocumentController";

const router = Router({ mergeParams: true });

// All routes require authentication
router.use(authenticateToken);

// GET /expenses/:expenseId/documents - List documents
router.get(
  "/",
  requireAnyPermission("expense:view", "expense:view:self"),
  getExpenseDocuments
);

// POST /expenses/:expenseId/documents - Upload document
router.post(
  "/",
  upload.single("file"),
  requireAnyPermission("expense:submit", "expense:view"),
  uploadExpenseDocument
);

// GET /expenses/:expenseId/documents/:id - Download document
router.get(
  "/:id",
  requireAnyPermission("expense:view", "expense:view:self"),
  downloadExpenseDocument
);

// DELETE /expenses/:expenseId/documents/:id - Delete document
router.delete(
  "/:id",
  requireAnyPermission("expense:submit", "expense:view"),
  deleteExpenseDocument
);

export default router;

