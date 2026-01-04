/**
 * RBAC Middleware
 * Role-Based Access Control for route protection
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { Role, Permission, UserRole } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";

/**
 * Extended AuthRequest with roles and permissions
 */
export interface RBACRequest extends AuthRequest {
  userRoles?: string[];
  userPermissions?: string[];
}

/**
 * Cache for user roles and permissions (in-memory, can be replaced with Redis)
 */
const userPermissionsCache = new Map<string, { roles: string[]; permissions: string[]; expiresAt: number }>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load user roles and permissions from database
 */
export async function loadUserRolesAndPermissions(userId: string, tenantId: string | null): Promise<{
  roles: string[];
  permissions: string[];
}> {
  // Check cache first
  const cacheKey = `${userId}:${tenantId}`;
  const cached = userPermissionsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { roles: cached.roles, permissions: cached.permissions };
  }

  try {
    // Single optimized query: Get user roles with nested permissions
    const userRoles = await UserRole.findAll({
      where: {
        userId,
      },
      include: [
        {
          model: Role,
          as: "role",
          where: {
            [Op.or]: [
              { tenantId: null }, // System roles
              { tenantId }, // Tenant-specific roles
            ],
          },
          required: true,
          include: [
            {
              model: Permission,
              as: "permissions",
              through: {
                attributes: [], // Don't include junction table attributes
              },
              required: false,
            },
          ],
        },
      ],
    });

    if (userRoles.length === 0) {
      return { roles: [], permissions: [] };
    }

    // Extract role names and permissions from the nested structure
    const roleNames: string[] = [];
    const permissions: string[] = [];

    for (const userRole of userRoles) {
      const role = (userRole as any).role;
      if (role?.name) {
        roleNames.push(role.name);
        
        // Extract permissions from nested structure
        if (role.permissions && Array.isArray(role.permissions)) {
          for (const permission of role.permissions) {
            if (permission?.name) {
              permissions.push(permission.name);
            }
          }
        }
      }
    }

    // Remove duplicates
    const uniquePermissions = [...new Set(permissions)];

    // Cache the result
    userPermissionsCache.set(cacheKey, {
      roles: roleNames,
      permissions: uniquePermissions,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return {
      roles: roleNames,
      permissions: uniquePermissions,
    };
  } catch (error: any) {
    logger.error("Error loading user roles and permissions:", error);
    return { roles: [], permissions: [] };
  }
}

/**
 * Check if user has a specific permission
 */
export async function checkPermission(
  req: RBACRequest,
  permission: string
): Promise<boolean> {
  if (!req.user) {
    return false;
  }

  // Use pre-loaded permissions from auth middleware if available
  if (req.user.permissions) {
    req.userPermissions = req.user.permissions;
    req.userRoles = req.user.roles;
  } else if (!req.userPermissions) {
    // Fallback: Load if not pre-loaded (shouldn't happen in normal flow)
    const { roles, permissions } = await loadUserRolesAndPermissions(
      req.user.id,
      req.user.tenantId
    );
    req.userRoles = roles;
    req.userPermissions = permissions;
  }

  // Super admin has all permissions
  if (req.userRoles?.includes("super_admin")) {
    return true;
  }

  return req.userPermissions?.includes(permission) || false;
}

/**
 * Check if user has a specific role
 */
export async function checkRole(req: RBACRequest, role: string): Promise<boolean> {
  if (!req.user) {
    return false;
  }

  // Use pre-loaded roles from auth middleware if available
  if (req.user.roles) {
    req.userRoles = req.user.roles;
    req.userPermissions = req.user.permissions;
  } else if (!req.userRoles) {
    // Fallback: Load if not pre-loaded (shouldn't happen in normal flow)
    const { roles, permissions } = await loadUserRolesAndPermissions(
      req.user.id,
      req.user.tenantId
    );
    req.userRoles = roles;
    req.userPermissions = permissions;
  }

  return req.userRoles?.includes(role) || false;
}

/**
 * Middleware to require a specific permission
 */
export function requirePermission(permission: string) {
  return async (req: RBACRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const hasPermission = await checkPermission(req, permission);

      if (!hasPermission) {
        res.status(403).json({
          error: "Insufficient permissions",
          required: permission,
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error("Permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Middleware to require a specific role
 */
export function requireRole(role: string) {
  return async (req: RBACRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      const hasRole = await checkRole(req, role);

      if (!hasRole) {
        res.status(403).json({
          error: "Insufficient role",
          required: role,
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error("Role check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Middleware to require any of the specified permissions
 */
export function requireAnyPermission(...permissions: string[]) {
  return async (req: RBACRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: "Authentication required" });
        return;
      }

      // Use pre-loaded permissions from auth middleware if available
      if (req.user.permissions) {
        req.userPermissions = req.user.permissions;
        req.userRoles = req.user.roles;
      } else if (!req.userPermissions) {
        // Fallback: Load if not pre-loaded
        const { roles, permissions } = await loadUserRolesAndPermissions(
          req.user.id,
          req.user.tenantId
        );
        req.userRoles = roles;
        req.userPermissions = permissions;
      }

      // Super admin has all permissions
      if (req.userRoles?.includes("super_admin")) {
        next();
        return;
      }

      // Check if user has any of the required permissions
      const hasAnyPermission = permissions.some((perm) =>
        req.userPermissions?.includes(perm)
      ) || false;

      if (!hasAnyPermission) {
        res.status(403).json({
          error: "Insufficient permissions",
          required: permissions,
        });
        return;
      }

      next();
    } catch (error: any) {
      logger.error("Permission check error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  };
}

/**
 * Clear cache for a user (call after role/permission changes)
 */
export function clearUserCache(userId: string, tenantId: string): void {
  const cacheKey = `${userId}:${tenantId}`;
  userPermissionsCache.delete(cacheKey);
}

/**
 * Clear all cache
 */
export function clearAllCache(): void {
  userPermissionsCache.clear();
}

