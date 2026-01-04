/**
 * System Admin Routes
 * Routes for system-wide administration
 */

import { Router } from "express";
import { body } from "express-validator";
import { authenticateToken } from "../middleware/auth";
import { isSystemAdmin } from "../middleware/systemAdmin";
import { handleValidationErrors } from "../middleware/validator";
import {
  getAllTenants,
  getTenant,
  createTenant,
  updateTenant,
  deleteTenant,
  resetTenantAdminPassword,
  getTenantStats,
  getSystemStats,
} from "../controllers/systemAdminController";

const router = Router();

// All routes require authentication and system admin access
router.use(authenticateToken);
router.use(isSystemAdmin);

// GET /system-admin/stats - Get system-wide statistics
router.get("/stats", getSystemStats);

// GET /system-admin/tenants - List all tenants
router.get("/tenants", getAllTenants);

// GET /system-admin/tenants/:id - Get single tenant
router.get("/tenants/:id", getTenant);

// POST /system-admin/tenants - Create new tenant
router.post(
  "/tenants",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("slug")
      .trim()
      .notEmpty()
      .withMessage("Slug is required")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Slug must contain only lowercase letters, numbers, and hyphens"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone").optional().isString(),
    body("address").optional().isString(),
    body("logoUrl").optional().isURL().withMessage("Logo URL must be a valid URL"),
    body("isActive").optional().isBoolean(),
  ],
  handleValidationErrors,
  createTenant
);

// PUT /system-admin/tenants/:id - Update tenant
router.put(
  "/tenants/:id",
  [
    body("name").optional().trim().notEmpty(),
    body("email").optional().isEmail(),
    body("phone").optional().isString(),
    body("address").optional().isString(),
    body("logoUrl").optional().isURL(),
    body("isActive").optional().isBoolean(),
  ],
  handleValidationErrors,
  updateTenant
);

// DELETE /system-admin/tenants/:id - Delete tenant (soft delete)
router.delete("/tenants/:id", deleteTenant);

// POST /system-admin/reset-password - Reset tenant admin password
router.post(
  "/reset-password",
  [
    body("tenantId").notEmpty().withMessage("tenantId is required"),
    body("userId").notEmpty().withMessage("userId is required"),
    body("newPassword")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long"),
  ],
  handleValidationErrors,
  resetTenantAdminPassword
);

// GET /system-admin/tenants/:tenantId/stats - Get tenant statistics
router.get("/tenants/:tenantId/stats", getTenantStats);

export default router;

