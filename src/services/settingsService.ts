/**
 * Settings Service
 * Manages system-wide and tenant-specific settings with environment variable fallback
 */

import { SystemSetting } from "../models";
import logger from "../utils/logger";

/**
 * Get a global/system-wide setting
 */
export async function getGlobalSetting(
  key: string,
  defaultValue: any = null
): Promise<any> {
  try {
    const setting = await SystemSetting.findOne({
      where: {
        key,
        tenantId: null,
      },
    });

    if (setting) {
      return setting.value;
    }

    // Fallback to environment variable
    const envKey = key.toUpperCase().replace(/:/g, "_");
    const envValue = process.env[envKey];
    
    if (envValue !== undefined) {
      try {
        // Try to parse as JSON, fallback to string
        try {
          return JSON.parse(envValue);
        } catch {
          return envValue;
        }
      } catch {
        return envValue;
      }
    }

    return defaultValue;
  } catch (error: any) {
    logger.error(`Error getting global setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Get a tenant-specific setting
 */
export async function getTenantSetting(
  tenantId: string,
  key: string,
  defaultValue: any = null
): Promise<any> {
  try {
    const setting = await SystemSetting.findOne({
      where: {
        key,
        tenantId,
      },
    });

    if (setting) {
      return setting.value;
    }

    // Fallback to global setting
    return await getGlobalSetting(key, defaultValue);
  } catch (error: any) {
    logger.error(`Error getting tenant setting ${key} for tenant ${tenantId}:`, error);
    return defaultValue;
  }
}

/**
 * Get setting (checks tenant first, then global, then env)
 */
export async function getSetting(
  key: string,
  tenantId?: string | null,
  defaultValue: any = null
): Promise<any> {
  if (tenantId) {
    return await getTenantSetting(tenantId, key, defaultValue);
  }
  return await getGlobalSetting(key, defaultValue);
}

/**
 * Set a global/system-wide setting
 */
export async function setGlobalSetting(
  key: string,
  value: any,
  description?: string,
  category?: string,
  updatedBy?: string
): Promise<SystemSetting> {
  try {
    const [setting, created] = await SystemSetting.findOrCreate({
      where: {
        key,
        tenantId: null,
      },
      defaults: {
        key,
        tenantId: null,
        value,
        description: description || null,
        category: category || null,
        updatedBy: updatedBy || null,
      },
    });

    if (!created) {
      await setting.update({
        value,
        description: description !== undefined ? description : setting.description,
        category: category !== undefined ? category : setting.category,
        updatedBy: updatedBy || setting.updatedBy,
      });
    }

    logger.info(`Global setting ${key} ${created ? "created" : "updated"}`);
    return setting;
  } catch (error: any) {
    logger.error(`Error setting global setting ${key}:`, error);
    throw error;
  }
}

/**
 * Set a tenant-specific setting
 */
export async function setTenantSetting(
  tenantId: string,
  key: string,
  value: any,
  description?: string,
  updatedBy?: string
): Promise<SystemSetting> {
  try {
    const [setting, created] = await SystemSetting.findOrCreate({
      where: {
        key,
        tenantId,
      },
      defaults: {
        key,
        tenantId,
        value,
        description: description || null,
        updatedBy: updatedBy || null,
      },
    });

    if (!created) {
      await setting.update({
        value,
        description: description !== undefined ? description : setting.description,
        updatedBy: updatedBy || setting.updatedBy,
      });
    }

    logger.info(`Tenant setting ${key} for tenant ${tenantId} ${created ? "created" : "updated"}`);
    return setting;
  } catch (error: any) {
    logger.error(`Error setting tenant setting ${key} for tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Get all global settings grouped by category
 */
export async function getAllGlobalSettings(): Promise<Record<string, SystemSetting[]>> {
  try {
    const settings = await SystemSetting.findAll({
      where: {
        tenantId: null,
      },
      order: [["category", "ASC"], ["key", "ASC"]],
    });

    const grouped: Record<string, SystemSetting[]> = {};
    settings.forEach((setting) => {
      const category = setting.category || "general";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(setting);
    });

    return grouped;
  } catch (error: any) {
    logger.error("Error getting all global settings:", error);
    return {};
  }
}

/**
 * Get global settings by category
 */
export async function getGlobalSettingsByCategory(
  category: string
): Promise<SystemSetting[]> {
  try {
    return await SystemSetting.findAll({
      where: {
        tenantId: null,
        category,
      },
      order: [["key", "ASC"]],
    });
  } catch (error: any) {
    logger.error(`Error getting global settings for category ${category}:`, error);
    return [];
  }
}

/**
 * Delete a global setting
 */
export async function deleteGlobalSetting(key: string): Promise<boolean> {
  try {
    const deleted = await SystemSetting.destroy({
      where: {
        key,
        tenantId: null,
      },
    });

    if (deleted > 0) {
      logger.info(`Global setting ${key} deleted`);
      return true;
    }

    return false;
  } catch (error: any) {
    logger.error(`Error deleting global setting ${key}:`, error);
    throw error;
  }
}

/**
 * Delete a tenant setting
 */
export async function deleteTenantSetting(
  tenantId: string,
  key: string
): Promise<boolean> {
  try {
    const deleted = await SystemSetting.destroy({
      where: {
        key,
        tenantId,
      },
    });

    if (deleted > 0) {
      logger.info(`Tenant setting ${key} for tenant ${tenantId} deleted`);
      return true;
    }

    return false;
  } catch (error: any) {
    logger.error(`Error deleting tenant setting ${key} for tenant ${tenantId}:`, error);
    throw error;
  }
}

export default {
  getGlobalSetting,
  getTenantSetting,
  getSetting,
  setGlobalSetting,
  setTenantSetting,
  getAllGlobalSettings,
  getGlobalSettingsByCategory,
  deleteGlobalSetting,
  deleteTenantSetting,
};
