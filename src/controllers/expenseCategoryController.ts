/**
 * Expense Category Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { ExpenseCategory, Expense } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all expense categories for tenant
 */
export async function getExpenseCategories(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { isActive } = req.query;

    const whereClause: any = {
      tenantId,
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    const categories = await ExpenseCategory.findAll({
      where: whereClause,
      order: [["displayOrder", "ASC"], ["name", "ASC"]],
    });

    res.json({ categories });
  } catch (error: any) {
    logger.error("Get expense categories error:", error);
    res.status(500).json({ error: "Failed to get expense categories" });
  }
}

/**
 * Get single expense category
 */
export async function getExpenseCategory(
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

    const category = await ExpenseCategory.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!category) {
      res.status(404).json({ error: "Expense category not found" });
      return;
    }

    res.json({ category });
  } catch (error: any) {
    logger.error("Get expense category error:", error);
    res.status(500).json({ error: "Failed to get expense category" });
  }
}

/**
 * Create new expense category
 */
export async function createExpenseCategory(
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
      description,
      monthlyBudget,
      requiresReceipt,
      maxAmount,
      requiresManagerApproval,
      requiresFinanceApproval,
      autoApproveBelow,
      glAccountCode,
      isActive,
      displayOrder,
    } = req.body;

    // Check if code already exists for this tenant
    if (code) {
      const existing = await ExpenseCategory.findOne({
        where: {
          code,
          tenantId,
        },
      });

      if (existing) {
        res.status(400).json({ error: "Expense category code already exists" });
        return;
      }
    }

    const category = await ExpenseCategory.create({
      tenantId,
      name,
      code,
      description: description || null,
      monthlyBudget: monthlyBudget || null,
      requiresReceipt: requiresReceipt ?? true,
      maxAmount: maxAmount || null,
      requiresManagerApproval: requiresManagerApproval ?? true,
      requiresFinanceApproval: requiresFinanceApproval ?? true,
      autoApproveBelow: autoApproveBelow || null,
      glAccountCode: glAccountCode || null,
      isActive: isActive ?? true,
      displayOrder: displayOrder || 0,
      createdBy: req.user.id,
    });

    res.status(201).json({ category });
  } catch (error: any) {
    logger.error("Create expense category error:", error);
    res.status(500).json({ error: "Failed to create expense category" });
  }
}

/**
 * Update expense category
 */
export async function updateExpenseCategory(
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
      description,
      monthlyBudget,
      requiresReceipt,
      maxAmount,
      requiresManagerApproval,
      requiresFinanceApproval,
      autoApproveBelow,
      glAccountCode,
      isActive,
      displayOrder,
    } = req.body;

    const category = await ExpenseCategory.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!category) {
      res.status(404).json({ error: "Expense category not found" });
      return;
    }

    // Check if code already exists for another category
    if (code && code !== category.code) {
      const existing = await ExpenseCategory.findOne({
        where: {
          code,
          tenantId,
          id: { [Op.ne]: id },
        },
      });

      if (existing) {
        res.status(400).json({ error: "Expense category code already exists" });
        return;
      }
    }

    await category.update({
      name,
      code,
      description,
      monthlyBudget,
      requiresReceipt,
      maxAmount,
      requiresManagerApproval,
      requiresFinanceApproval,
      autoApproveBelow,
      glAccountCode,
      isActive,
      displayOrder,
      updatedBy: req.user.id,
    });

    res.json({ category });
  } catch (error: any) {
    logger.error("Update expense category error:", error);
    res.status(500).json({ error: "Failed to update expense category" });
  }
}

/**
 * Delete expense category
 */
export async function deleteExpenseCategory(
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

    const category = await ExpenseCategory.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!category) {
      res.status(404).json({ error: "Expense category not found" });
      return;
    }

    // Check if category is in use
    const inUse = await Expense.findOne({
      where: {
        categoryId: id,
      },
    });

    if (inUse) {
      res.status(400).json({
        error: "Cannot delete expense category that has associated expenses",
      });
      return;
    }

    await category.destroy();

    res.json({ message: "Expense category deleted successfully" });
  } catch (error: any) {
    logger.error("Delete expense category error:", error);
    res.status(500).json({ error: "Failed to delete expense category" });
  }
}

