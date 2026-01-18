/**
 * Delivery Tracking Service
 * Tracks notification delivery status and handles retries
 */

import { Notification, Op } from "../models";
import { emailQueue, pushQueue, smsQueue } from "../queues";
import logger from "../utils/logger";
import { getNotificationPreferences } from "./notificationConfigService";

/**
 * Update delivery status
 */
export async function updateDeliveryStatus(
  notificationId: string,
  status: "sent" | "delivered" | "failed",
  errorMessage?: string
): Promise<void> {
  try {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    switch (status) {
      case "sent":
        await notification.markAsSent();
        break;
      case "delivered":
        await notification.markAsDelivered();
        break;
      case "failed":
        await notification.markAsFailed(errorMessage);
        break;
    }

    logger.debug(`Updated delivery status for notification ${notificationId}: ${status}`);
  } catch (error: any) {
    logger.error(`Error updating delivery status for ${notificationId}:`, error);
    throw error;
  }
}

/**
 * Retry failed notification
 */
export async function retryFailedNotification(
  notificationId: string
): Promise<boolean> {
  try {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    if (notification.status !== "failed") {
      logger.warn(`Notification ${notificationId} is not in failed status`);
      return false;
    }

    const prefs = await getNotificationPreferences();
    const MAX_RETRIES = prefs.maxRetries;

    if (notification.retryCount >= MAX_RETRIES) {
      logger.warn(`Notification ${notificationId} has exceeded max retries`);
      return false;
    }

    // Increment retry count
    await notification.incrementRetry();

    // Reset status to pending
    await notification.update({
      status: "pending",
      failedAt: null,
      errorMessage: null,
    });

    // Re-queue jobs for each channel
    if (notification.channels.includes("email")) {
      await emailQueue.add("send-email", { notificationId }, { priority: 1 });
    }

    if (notification.channels.includes("push")) {
      await pushQueue.add("send-push", { notificationId }, { priority: 1 });
    }

    if (notification.channels.includes("sms")) {
      await smsQueue.add("send-sms", { notificationId }, { priority: 1 });
    }

    logger.info(`Retried notification ${notificationId} (attempt ${notification.retryCount + 1})`);
    return true;
  } catch (error: any) {
    logger.error(`Error retrying notification ${notificationId}:`, error);
    return false;
  }
}

/**
 * Get failed notifications that can be retried
 */
export async function getRetryableNotifications(): Promise<Notification[]> {
  try {
    const prefs = await getNotificationPreferences();
    const MAX_RETRIES = prefs.maxRetries;
    
    return await Notification.findAll({
      where: {
        status: "failed",
        retryCount: {
          [Op.lt]: MAX_RETRIES,
        },
      },
      order: [["failedAt", "ASC"]],
      limit: 100,
    });
  } catch (error: any) {
    logger.error("Error getting retryable notifications:", error);
    return [];
  }
}

/**
 * Process retryable notifications
 */
export async function processRetryableNotifications(): Promise<number> {
  try {
    const notifications = await getRetryableNotifications();
    let retried = 0;

    for (const notification of notifications) {
      const success = await retryFailedNotification(notification.id);
      if (success) {
        retried++;
      }
    }

    logger.info(`Processed ${retried} retryable notifications`);
    return retried;
  } catch (error: any) {
    logger.error("Error processing retryable notifications:", error);
    return 0;
  }
}

export default {
  updateDeliveryStatus,
  retryFailedNotification,
  getRetryableNotifications,
  processRetryableNotifications,
};
