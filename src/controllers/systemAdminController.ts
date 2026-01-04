/**
 * System Admin Controller
 * Handles system-wide administration tasks
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Tenant, User, Employee, PayrollPeriod, Expense } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import bcrypt from "bcryptjs";

/**
 * Get all tenants with statistics
 */
export async function getAllTenants(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { page = 1, limit = 30, search, isActive } = req.query;

    const whereClause: any = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { slug: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === "true";
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: tenants } = await Tenant.findAndCountAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
      limit: Number(limit),
      offset,
    });

    // Get statistics for each tenant
    const tenantsWithStats = await Promise.all(
      tenants.map(async (tenant) => {
        const [userCount, employeeCount, payrollPeriodCount, expenseCount] =
          await Promise.all([
            User.count({ where: { tenantId: tenant.id } }),
            Employee.count({ where: { tenantId: tenant.id } }),
            PayrollPeriod.count({ where: { tenantId: tenant.id } }),
            Expense.count({ where: { tenantId: tenant.id } }),
          ]);

        return {
          ...tenant.toJSON(),
          stats: {
            users: userCount,
            employees: employeeCount,
            payrollPeriods: payrollPeriodCount,
            expenses: expenseCount,
          },
        };
      })
    );

    res.json({
      tenants: tenantsWithStats,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error: any) {
    logger.error("Get all tenants error:", error);
    res.status(500).json({ error: "Failed to get tenants" });
  }
}

/**
 * Get single tenant with detailed information
 */
export async function getTenant(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    // Get detailed statistics
    const [
      userCount,
      employeeCount,
      activeEmployeeCount,
      payrollPeriodCount,
      expenseCount,
    ] = await Promise.all([
      User.count({ where: { tenantId: tenant.id, isSystemAdmin: false } }),
      Employee.count({ where: { tenantId: tenant.id } }),
      Employee.count({
        where: { tenantId: tenant.id, status: "active" },
      }),
      PayrollPeriod.count({ where: { tenantId: tenant.id } }),
      Expense.count({ where: { tenantId: tenant.id } }),
    ]);

    // Note: totalPayrollAmount would need to join with Payroll table for accurate total
    const totalPayrollAmount = 0;

    res.json({
      tenant: tenant.toJSON(),
      stats: {
        users: userCount,
        employees: employeeCount,
        activeEmployees: activeEmployeeCount,
        payrollPeriods: payrollPeriodCount,
        expenses: expenseCount,
        totalPayrollAmount: totalPayrollAmount || 0,
      },
    });
  } catch (error: any) {
    logger.error("Get tenant error:", error);
    res.status(500).json({ error: "Failed to get tenant" });
  }
}

/**
 * Create new tenant
 */
export async function createTenant(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const {
      name,
      slug,
      email,
      phone,
      address,
      logoUrl,
      settings,
      isActive = true,
    } = req.body;

    if (!name || !slug || !email) {
      res.status(400).json({
        error: "Name, slug, and email are required",
      });
      return;
    }

    // Check if slug already exists
    const existingTenant = await Tenant.findOne({ where: { slug } });
    if (existingTenant) {
      res.status(409).json({ error: "Tenant with this slug already exists" });
      return;
    }

    const tenant = await Tenant.create({
      name,
      slug,
      email,
      phone: phone || null,
      address: address || null,
      logoUrl: logoUrl || null,
      settings: settings || {},
      isActive,
    });

    res.status(201).json({ tenant });
  } catch (error: any) {
    logger.error("Create tenant error:", error);
    res.status(500).json({ error: "Failed to create tenant" });
  }
}

/**
 * Update tenant
 */
export async function updateTenant(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      address,
      logoUrl,
      settings,
      isActive,
    } = req.body;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    // Update fields
    if (name !== undefined) tenant.name = name;
    if (email !== undefined) tenant.email = email;
    if (phone !== undefined) tenant.phone = phone;
    if (address !== undefined) tenant.address = address;
    if (logoUrl !== undefined) tenant.logoUrl = logoUrl;
    if (settings !== undefined) tenant.settings = settings;
    if (isActive !== undefined) tenant.isActive = isActive;

    await tenant.save();

    res.json({ tenant });
  } catch (error: any) {
    logger.error("Update tenant error:", error);
    res.status(500).json({ error: "Failed to update tenant" });
  }
}

/**
 * Delete tenant (soft delete)
 */
export async function deleteTenant(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;

    const tenant = await Tenant.findByPk(id);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    // Soft delete by setting isActive to false
    tenant.isActive = false;
    await tenant.save();

    res.json({ message: "Tenant deactivated successfully" });
  } catch (error: any) {
    logger.error("Delete tenant error:", error);
    res.status(500).json({ error: "Failed to delete tenant" });
  }
}

/**
 * Reset tenant admin password
 */
export async function resetTenantAdminPassword(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { tenantId, userId, newPassword } = req.body;

    if (!tenantId || !userId || !newPassword) {
      res.status(400).json({
        error: "tenantId, userId, and newPassword are required",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        error: "Password must be at least 8 characters long",
      });
      return;
    }

    const user = await User.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password reset successfully" });
  } catch (error: any) {
    logger.error("Reset tenant admin password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
}

/**
 * Get tenant statistics
 */
export async function getTenantStats(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { tenantId } = req.params;

    const tenant = await Tenant.findByPk(tenantId);
    if (!tenant) {
      res.status(404).json({ error: "Tenant not found" });
      return;
    }

    const [
      userCount,
      employeeCount,
      activeEmployeeCount,
      payrollPeriodCount,
      expenseCount,
      recentPayrollPeriods,
    ] = await Promise.all([
      User.count({ where: { tenantId } }),
      Employee.count({ where: { tenantId } }),
      Employee.count({ where: { tenantId, status: "active" } }),
      PayrollPeriod.count({ where: { tenantId } }),
      Expense.count({ where: { tenantId } }),
      PayrollPeriod.findAll({
        where: { tenantId },
        order: [["createdAt", "DESC"]],
        limit: 5,
      }),
    ]);

    res.json({
      tenant: tenant.toJSON(),
      stats: {
        users: userCount,
        employees: employeeCount,
        activeEmployees: activeEmployeeCount,
        payrollPeriods: payrollPeriodCount,
        expenses: expenseCount,
        recentPayrollPeriods: recentPayrollPeriods.map((p) => p.toJSON()),
      },
    });
  } catch (error: any) {
    logger.error("Get tenant stats error:", error);
    res.status(500).json({ error: "Failed to get tenant statistics" });
  }
}

/**
 * Get system-wide statistics
 */
export async function getSystemStats(
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalEmployees,
      totalPayrollPeriods,
      totalExpenses,
    ] = await Promise.all([
      Tenant.count(),
      Tenant.count({ where: { isActive: true } }),
      User.count({ where: { isSystemAdmin: false } }),
      Employee.count(),
      PayrollPeriod.count(),
      Expense.count(),
    ]);

    res.json({
      stats: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          inactive: totalTenants - activeTenants,
        },
        users: totalUsers,
        employees: totalEmployees,
        payrollPeriods: totalPayrollPeriods,
        expenses: totalExpenses,
      },
    });
  } catch (error: any) {
    logger.error("Get system stats error:", error);
    res.status(500).json({ error: "Failed to get system statistics" });
  }
}

