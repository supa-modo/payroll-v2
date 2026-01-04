/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { User } from "../models";
import { loadUserRolesAndPermissions } from "./rbac";

/**
 * Extended Request interface with user
 */
export interface AuthRequest extends Request {
  user?: {
    id: string;
    tenantId: string | null;
    role: string;
    email?: string;
    isSystemAdmin?: boolean;
    roles?: string[];
    permissions?: string[];
  };
}

/**
 * Middleware to verify JWT access token
 */
export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({ error: "Access token required" });
      return;
    }

    // Verify token
    const payload = verifyAccessToken(token);

    // Fetch user from database
    const user = await User.findByPk(payload.sub);

    if (!user || !user.checkIsActive()) {
      res.status(401).json({ error: "User not found or inactive" });
      return;
    }

    // Pre-load roles and permissions to avoid duplicate queries in RBAC middleware
    // For system admins, skip RBAC loading (they have all permissions)
    let roles: string[] = [];
    let permissions: string[] = [];
    if (!user.isSystemAdmin && user.tenantId) {
      const loaded = await loadUserRolesAndPermissions(
        user.id,
        user.tenantId
      );
      roles = loaded.roles;
      permissions = loaded.permissions;
    }

    // Attach user to request with pre-loaded roles and permissions
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      isSystemAdmin: user.isSystemAdmin,
      roles,
      permissions,
    };

    next();
  } catch (error: any) {
    if (error.message === "Token expired") {
      res.status(401).json({ error: "Token expired", code: "TOKEN_EXPIRED" });
      return;
    }

    if (error.message === "Invalid token") {
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    console.error("Authentication error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export default authenticateToken;

