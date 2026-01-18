/**
 * Real-time Notification Service
 * Handles broadcasting notifications via WebSocket/Socket.IO
 */

import { Server as SocketIOServer } from "socket.io";
import { Notification } from "../models";
import logger from "../utils/logger";

let io: SocketIOServer | null = null;

/**
 * Initialize real-time service with Socket.IO server
 */
export function initializeRealtimeService(socketIOServer: SocketIOServer): void {
  io = socketIOServer;
  logger.info("✅ Real-time notification service initialized");
}

/**
 * Broadcast notification to user
 */
export async function broadcastNotification(notification: Notification): Promise<void> {
  if (!io) {
    logger.warn("Socket.IO server not initialized, skipping real-time broadcast");
    return;
  }

  try {
    // Broadcast to user's room
    const userRoom = `user:${notification.userId}`;
    io.to(userRoom).emit("notification", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      entityType: notification.entityType,
      entityId: notification.entityId,
      actionUrl: notification.actionUrl,
      priority: notification.priority,
      createdAt: notification.createdAt,
      readAt: notification.readAt,
    });

    logger.debug(`Broadcasted notification ${notification.id} to room ${userRoom}`);
  } catch (error: any) {
    logger.error(`Error broadcasting notification ${notification.id}:`, error);
  }
}

/**
 * Broadcast notification update (e.g., marked as read)
 */
export async function broadcastNotificationUpdate(
  notificationId: string,
  update: Partial<Notification>
): Promise<void> {
  if (!io) {
    return;
  }

  try {
    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return;
    }

    const userRoom = `user:${notification.userId}`;
    io.to(userRoom).emit("notification:update", {
      id: notification.id,
      ...update,
    });

    logger.debug(`Broadcasted notification update ${notificationId} to room ${userRoom}`);
  } catch (error: any) {
    logger.error(`Error broadcasting notification update ${notificationId}:`, error);
  }
}

/**
 * Broadcast to tenant (for admin notifications)
 */
export async function broadcastToTenant(
  tenantId: string,
  event: string,
  data: any
): Promise<void> {
  if (!io) {
    return;
  }

  try {
    const tenantRoom = `tenant:${tenantId}`;
    io.to(tenantRoom).emit(event, data);
    logger.debug(`Broadcasted ${event} to tenant ${tenantId}`);
  } catch (error: any) {
    logger.error(`Error broadcasting to tenant ${tenantId}:`, error);
  }
}

export default {
  initializeRealtimeService,
  broadcastNotification,
  broadcastNotificationUpdate,
  broadcastToTenant,
};
