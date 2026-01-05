/**
 * Data Change History Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { getChangeHistory, getFieldHistory } from "../services/dataChangeHistoryService";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get change history for an entity
 */
export async function getEntityChangeHistory(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const { entityType, entityId, fieldName } = req.query;

    if (!entityType || !entityId) {
      res.status(400).json({
        error: "Entity type and entity ID are required",
      });
      return;
    }

    let history;
    if (fieldName) {
      history = await getFieldHistory(
        tenantId,
        entityType as string,
        entityId as string,
        fieldName as string
      );
    } else {
      history = await getChangeHistory(
        tenantId,
        entityType as string,
        entityId as string
      );
    }

    res.json({ history });
  } catch (error: any) {
    logger.error("Get change history error:", error);
    res.status(500).json({ error: "Failed to get change history" });
  }
}

