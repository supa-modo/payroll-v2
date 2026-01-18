/**
 * Notification Analytics Service
 * Tracks engagement metrics for notifications
 */

import { Notification, Op } from "../models";
import { sequelize } from "../config/database";
import { QueryTypes } from "sequelize";
import logger from "../utils/logger";

/**
 * Get notification statistics
 */
export async function getNotificationStats(
  userId?: string,
  tenantId?: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  readRate: number;
  deliveryRate: number;
}> {
  try {
    const whereClause: any = {};

    if (userId) {
      whereClause.userId = userId;
    }

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = startDate;
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = endDate;
      }
    }

    // Get total count
    const total = await Notification.count({ where: whereClause });

    // Get unread count
    const unread = await Notification.count({
      where: {
        ...whereClause,
        readAt: null,
      },
    });

    // Get read count
    const read = total - unread;

    // Get by type
    const byTypeResult = await Notification.findAll({
      attributes: [
        "type",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: whereClause,
      group: ["type"],
      raw: true,
    });

    const byType: Record<string, number> = {};
    byTypeResult.forEach((row: any) => {
      byType[row.type] = parseInt(row.count, 10);
    });

    // Get by status
    const byStatusResult = await Notification.findAll({
      attributes: [
        "status",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: whereClause,
      group: ["status"],
      raw: true,
    });

    const byStatus: Record<string, number> = {};
    byStatusResult.forEach((row: any) => {
      byStatus[row.status] = parseInt(row.count, 10);
    });

    // Get by priority
    const byPriorityResult = await Notification.findAll({
      attributes: [
        "priority",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: whereClause,
      group: ["priority"],
      raw: true,
    });

    const byPriority: Record<string, number> = {};
    byPriorityResult.forEach((row: any) => {
      byPriority[row.priority] = parseInt(row.count, 10);
    });

    // Calculate rates
    const readRate = total > 0 ? (read / total) * 100 : 0;
    const delivered = byStatus.delivered || 0;
    const deliveryRate = total > 0 ? (delivered / total) * 100 : 0;

    return {
      total,
      unread,
      read,
      byType,
      byStatus,
      byPriority,
      readRate: Math.round(readRate * 100) / 100,
      deliveryRate: Math.round(deliveryRate * 100) / 100,
    };
  } catch (error: any) {
    logger.error("Error getting notification stats:", error);
    throw error;
  }
}

/**
 * Get notification engagement over time
 */
export async function getEngagementOverTime(
  userId?: string,
  tenantId?: string,
  days: number = 30
): Promise<Array<{ date: string; sent: number; read: number; delivered: number }>> {
  try {
    const whereClause: any = {
      createdAt: {
        [Op.gte]: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
      },
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    const results = await sequelize.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as sent,
        COUNT(read_at) as read,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered
      FROM notifications
      WHERE created_at >= NOW() - INTERVAL '${days} days'
        ${userId ? `AND user_id = '${userId}'` : ""}
        ${tenantId ? `AND tenant_id = '${tenantId}'` : ""}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, {
      type: QueryTypes.SELECT as any,
    });

    return (results as any[]).map((row: any) => ({
      date: row.date,
      sent: parseInt(row.sent, 10),
      read: parseInt(row.read, 10),
      delivered: parseInt(row.delivered, 10),
    }));
  } catch (error: any) {
    logger.error("Error getting engagement over time:", error);
    throw error;
  }
}

export default {
  getNotificationStats,
  getEngagementOverTime,
};
