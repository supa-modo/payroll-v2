/**
 * Audit Log Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AuditLog, User } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all audit logs with filters
 */
export async function getAuditLogs(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const {
      page = "1",
      limit = "50",
      userId,
      action,
      entityType,
      startDate,
      endDate,
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {
      tenantId,
    };

    if (userId) {
      whereClause.userId = userId;
    }

    if (action) {
      whereClause.action = action;
    }

    if (entityType) {
      whereClause.entityType = entityType;
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt[Op.gte] = new Date(startDate as string);
      }
      if (endDate) {
        whereClause.createdAt[Op.lte] = new Date(endDate as string);
      }
    }

    // Get total count
    const total = await AuditLog.count({ where: whereClause });

    // Get audit logs with user information
    const auditLogs = await AuditLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "firstName", "lastName"],
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: limitNum,
      offset,
    });

    res.json({
      auditLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error("Get audit logs error:", error);
    res.status(500).json({ error: "Failed to get audit logs" });
  }
}

/**
 * Get single audit log by ID
 */
export async function getAuditLog(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const tenantId = requireTenantId(req);
    const { id } = req.params;

    const auditLog = await AuditLog.findOne({
      where: {
        id,
        tenantId,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "firstName", "lastName"],
          required: false,
        },
      ],
    });

    if (!auditLog) {
      res.status(404).json({ error: "Audit log not found" });
      return;
    }

    res.json({ auditLog });
  } catch (error: any) {
    logger.error("Get audit log error:", error);
    res.status(500).json({ error: "Failed to get audit log" });
  }
}

