/**
 * Employee Bank Details Routes
 */

import { Router } from "express";
import * as bankDetailsController from "../controllers/employeeBankDetailsController";
import { authenticateToken } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { body, handleValidationErrors } from "../middleware/validator";

const router = Router();

// Protect all routes
router.use(authenticateToken);

/**
 * @route   GET /api/employees/:employeeId/bank-details
 * @desc    Get all bank details for employee
 * @access  Private
 */
router.get(
  "/:employeeId/bank-details",
  requirePermission("employee:read"),
  bankDetailsController.getBankDetails
);

/**
 * @route   POST /api/employees/:employeeId/bank-details
 * @desc    Create bank details
 * @access  Private
 */
router.post(
  "/:employeeId/bank-details",
  [
    requirePermission("employee:update"),
    body("paymentMethod")
      .isIn(["bank", "mpesa", "cash"])
      .withMessage("Invalid payment method"),
    body("isPrimary").optional().isBoolean(),
    handleValidationErrors,
  ],
  bankDetailsController.createBankDetails
);

/**
 * @route   PUT /api/employees/:employeeId/bank-details/:id
 * @desc    Update bank details
 * @access  Private
 */
router.put(
  "/:employeeId/bank-details/:id",
  [
    requirePermission("employee:update"),
    body("paymentMethod")
      .optional()
      .isIn(["bank", "mpesa", "cash"])
      .withMessage("Invalid payment method"),
    body("isPrimary").optional().isBoolean(),
    handleValidationErrors,
  ],
  bankDetailsController.updateBankDetails
);

/**
 * @route   DELETE /api/employees/:employeeId/bank-details/:id
 * @desc    Delete bank details
 * @access  Private
 */
router.delete(
  "/:employeeId/bank-details/:id",
  requirePermission("employee:update"),
  bankDetailsController.deleteBankDetails
);

/**
 * @route   POST /api/employees/:employeeId/bank-details/:id/set-primary
 * @desc    Set primary bank details
 * @access  Private
 */
router.post(
  "/:employeeId/bank-details/:id/set-primary",
  requirePermission("employee:update"),
  bankDetailsController.setPrimaryBankDetails
);

export default router;

