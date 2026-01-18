/**
 * System Admin Settings Controller
 * Handles CRUD operations for global/system-wide settings
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import {
  getAllGlobalSettings,
  getGlobalSettingsByCategory,
  getGlobalSetting,
  setGlobalSetting,
  deleteGlobalSetting,
} from "../services/settingsService";
import {
  getNotificationConfig as getNotificationConfigService,
  setNotificationConfig,
} from "../services/notificationConfigService";
import { testRedisConnection } from "../config/redis";
import { verifyEmailConfig } from "../services/emailService";
import logger from "../utils/logger";

/**
 * Get all global settings
 */
export async function getAllSettings(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const settings = await getAllGlobalSettings();
    res.json({ settings });
  } catch (error: any) {
    logger.error("Get all settings error:", error);
    res.status(500).json({ error: "Failed to get settings" });
  }
}

/**
 * Get settings by category
 */
export async function getSettingsByCategory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { category } = req.params;
    const settings = await getGlobalSettingsByCategory(category);
    res.json({ settings });
  } catch (error: any) {
    logger.error(`Get settings by category ${req.params.category} error:`, error);
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
    const { key } = req.params;
    const value = await getGlobalSetting(key);
    
    if (value === null) {
      res.status(404).json({ error: "Setting not found" });
      return;
    }

    res.json({ key, value });
  } catch (error: any) {
    logger.error(`Get setting ${req.params.key} error:`, error);
    res.status(500).json({ error: "Failed to get setting" });
  }
}

/**
 * Create or update a global setting
 */
export async function createOrUpdateSetting(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { key, value, description, category } = req.body;

    if (!key || value === undefined) {
      res.status(400).json({ error: "Key and value are required" });
      return;
    }

    const setting = await setGlobalSetting(
      key,
      value,
      description,
      category,
      req.user.id
    );

    res.json({
      message: "Setting saved successfully",
      setting,
    });
  } catch (error: any) {
    logger.error("Create/update setting error:", error);
    res.status(500).json({ error: "Failed to save setting" });
  }
}

/**
 * Update setting by key
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

    const { key } = req.params;
    const { value, description, category } = req.body;

    if (value === undefined) {
      res.status(400).json({ error: "Value is required" });
      return;
    }

    const setting = await setGlobalSetting(
      key,
      value,
      description,
      category,
      req.user.id
    );

    res.json({
      message: "Setting updated successfully",
      setting,
    });
  } catch (error: any) {
    logger.error(`Update setting ${req.params.key} error:`, error);
    res.status(500).json({ error: "Failed to update setting" });
  }
}

/**
 * Delete a global setting
 */
export async function deleteSetting(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { key } = req.params;
    const deleted = await deleteGlobalSetting(key);

    if (!deleted) {
      res.status(404).json({ error: "Setting not found" });
      return;
    }

    res.json({ message: "Setting deleted successfully" });
  } catch (error: any) {
    logger.error(`Delete setting ${req.params.key} error:`, error);
    res.status(500).json({ error: "Failed to delete setting" });
  }
}

/**
 * Get notification configuration
 */
export async function getNotificationConfig(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const config = await getNotificationConfigService();
    res.json({ config });
  } catch (error: any) {
    logger.error("Get notification config error:", error);
    res.status(500).json({ error: "Failed to get notification configuration" });
  }
}

/**
 * Update notification configuration
 */
export async function updateNotificationConfig(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { config } = req.body;

    if (!config) {
      res.status(400).json({ error: "Configuration is required" });
      return;
    }

    await setNotificationConfig(config, req.user.id);

    res.json({
      message: "Notification configuration updated successfully",
    });
  } catch (error: any) {
    logger.error("Update notification config error:", error);
    res.status(500).json({ error: "Failed to update notification configuration" });
  }
}

/**
 * Test Redis connection
 */
export async function testRedisConnectionEndpoint(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const connected = await testRedisConnection();
    if (connected) {
      res.json({ success: true, message: "Redis connection successful" });
    } else {
      res.status(500).json({ success: false, message: "Redis connection failed" });
    }
  } catch (error: any) {
    logger.error("Test Redis connection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test Redis connection",
      error: error.message,
    });
  }
}

/**
 * Test SMTP connection
 */
export async function testSMTPConnection(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const valid = await verifyEmailConfig();
    if (valid) {
      res.json({ success: true, message: "SMTP configuration is valid" });
    } else {
      res.status(500).json({
        success: false,
        message: "SMTP configuration is invalid",
      });
    }
  } catch (error: any) {
    logger.error("Test SMTP connection error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to test SMTP connection",
      error: error.message,
    });
  }
}

export default {
  getAllSettings,
  getSettingsByCategory,
  getSetting,
  createOrUpdateSetting,
  updateSetting,
  deleteSetting,
  getNotificationConfig,
  updateNotificationConfig,
  testRedisConnection: testRedisConnectionEndpoint,
  testSMTPConnection,
};
