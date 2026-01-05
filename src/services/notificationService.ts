/**
 * Notification Service
 * Handles creation and sending of notifications
 */

import { Notification, NotificationPreference, User } from "../models";
import logger from "../utils/logger";

export interface CreateNotificationParams {
  userId: string;
  tenantId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
}

/**
 * Create a notification record
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<Notification> {
  try {
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const notification = await Notification.create({
      userId: params.userId,
      tenantId: params.tenantId,
      type: params.type,
      title: params.title,
      message: params.message,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      actionUrl: params.actionUrl || null,
      expiresAt,
    });

    return notification;
  } catch (error: any) {
    logger.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Send in-app notification
 * Creates notification record and returns it
 */
export async function sendInAppNotification(
  params: CreateNotificationParams
): Promise<Notification> {
  return await createNotification(params);
}

/**
 * Send email notification
 * Checks user preferences and sends email if enabled
 */
export async function sendEmailNotification(
  userId: string,
  type: string,
  data: {
    title: string;
    message: string;
    actionUrl?: string;
  }
): Promise<void> {
  try {
    // Get user notification preferences
    const preferences = await NotificationPreference.findOne({
      where: { userId },
    });

    // Check if email is enabled for this notification type
    let emailEnabled = true; // Default to true if no preferences set
    if (preferences) {
      switch (type) {
        case "payslip":
          emailEnabled = preferences.emailPayslip;
          break;
        case "expense_status":
          emailEnabled = preferences.emailExpenseStatus;
          break;
        case "approval_required":
          emailEnabled = preferences.emailApprovalRequired;
          break;
        default:
          emailEnabled = true;
      }
    }

    if (!emailEnabled) {
      logger.info(`Email notification disabled for user ${userId}, type ${type}`);
      return;
    }

    // Get user email
    const user = await User.findByPk(userId);
    if (!user || !user.email) {
      logger.warn(`User ${userId} not found or has no email`);
      return;
    }

    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    // For now, just log the email
    logger.info(`Email notification to ${user.email}:`, {
      subject: data.title,
      body: data.message,
      actionUrl: data.actionUrl,
    });

    // In production, send actual email:
    // await emailService.send({
    //   to: user.email,
    //   subject: data.title,
    //   template: type,
    //   data: { ...data, firstName: user.firstName }
    // });
  } catch (error: any) {
    logger.error("Error sending email notification:", error);
    // Don't throw - email failures shouldn't break the main flow
  }
}

/**
 * Send both in-app and email notifications
 */
export async function sendNotification(
  params: CreateNotificationParams,
  sendEmail: boolean = true
): Promise<Notification> {
  // Create in-app notification
  const notification = await sendInAppNotification(params);

  // Send email if requested
  if (sendEmail) {
    await sendEmailNotification(params.userId, params.type, {
      title: params.title,
      message: params.message,
      actionUrl: params.actionUrl,
    });
  }

  return notification;
}

