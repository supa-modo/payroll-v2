/**
 * Notification Preference Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { NotificationPreference } from "../models";
import logger from "../utils/logger";

/**
 * Get user notification preferences
 */
export async function getPreferences(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    let preferences = await NotificationPreference.findOne({
      where: { userId: req.user.id },
    });

    // Create default preferences if none exist
    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId: req.user.id,
        emailPayslip: true,
        emailExpenseStatus: true,
        emailApprovalRequired: true,
        inappPayslip: true,
        inappExpenseStatus: true,
        inappApprovalRequired: true,
      });
    }

    res.json({ preferences });
  } catch (error: any) {
    logger.error("Get preferences error:", error);
    res.status(500).json({ error: "Failed to get notification preferences" });
  }
}

/**
 * Update user notification preferences
 */
export async function updatePreferences(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const {
      emailPayslip,
      emailExpenseStatus,
      emailApprovalRequired,
      inappPayslip,
      inappExpenseStatus,
      inappApprovalRequired,
    } = req.body;

    let preferences = await NotificationPreference.findOne({
      where: { userId: req.user.id },
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId: req.user.id,
        emailPayslip: emailPayslip !== undefined ? emailPayslip : true,
        emailExpenseStatus:
          emailExpenseStatus !== undefined ? emailExpenseStatus : true,
        emailApprovalRequired:
          emailApprovalRequired !== undefined ? emailApprovalRequired : true,
        inappPayslip: inappPayslip !== undefined ? inappPayslip : true,
        inappExpenseStatus:
          inappExpenseStatus !== undefined ? inappExpenseStatus : true,
        inappApprovalRequired:
          inappApprovalRequired !== undefined
            ? inappApprovalRequired
            : true,
      });
    } else {
      await preferences.update({
        emailPayslip:
          emailPayslip !== undefined
            ? emailPayslip
            : preferences.emailPayslip,
        emailExpenseStatus:
          emailExpenseStatus !== undefined
            ? emailExpenseStatus
            : preferences.emailExpenseStatus,
        emailApprovalRequired:
          emailApprovalRequired !== undefined
            ? emailApprovalRequired
            : preferences.emailApprovalRequired,
        inappPayslip:
          inappPayslip !== undefined ? inappPayslip : preferences.inappPayslip,
        inappExpenseStatus:
          inappExpenseStatus !== undefined
            ? inappExpenseStatus
            : preferences.inappExpenseStatus,
        inappApprovalRequired:
          inappApprovalRequired !== undefined
            ? inappApprovalRequired
            : preferences.inappApprovalRequired,
      });
    }

    res.json({
      message: "Notification preferences updated",
      preferences,
    });
  } catch (error: any) {
    logger.error("Update preferences error:", error);
    res
      .status(500)
      .json({ error: "Failed to update notification preferences" });
  }
}

