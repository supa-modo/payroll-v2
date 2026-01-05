/**
 * Data Change History Routes
 */

import { Router } from "express";
import * as dataChangeHistoryController from "../controllers/dataChangeHistoryController";
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
 * @route   GET /api/data-change-history
 * @desc    Get change history for an entity
 * @access  Private (requires audit:view permission)
 */
router.get(
  "/",
  [
    query("entityType").notEmpty().withMessage("Entity type is required"),
    query("entityId").isUUID().withMessage("Valid entity ID is required"),
    query("fieldName").optional().isString().withMessage("Field name must be a string"),
    handleValidationErrors,
  ],
  dataChangeHistoryController.getEntityChangeHistory
);

export default router;

