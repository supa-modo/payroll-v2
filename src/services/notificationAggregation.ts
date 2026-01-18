/**
 * Notification Aggregation Service
 * Groups similar notifications to reduce noise
 */

import { Notification, Op } from "../models";
import logger from "../utils/logger";

/**
 * Generate group key for notification aggregation
 */
export function generateGroupKey(
  type: string,
  userId: string,
  tenantId: string,
  entityType?: string | null,
  entityId?: string | null
): string {
  const parts = [type, userId, tenantId];
  if (entityType) parts.push(entityType);
  if (entityId) parts.push(entityId);
  return parts.join(":");
}

/**
 * Aggregate similar notifications
 */
export async function aggregateNotifications(
  groupKey: string,
  maxAge: number = 3600000 // 1 hour in milliseconds
): Promise<Notification | null> {
  try {
    // Find unread notifications with the same group key
    const notifications = await Notification.findAll({
      where: {
        groupKey,
        readAt: null,
        createdAt: {
          [Op.gte]: new Date(Date.now() - maxAge),
        },
      },
      order: [["createdAt", "DESC"]],
    });

    if (notifications.length <= 1) {
      return notifications[0] || null;
    }

    // Get the most recent notification as the base
    const baseNotification = notifications[0];

    // Update title and message to reflect aggregation
    const count = notifications.length;
    const aggregatedTitle = count > 1
      ? `${baseNotification.title} (${count} new)`
      : baseNotification.title;

    const aggregatedMessage = count > 1
      ? `You have ${count} new ${baseNotification.type} notifications`
      : baseNotification.message;

    // Update the base notification
    await baseNotification.update({
      title: aggregatedTitle,
      message: aggregatedMessage,
      metadata: {
        ...(baseNotification.metadata || {}),
        aggregatedCount: count,
        aggregatedIds: notifications.map((n) => n.id),
      },
    });

    // Mark other notifications as read (they're now part of the aggregated one)
    const otherIds = notifications.slice(1).map((n) => n.id);
    if (otherIds.length > 0) {
      await Notification.update(
        { readAt: new Date() },
        {
          where: {
            id: {
              [Op.in]: otherIds,
            },
          },
        }
      );
    }

    logger.info(`Aggregated ${count} notifications with group key ${groupKey}`);
    return baseNotification;
  } catch (error: any) {
    logger.error(`Error aggregating notifications for group ${groupKey}:`, error);
    return null;
  }
}

/**
 * Check if notification should be aggregated
 */
export function shouldAggregate(
  type: string,
  aggregationRules?: Record<string, boolean>
): boolean {
  // Default aggregation rules
  const defaultRules: Record<string, boolean> = {
    expense_approved: true,
    expense_rejected: true,
    payslip_ready: false, // Don't aggregate payslips
    system_announcement: false, // Don't aggregate announcements
  };

  const rules = { ...defaultRules, ...(aggregationRules || {}) };
  return rules[type] !== undefined ? rules[type] : false;
}

export default {
  generateGroupKey,
  aggregateNotifications,
  shouldAggregate,
};
