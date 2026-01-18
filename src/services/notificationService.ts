/**
 * Enhanced Notification Service
 * Handles creation, sending, and management of notifications with multi-channel support
 */

import { Notification, NotificationPreference, User } from "../models";
import {
  NotificationPriority,
  NotificationChannel,
  NotificationStatus,
} from "../models/Notification";
import logger from "../utils/logger";
import { getNotificationType } from "./notificationTypes";
import {
  renderInAppTemplate,
  getDefaultTemplateContext,
  TemplateContext,
} from "./notificationTemplates";
import { emailQueue, pushQueue, smsQueue } from "../queues";
import { broadcastNotification } from "./realtimeService";
import { getNotificationPreferences } from "./notificationConfigService";

export interface CreateNotificationParams {
  userId: string;
  tenantId: string;
  type: string;
  title?: string;
  message?: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  channels?: NotificationChannel[];
  metadata?: Record<string, any>;
  groupKey?: string;
  expiresInDays?: number;
}

/**
 * Create a single notification
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<Notification> {
  try {
    // Get notification type config
    const typeConfig = getNotificationType(params.type);

    // Determine priority
    const priority = params.priority || typeConfig?.defaultPriority || "normal";

    // Determine channels
    let channels: NotificationChannel[] = params.channels || typeConfig?.defaultChannels || ["in_app"];
    
    // Check user preferences
    if (channels.includes("email") || channels.includes("push") || channels.includes("sms")) {
      const preferences = await NotificationPreference.findOne({
        where: { userId: params.userId },
      });

      if (preferences) {
        // Filter channels based on preferences
        channels = channels.filter((channel) => {
          if (channel === "email") {
            // Check email preference for this type
            return checkEmailPreference(params.type, preferences);
          }
          if (channel === "push") {
            // Check push preference (if implemented)
            return true; // Default to true for now
          }
          if (channel === "sms") {
            // Check SMS preference (if implemented)
            return true; // Default to true for now
          }
          return true;
        });
      }
    }

    // Render templates if title/message not provided
    let title = params.title;
    let message = params.message;

    if (!title || !message) {
      const user = await User.findByPk(params.userId);
      const templateContext: TemplateContext = {
        title: params.title || typeConfig?.description || "Notification",
        message: params.message || "",
        actionUrl: params.actionUrl,
        ...(params.metadata || {}),
      };

      const context = getDefaultTemplateContext(templateContext, {
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
      });

      if (typeConfig?.templateName) {
        const rendered = renderInAppTemplate(typeConfig.templateName, context);
        title = title || rendered.title;
        message = message || rendered.message;
      } else {
        title = title || context.title;
        message = message || context.message;
      }
    }

    // Set expiration (use settings service with env var fallback)
    const prefs = await getNotificationPreferences();
    const expiresInDays = params.expiresInDays || prefs.expiryDays;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create notification
    const notification = await Notification.create({
      userId: params.userId,
      tenantId: params.tenantId,
      type: params.type,
      title: title!,
      message: message!,
      entityType: params.entityType || null,
      entityId: params.entityId || null,
      actionUrl: params.actionUrl || null,
      priority,
      channels,
      status: "pending",
      metadata: params.metadata || null,
      groupKey: params.groupKey || null,
      expiresAt,
    });

    // Queue jobs for each channel
    await queueNotificationJobs(notification);

    // Broadcast real-time notification
    await broadcastNotification(notification);

    return notification;
  } catch (error: any) {
    logger.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create multiple notifications in batch
 */
export async function createBatchNotifications(
  params: CreateNotificationParams[]
): Promise<Notification[]> {
  try {
    const notifications = await Promise.all(
      params.map((p) => createNotification(p))
    );
    logger.info(`Created ${notifications.length} notifications in batch`);
    return notifications;
  } catch (error: any) {
    logger.error("Error creating batch notifications:", error);
    throw error;
  }
}

/**
 * Queue notification jobs for each channel
 */
async function queueNotificationJobs(notification: Notification): Promise<void> {
  try {
    const jobs = [];

    if (notification.channels.includes("email")) {
      jobs.push(
        emailQueue.add("send-email", {
          notificationId: notification.id,
        }, {
          priority: getJobPriority(notification.priority),
        })
      );
    }

    if (notification.channels.includes("push")) {
      jobs.push(
        pushQueue.add("send-push", {
          notificationId: notification.id,
        }, {
          priority: getJobPriority(notification.priority),
        })
      );
    }

    if (notification.channels.includes("sms")) {
      jobs.push(
        smsQueue.add("send-sms", {
          notificationId: notification.id,
        }, {
          priority: getJobPriority(notification.priority),
        })
      );
    }

    // Always mark in-app as sent immediately
    if (notification.channels.includes("in_app")) {
      // In-app notifications are delivered via real-time, so mark as sent
      await notification.update({ status: "sent" as NotificationStatus });
    }

    await Promise.all(jobs);
  } catch (error: any) {
    logger.error(`Error queueing notification jobs for ${notification.id}:`, error);
    throw error;
  }
}

/**
 * Get job priority from notification priority
 */
function getJobPriority(priority: NotificationPriority): number {
  switch (priority) {
    case "urgent":
      return 1;
    case "high":
      return 2;
    case "normal":
      return 3;
    case "low":
      return 4;
    default:
      return 3;
  }
}

/**
 * Check email preference for notification type
 */
function checkEmailPreference(
  type: string,
  preferences: NotificationPreference
): boolean {
  // Map notification types to preference fields
  const typeMap: Record<string, keyof NotificationPreference> = {
    payslip: "emailPayslip",
    payslip_ready: "emailPayslip",
    expense_status: "emailExpenseStatus",
    expense_approved: "emailExpenseStatus",
    expense_rejected: "emailExpenseStatus",
    approval_required: "emailApprovalRequired",
    expense_approval_required: "emailApprovalRequired",
  };

  const preferenceField = typeMap[type.toLowerCase()];
  if (preferenceField && preferences[preferenceField] !== undefined) {
    return preferences[preferenceField] as boolean;
  }

  // Default to true if no specific preference
  return true;
}

/**
 * Send notification (backward compatibility)
 */
export async function sendNotification(
  params: CreateNotificationParams,
  sendEmail: boolean = true
): Promise<Notification> {
  const channels: NotificationChannel[] = ["in_app"];
  if (sendEmail) {
    channels.push("email");
  }

  return await createNotification({
    ...params,
    channels,
  });
}

/**
 * Send in-app notification (backward compatibility)
 */
export async function sendInAppNotification(
  params: CreateNotificationParams
): Promise<Notification> {
  return await createNotification({
    ...params,
    channels: ["in_app"],
  });
}

/**
 * Send email notification (backward compatibility)
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
  // Get user to find tenantId
  const user = await User.findByPk(userId);
  if (!user || !user.tenantId) {
    throw new Error(`User ${userId} not found or has no tenant`);
  }

  await createNotification({
    userId,
    tenantId: user.tenantId,
    type,
    title: data.title,
    message: data.message,
    actionUrl: data.actionUrl,
    channels: ["email"],
  });
}

/**
 * Retry failed notification
 */
export async function retryFailedNotification(
  notificationId: string
): Promise<Notification> {
  const prefs = await getNotificationPreferences();
  const maxRetries = prefs.maxRetries;
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new Error(`Notification ${notificationId} not found`);
  }

  if (notification.status !== "failed") {
    throw new Error(`Notification ${notificationId} is not in failed status`);
  }

  if (notification.retryCount >= maxRetries) {
    throw new Error(`Notification ${notificationId} has exceeded max retries`);
  }

  // Reset status and increment retry count
  await notification.update({
    status: "pending",
    failedAt: null,
    errorMessage: null,
    retryCount: notification.retryCount + 1,
  });

  // Re-queue jobs
  await queueNotificationJobs(notification);

  return notification;
}
