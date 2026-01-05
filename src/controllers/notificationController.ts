/**
 * Notification Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Notification } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";

/**
 * Get user notifications
 */
export async function getNotifications(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!req.user.tenantId) {
      res.status(403).json({ error: "Tenant access required" });
      return;
    }

    const tenantId = req.user.tenantId;
    const { unreadOnly, type, limit = "50" } = req.query;

    const whereClause: any = {
      userId: req.user.id,
      tenantId,
      expiresAt: {
        [Op.gt]: new Date(), // Only non-expired notifications
      },
    };

    if (unreadOnly === "true") {
      whereClause.readAt = null;
    }

    if (type) {
      whereClause.type = type;
    }

    const limitNum = parseInt(limit as string, 10);

    const notifications = await Notification.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: limitNum,
    });

    // Get unread count
    const unreadCount = await Notification.count({
      where: {
        ...whereClause,
        readAt: null,
      },
    });

    res.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    logger.error("Get notifications error:", error);
    if (error.message === "Tenant access required") {
      res.status(403).json({ error: "Tenant access required" });
      return;
    }
    res.status(500).json({ error: "Failed to get notifications" });
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!req.user.tenantId) {
      res.status(403).json({ error: "Tenant access required" });
      return;
    }

    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id,
        tenantId,
      },
    });

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    await notification.update({
      readAt: new Date(),
    });

    res.json({ message: "Notification marked as read", notification });
  } catch (error: any) {
    logger.error("Mark notification read error:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllRead(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!req.user.tenantId) {
      res.status(403).json({ error: "Tenant access required" });
      return;
    }

    const tenantId = req.user.tenantId;

    await Notification.update(
      {
        readAt: new Date(),
      },
      {
        where: {
          userId: req.user.id,
          tenantId,
          readAt: null,
        },
      }
    );

    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    logger.error("Mark all read error:", error);
    res.status(500).json({ error: "Failed to mark all notifications as read" });
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!req.user.tenantId) {
      res.status(403).json({ error: "Tenant access required" });
      return;
    }

    const tenantId = req.user.tenantId;
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: {
        id,
        userId: req.user.id,
        tenantId,
      },
    });

    if (!notification) {
      res.status(404).json({ error: "Notification not found" });
      return;
    }

    await notification.destroy();

    res.json({ message: "Notification deleted" });
  } catch (error: any) {
    logger.error("Delete notification error:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
}

