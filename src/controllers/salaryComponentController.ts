/**
 * Salary Component Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { SalaryComponent, EmployeeSalaryComponent } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all salary components for tenant
 */
export async function getSalaryComponents(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { type, category } = req.query;

    const whereClause: any = {
      tenantId,
    };

    if (type) {
      whereClause.type = type;
    }

    if (category) {
      whereClause.category = category;
    }

    const components = await SalaryComponent.findAll({
      where: whereClause,
      order: [["name", "ASC"]],
    });

    res.json({ components });
  } catch (error: any) {
    logger.error("Get salary components error:", error);
    res.status(500).json({ error: "Failed to get salary components" });
  }
}

/**
 * Get single salary component
 */
export async function getSalaryComponent(
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

    const component = await SalaryComponent.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!component) {
      res.status(404).json({ error: "Salary component not found" });
      return;
    }

    res.json({ component });
  } catch (error: any) {
    logger.error("Get salary component error:", error);
    res.status(500).json({ error: "Failed to get salary component" });
  }
}

/**
 * Create new salary component
 */
export async function createSalaryComponent(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const {
      name,
      code,
      type,
      category,
      calculationType,
      defaultAmount,
      percentageOf,
      percentageValue,
      isTaxable,
      isStatutory,
      statutoryType,
      isActive,
      displayOrder,
    } = req.body;

    // Check if code already exists for this tenant
    if (code) {
      const existing = await SalaryComponent.findOne({
        where: {
          code,
          tenantId,
        },
      });

      if (existing) {
        res.status(400).json({ error: "Salary component code already exists" });
        return;
      }
    }

    const component = await SalaryComponent.create({
      tenantId,
      name,
      code,
      type,
      category,
      calculationType: calculationType || "fixed",
      defaultAmount: defaultAmount || null,
      percentageOf: percentageOf || null,
      percentageValue: percentageValue || null,
      isTaxable: isTaxable ?? true,
      isStatutory: isStatutory ?? false,
      statutoryType: statutoryType || null,
      isActive: isActive ?? true,
      displayOrder: displayOrder || 0,
      createdBy: req.user.id,
    });

    res.status(201).json({ component });
  } catch (error: any) {
    logger.error("Create salary component error:", error);
    res.status(500).json({ error: "Failed to create salary component" });
  }
}

/**
 * Update salary component
 */
export async function updateSalaryComponent(
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
    const {
      name,
      code,
      type,
      category,
      calculationType,
      defaultAmount,
      percentageOf,
      percentageValue,
      isTaxable,
      isStatutory,
      statutoryType,
      isActive,
      displayOrder,
    } = req.body;

    const component = await SalaryComponent.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!component) {
      res.status(404).json({ error: "Salary component not found" });
      return;
    }

    // Check if code already exists for another component
    if (code && code !== component.code) {
      const existing = await SalaryComponent.findOne({
        where: {
          code,
          tenantId,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        res.status(400).json({ error: "Salary component code already exists" });
        return;
      }
    }

    await component.update({
      name,
      code,
      type,
      category,
      calculationType,
      defaultAmount,
      percentageOf,
      percentageValue,
      isTaxable,
      isStatutory,
      statutoryType,
      isActive,
      displayOrder,
      updatedBy: req.user.id,
    });

    res.json({ component });
  } catch (error: any) {
    logger.error("Update salary component error:", error);
    res.status(500).json({ error: "Failed to update salary component" });
  }
}

/**
 * Delete salary component
 */
export async function deleteSalaryComponent(
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

    const component = await SalaryComponent.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!component) {
      res.status(404).json({ error: "Salary component not found" });
      return;
    }

    // Check if component is in use
    const inUse = await EmployeeSalaryComponent.findOne({
      where: {
        salaryComponentId: id,
      },
    });

    if (inUse) {
      res.status(400).json({
        error: "Cannot delete salary component that is assigned to employees",
      });
      return;
    }

    await component.destroy();

    res.json({ message: "Salary component deleted successfully" });
  } catch (error: any) {
    logger.error("Delete salary component error:", error);
    res.status(500).json({ error: "Failed to delete salary component" });
  }
}

