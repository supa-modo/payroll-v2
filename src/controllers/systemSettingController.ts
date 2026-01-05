/**
 * System Setting Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { SystemSetting } from "../models";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all settings for tenant
 */
export async function getSettings(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = requireTenantId(req);

    const settings = await SystemSetting.findAll({
      where: { tenantId },
      order: [["category", "ASC"], ["key", "ASC"]],
    });

    // Group by key prefix (e.g., "payroll:", "expense:", "company:")
    const grouped: Record<string, any[]> = {};
    settings.forEach((setting) => {
      const keyParts = setting.key.split(":");
      const category = keyParts.length > 1 ? keyParts[0] : "general";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(setting.toJSON());
    });

    res.json({ settings: grouped });
  } catch (error: any) {
    logger.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
}

/**
 * Get single setting by key
 */
export async function getSetting(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const { key } = req.params;

    const setting = await SystemSetting.findOne({
      where: { tenantId, key },
    });

    if (!setting) {
      res.status(404).json({ error: "Setting not found" });
      return;
    }

    res.json({ setting });
  } catch (error: any) {
    logger.error("Get setting error:", error);
    res.status(500).json({ error: "Failed to get setting" });
  }
}

/**
 * Update setting
 */
export async function updateSetting(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);
    const { key } = req.params;
    const { value } = req.body;

    let setting = await SystemSetting.findOne({
      where: { tenantId, key },
    });

    if (!setting) {
      res.status(404).json({ error: "Setting not found" });
      return;
    }

    // Update setting
    await setting.update({
      value,
      updatedBy: req.user.id,
    });

    // TODO: Log change in audit log
    // await createAuditLog(req, "UPDATE", "SystemSetting", setting.id, ...);

    res.json({
      message: "Setting updated successfully",
      setting,
    });
  } catch (error: any) {
    logger.error("Update setting error:", error);
    res.status(500).json({ error: "Failed to update setting" });
  }
}

