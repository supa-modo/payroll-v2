/**
 * Notification Routes
 */

import { Router } from "express";
import * as notificationController from "../controllers/notificationController";
import * as notificationPreferenceController from "../controllers/notificationPreferenceController";
import { authenticateToken } from "../middleware/auth";
import { query, body } from "express-validator";
import { handleValidationErrors } from "../middleware/validator";

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get(
  "/",
  [
    query("unreadOnly")
      .optional()
      .custom((value) => {
        if (value === "true" || value === "false" || value === true || value === false) {
          return true;
        }
        throw new Error("unreadOnly must be a boolean");
      }),
    query("type").optional().isString().withMessage("Type must be a string"),
    query("limit")
      .optional()
      .custom((value) => {
        if (value === undefined || value === null || value === "") {
          return true; // Optional, so empty is fine
        }
        const num = parseInt(value as string, 10);
        if (isNaN(num) || num < 1 || num > 100) {
          throw new Error("Limit must be between 1 and 100");
        }
        return true;
      }),
    handleValidationErrors,
  ],
  notificationController.getNotifications
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put("/:id/read", notificationController.markNotificationRead);

/**
 * @route   PUT /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.put("/read-all", notificationController.markAllRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete("/:id", notificationController.deleteNotification);

/**
 * @route   GET /api/notifications/analytics
 * @desc    Get notification analytics
 * @access  Private
 */
router.get("/analytics", notificationController.getAnalytics);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private
 */
router.get("/stats", notificationController.getStats);

/**
 * @route   POST /api/notifications/batch
 * @desc    Create batch notifications
 * @access  Private
 */
router.post("/batch", notificationController.createBatch);

/**
 * @route   PUT /api/notifications/:id/retry
 * @desc    Retry failed notification
 * @access  Private
 */
router.put("/:id/retry", notificationController.retryNotification);

/**
 * @route   GET /api/notification-preferences
 * @desc    Get user notification preferences
 * @access  Private
 */
router.get(
  "/preferences",
  notificationPreferenceController.getPreferences
);

/**
 * @route   PUT /api/notification-preferences
 * @desc    Update user notification preferences
 * @access  Private
 */
router.put(
  "/preferences",
  [
    body("emailPayslip").optional().isBoolean().withMessage("emailPayslip must be a boolean"),
    body("emailExpenseStatus").optional().isBoolean().withMessage("emailExpenseStatus must be a boolean"),
    body("emailApprovalRequired").optional().isBoolean().withMessage("emailApprovalRequired must be a boolean"),
    body("inappPayslip").optional().isBoolean().withMessage("inappPayslip must be a boolean"),
    body("inappExpenseStatus").optional().isBoolean().withMessage("inappExpenseStatus must be a boolean"),
    body("inappApprovalRequired").optional().isBoolean().withMessage("inappApprovalRequired must be a boolean"),
    handleValidationErrors,
  ],
  notificationPreferenceController.updatePreferences
);

export default router;

