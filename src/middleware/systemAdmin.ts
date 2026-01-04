/**
 * System Admin Middleware
 * Protects routes that require system admin access
 */

import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";
import logger from "../utils/logger";

/**
 * Middleware to check if user is a system admin
 */
export function isSystemAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Check if user is system admin
    if (!req.user.isSystemAdmin) {
      res.status(403).json({
        error: "System admin access required",
      });
      return;
    }

    next();
  } catch (error: any) {
    logger.error("System admin check error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

