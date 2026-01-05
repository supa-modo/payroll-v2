/**
 * Data Change History Service
 * Tracks field-level changes for sensitive data
 */

import { DataChangeHistory } from "../models";
import logger from "../utils/logger";

export interface TrackChangeParams {
  tenantId: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changeReason?: string;
}

/**
 * Track a field-level change
 * @param params - Change tracking parameters
 * @param transaction - Optional transaction to use for the database operation
 */
export async function trackChange(
  params: TrackChangeParams,
  transaction?: any
): Promise<DataChangeHistory> {
  try {
    const changeHistory = await DataChangeHistory.create(
      {
        tenantId: params.tenantId,
        entityType: params.entityType,
        entityId: params.entityId,
        fieldName: params.fieldName,
        oldValue:
          typeof params.oldValue === "object"
            ? JSON.stringify(params.oldValue)
            : String(params.oldValue || ""),
        newValue:
          typeof params.newValue === "object"
            ? JSON.stringify(params.newValue)
            : String(params.newValue || ""),
        changedBy: params.changedBy,
        changeReason: params.changeReason || null,
      },
      transaction ? { transaction } : undefined
    );

    return changeHistory;
  } catch (error: any) {
    logger.error("Error tracking data change:", error);
    throw error;
  }
}

/**
 * Get change history for an entity
 */
export async function getChangeHistory(
  tenantId: string,
  entityType: string,
  entityId: string
): Promise<DataChangeHistory[]> {
  try {
    const history = await DataChangeHistory.findAll({
      where: {
        tenantId,
        entityType,
        entityId,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: require("../models").User,
          as: "changedByUser",
          attributes: ["id", "email", "firstName", "lastName"],
          required: false,
        },
      ],
    });

    return history;
  } catch (error: any) {
    logger.error("Error getting change history:", error);
    throw error;
  }
}

/**
 * Get change history for a specific field
 */
export async function getFieldHistory(
  tenantId: string,
  entityType: string,
  entityId: string,
  fieldName: string
): Promise<DataChangeHistory[]> {
  try {
    const history = await DataChangeHistory.findAll({
      where: {
        tenantId,
        entityType,
        entityId,
        fieldName,
      },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: require("../models").User,
          as: "changedByUser",
          attributes: ["id", "email", "firstName", "lastName"],
          required: false,
        },
      ],
    });

    return history;
  } catch (error: any) {
    logger.error("Error getting field history:", error);
    throw error;
  }
}

