/**
 * Tenant Utilities
 * Helper functions for tenant-related operations
 */

import { AuthRequest } from "../middleware/auth";

/**
 * Get tenantId from request, throwing error if null
 * Use this in controllers that require tenant access
 */
export function requireTenantId(req: AuthRequest): string {
  if (!req.user?.tenantId) {
    throw new Error("Tenant access required");
  }
  return req.user.tenantId;
}

