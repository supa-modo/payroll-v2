/**
 * Permission Routes
 */

import { Router } from "express";
import * as permissionController from "../controllers/permissionController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";

const router = Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route   GET /api/permissions
 * @desc    Get all permissions
 * @access  Private (requires settings:manage permission)
 */
router.get(
  "/",
  requirePermission("settings:manage"),
  permissionController.getPermissions
);

/**
 * @route   GET /api/permissions/:id
 * @desc    Get single permission
 * @access  Private
 */
router.get(
  "/:id",
  requirePermission("settings:manage"),
  permissionController.getPermission
);

export default router;

