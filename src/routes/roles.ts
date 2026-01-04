/**
 * Role Routes
 */

import { Router } from "express";
import * as roleController from "../controllers/roleController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { body, handleValidationErrors } from "../middleware/validator";

const router = Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route   GET /api/roles
 * @desc    Get all roles
 * @access  Private (requires settings:manage permission)
 */
router.get(
  "/",
  requirePermission("settings:manage"),
  roleController.getRoles
);

/**
 * @route   GET /api/roles/:id
 * @desc    Get single role
 * @access  Private
 */
router.get(
  "/:id",
  requirePermission("settings:manage"),
  roleController.getRole
);

/**
 * @route   POST /api/roles
 * @desc    Create role
 * @access  Private
 */
router.post(
  "/",
  [
    requirePermission("settings:manage"),
    body("name").notEmpty().withMessage("Role name is required"),
    body("displayName").notEmpty().withMessage("Display name is required"),
    handleValidationErrors,
  ],
  roleController.createRole
);

/**
 * @route   PUT /api/roles/:id
 * @desc    Update role
 * @access  Private
 */
router.put(
  "/:id",
  [
    requirePermission("settings:manage"),
    body("displayName").optional().notEmpty().withMessage("Display name cannot be empty"),
    handleValidationErrors,
  ],
  roleController.updateRole
);

/**
 * @route   DELETE /api/roles/:id
 * @desc    Delete role
 * @access  Private
 */
router.delete(
  "/:id",
  requirePermission("settings:manage"),
  roleController.deleteRole
);

/**
 * @route   POST /api/roles/:id/permissions
 * @desc    Assign permissions to role
 * @access  Private
 */
router.post(
  "/:id/permissions",
  [
    requirePermission("settings:manage"),
    body("permissionIds")
      .isArray()
      .withMessage("permissionIds must be an array")
      .notEmpty()
      .withMessage("At least one permission is required"),
    handleValidationErrors,
  ],
  roleController.assignPermissions
);

/**
 * @route   DELETE /api/roles/:id/permissions/:permissionId
 * @desc    Remove permission from role
 * @access  Private
 */
router.delete(
  "/:id/permissions/:permissionId",
  requirePermission("settings:manage"),
  roleController.removePermission
);

export default router;

