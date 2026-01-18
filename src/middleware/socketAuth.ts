/**
 * Socket.IO Authentication Middleware
 * Validates JWT tokens for Socket.IO connections
 */

import { Socket } from "socket.io";
import { ExtendedError } from "socket.io/dist/namespace";
import { verifyAccessToken } from "../utils/jwt";
import { User } from "../models";
import logger from "../utils/logger";

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  tenantId?: string;
  user?: User;
}

/**
 * Socket.IO authentication middleware
 */
export async function socketAuth(
  socket: AuthenticatedSocket,
  next: (err?: ExtendedError) => void
): Promise<void> {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication token required"));
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Get user
    const userId = (payload as any).sub || (payload as any).id;
    const user = await User.findByPk(userId);
    if (!user || !user.isActive) {
      return next(new Error("Invalid or inactive user"));
    }

    // Attach user info to socket
    socket.userId = user.id;
    socket.tenantId = user.tenantId || undefined;
    socket.user = user;

    // Join user-specific room
    if (user.id) {
      socket.join(`user:${user.id}`);
    }

    // Join tenant-specific room if tenant exists
    if (user.tenantId) {
      socket.join(`tenant:${user.tenantId}`);
    }

    logger.info(`Socket authenticated: ${socket.id} for user ${user.id}`);
    next();
  } catch (error: any) {
    logger.error("Socket authentication error:", error);
    next(new Error("Authentication failed"));
  }
}

export default socketAuth;
