/**
 * Permission Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Permission } from "../models";
import logger from "../utils/logger";

/**
 * Get all permissions grouped by category
 */
export async function getPermissions(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const permissions = await Permission.findAll({
      order: [["category", "ASC"], ["displayName", "ASC"]],
    });

    // Group by category
    const grouped = permissions.reduce((acc: any, permission) => {
      const category = permission.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(permission);
      return acc;
    }, {});

    res.json({
      permissions,
      grouped,
    });
  } catch (error: any) {
    logger.error("Get permissions error:", error);
    res.status(500).json({ error: "Failed to get permissions" });
  }
}

/**
 * Get single permission
 */
export async function getPermission(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { id } = req.params;

    const permission = await Permission.findByPk(id);

    if (!permission) {
      res.status(404).json({ error: "Permission not found" });
      return;
    }

    res.json({ permission });
  } catch (error: any) {
    logger.error("Get permission error:", error);
    res.status(500).json({ error: "Failed to get permission" });
  }
}

