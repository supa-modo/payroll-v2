/**
 * Audit Logging Middleware
 * Logs create/update/delete operations automatically
 */

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import { AuditLog } from "../models";
import logger from "../utils/logger";

export interface AuditOptions {
  entityType: string;
  getEntityId: (req: Request) => string;
  getPreviousData?: (req: Request) => Promise<any> | any;
  getNewData?: (req: Request) => any;
  skipActions?: string[]; // Actions to skip logging
}

/**
 * Create audit log entry
 */
export async function createAuditLog(
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId: string,
  previousData?: any,
  newData?: any
): Promise<void> {
  try {
    // Don't block the main request if audit logging fails
    setImmediate(async () => {
      try {
        const changes: Record<string, any> = {};

        // Calculate changes if both previous and new data exist
        if (previousData && newData) {
          Object.keys(newData).forEach((key) => {
            if (previousData[key] !== newData[key]) {
              changes[key] = {
                old: previousData[key],
                new: newData[key],
              };
            }
          });
        }

        await AuditLog.create({
          tenantId: req.user?.tenantId || null,
          userId: req.user?.id || null,
          action,
          entityType,
          entityId,
          previousData: previousData || null,
          newData: newData || null,
          changes: Object.keys(changes).length > 0 ? changes : null,
          ipAddress: req.ip || req.socket.remoteAddress || null,
          userAgent: req.get("user-agent") || null,
        });
      } catch (error: any) {
        // Log error but don't throw - audit logging should not break the main flow
        logger.error("Failed to create audit log:", error);
      }
    });
  } catch (error: any) {
    logger.error("Audit log creation error:", error);
  }
}

/**
 * Audit middleware factory
 * Creates middleware for specific entity types
 */
export function auditMiddleware(options: AuditOptions) {
  return async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override res.json to capture response data
    res.json = function (body: any) {
      // Restore original json
      res.json = originalJson;

      // Determine action based on HTTP method
      let action = "";
      if (req.method === "POST") {
        action = "CREATE";
      } else if (req.method === "PUT" || req.method === "PATCH") {
        action = "UPDATE";
      } else if (req.method === "DELETE") {
        action = "DELETE";
      }

      // Skip if action is in skipActions
      if (options.skipActions?.includes(action)) {
        return originalJson.call(this, body);
      }

      // Get entity ID
      let entityId: string;
      try {
        entityId = options.getEntityId(req);
      } catch (error) {
        // If entity ID can't be determined, skip audit logging
        return originalJson.call(this, body);
      }

      // Get previous data for updates/deletes (handle both sync and async)
      let previousData: any = null;
      let isAsyncPreviousData = false;
      
      if (action === "UPDATE" || action === "DELETE") {
        try {
          if (options.getPreviousData) {
            const previousDataResult = options.getPreviousData(req);
            if (previousDataResult instanceof Promise) {
              // Handle async - don't await, log later
              isAsyncPreviousData = true;
              previousDataResult
                .then((data) => {
                  // Get new data
                  let newData: any = null;
                  if (action === "UPDATE") {
                    try {
                      if (options.getNewData) {
                        newData = options.getNewData(req);
                      } else if (body && body[options.entityType.toLowerCase()]) {
                        newData = body[options.entityType.toLowerCase()];
                      } else if (body) {
                        newData = body;
                      }
                    } catch (error) {
                      // Continue without new data
                    }
                  }

                  // Create audit log
                  if (req.user) {
                    createAuditLog(
                      req,
                      action,
                      options.entityType,
                      entityId,
                      data,
                      newData
                    );
                  }
                })
                .catch(() => {
                  // Continue without previous data
                });
              // Return immediately, audit will happen async
              return originalJson.call(this, body);
            } else {
              previousData = previousDataResult;
            }
          }
        } catch (error) {
          // Continue without previous data
        }
      }

      // Get new data for creates/updates (only if not async previous data)
      if (!isAsyncPreviousData) {
        let newData: any = null;
        if (action === "CREATE" || action === "UPDATE") {
          try {
            if (options.getNewData) {
              newData = options.getNewData(req);
            } else if (body && body[options.entityType.toLowerCase()]) {
              newData = body[options.entityType.toLowerCase()];
            } else if (body) {
              newData = body;
            }
          } catch (error) {
            // Continue without new data
          }
        }

        // Create audit log asynchronously
        if (req.user) {
          createAuditLog(
            req,
            action,
            options.entityType,
            entityId,
            previousData,
            newData
          );
        }
      }

      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Simple audit log helper for manual logging
 */
export async function logAudit(
  req: AuthRequest,
  action: string,
  entityType: string,
  entityId: string,
  data?: any
): Promise<void> {
  await createAuditLog(req, action, entityType, entityId, null, data);
}
