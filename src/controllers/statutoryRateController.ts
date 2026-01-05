/**
 * Statutory Rate Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { StatutoryRate, PayrollPeriod } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all statutory rates
 */
export async function getStatutoryRates(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    requireTenantId(req); // Ensure user is tenant user
    const { country = "Kenya" } = req.query;

    const rates = await StatutoryRate.findAll({
      where: {
        country: country as string,
        isActive: true,
      },
      order: [
        ["rateType", "ASC"],
        ["effectiveFrom", "DESC"],
      ],
    });

    res.json({ rates });
  } catch (error: any) {
    logger.error("Get statutory rates error:", error);
    res.status(500).json({ error: "Failed to get statutory rates" });
  }
}

/**
 * Create statutory rate
 */
export async function createStatutoryRate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { rateType, effectiveFrom, effectiveTo, country, config } = req.body;

    // Validate required fields
    if (!rateType || !effectiveFrom || !config) {
      res.status(400).json({
        error: "Rate type, effective from date, and config are required",
      });
      return;
    }

    const statutoryRate = await StatutoryRate.create({
      rateType,
      effectiveFrom,
      effectiveTo: effectiveTo || null,
      country: country || "Kenya",
      config,
      isActive: true,
    });

    res.status(201).json({
      message: "Statutory rate created successfully",
      rate: statutoryRate,
    });
  } catch (error: any) {
    logger.error("Create statutory rate error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ error: "Rate with this configuration already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create statutory rate" });
  }
}

/**
 * Update statutory rate
 */
export async function updateStatutoryRate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);
    const { id } = req.params;
    const { effectiveFrom, effectiveTo, config, isActive } = req.body;

    const statutoryRate = await StatutoryRate.findByPk(id);

    if (!statutoryRate) {
      res.status(404).json({ error: "Statutory rate not found" });
      return;
    }

    // Check if rate is in use by active payroll periods
    if (isActive === false && statutoryRate.isActive) {
      const activePeriods = await PayrollPeriod.count({
        where: {
          tenantId,
          status: { [Op.in]: ["draft", "processing", "approved"] },
        },
      });

      if (activePeriods > 0) {
        res.status(400).json({
          error:
            "Cannot deactivate rate while there are active payroll periods",
        });
        return;
      }
    }

    await statutoryRate.update({
      effectiveFrom:
        effectiveFrom !== undefined
          ? effectiveFrom
          : statutoryRate.effectiveFrom,
      effectiveTo:
        effectiveTo !== undefined ? effectiveTo : statutoryRate.effectiveTo,
      config: config !== undefined ? config : statutoryRate.config,
      isActive:
        isActive !== undefined ? isActive : statutoryRate.isActive,
    });

    res.json({
      message: "Statutory rate updated successfully",
      rate: statutoryRate,
    });
  } catch (error: any) {
    logger.error("Update statutory rate error:", error);
    res.status(500).json({ error: "Failed to update statutory rate" });
  }
}

/**
 * Delete statutory rate (soft delete)
 */
export async function deleteStatutoryRate(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);
    const { id } = req.params;

    const statutoryRate = await StatutoryRate.findByPk(id);

    if (!statutoryRate) {
      res.status(404).json({ error: "Statutory rate not found" });
      return;
    }

    // Check if rate is in use
    const activePeriods = await PayrollPeriod.count({
      where: {
        tenantId,
        status: { [Op.in]: ["draft", "processing", "approved"] },
      },
    });

    if (activePeriods > 0) {
      res.status(400).json({
        error: "Cannot delete rate while there are active payroll periods",
      });
      return;
    }

    // Soft delete by marking as inactive
    await statutoryRate.update({
      isActive: false,
    });

    res.json({ message: "Statutory rate deleted successfully" });
  } catch (error: any) {
    logger.error("Delete statutory rate error:", error);
    res.status(500).json({ error: "Failed to delete statutory rate" });
  }
}

