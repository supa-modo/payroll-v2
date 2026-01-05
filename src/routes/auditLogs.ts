/**
 * Audit Log Routes
 */

import { Router } from "express";
import * as auditLogController from "../controllers/auditLogController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { query } from "express-validator";
import { handleValidationErrors } from "../middleware/validator";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// All routes require audit log viewing permission
router.use(requirePermission("audit:view"));

/**
 * @route   GET /api/audit-logs
 * @desc    Get all audit logs with filters
 * @access  Private (requires audit:view permission)
 */
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
    query("userId").optional().isUUID().withMessage("Invalid user ID"),
    query("action").optional().isIn(["CREATE", "UPDATE", "DELETE"]).withMessage("Invalid action"),
    query("entityType").optional().isString().withMessage("Invalid entity type"),
    query("startDate").optional().isISO8601().withMessage("Invalid start date"),
    query("endDate").optional().isISO8601().withMessage("Invalid end date"),
    handleValidationErrors,
  ],
  auditLogController.getAuditLogs
);

/**
 * @route   GET /api/audit-logs/:id
 * @desc    Get single audit log by ID
 * @access  Private (requires audit:view permission)
 */
router.get("/:id", auditLogController.getAuditLog);

export default router;

