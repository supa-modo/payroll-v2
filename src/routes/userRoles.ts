/**
 * UserRole Routes
 */

import { Router } from "express";
import * as userRoleController from "../controllers/userRoleController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { body, handleValidationErrors } from "../middleware/validator";

const router = Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route   GET /api/users/:userId/roles
 * @desc    Get all roles for a user
 * @access  Private
 */
router.get(
  "/:userId/roles",
  requirePermission("settings:manage"),
  userRoleController.getUserRoles
);

/**
 * @route   POST /api/users/:userId/roles
 * @desc    Assign role to user
 * @access  Private
 */
router.post(
  "/:userId/roles",
  [
    requirePermission("settings:manage"),
    body("roleId").notEmpty().withMessage("Role ID is required"),
    body("departmentId").optional(),
    handleValidationErrors,
  ],
  userRoleController.assignRole
);

/**
 * @route   DELETE /api/users/:userId/roles/:roleId
 * @desc    Remove role from user
 * @access  Private
 */
router.delete(
  "/:userId/roles/:roleId",
  requirePermission("settings:manage"),
  userRoleController.removeRole
);

export default router;

