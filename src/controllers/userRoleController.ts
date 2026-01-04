/**
 * UserRole Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { User, UserRole, Role, Department } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import { clearUserCache } from "../middleware/rbac";

/**
 * Get all roles for a user
 */
export async function getUserRoles(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { userId } = req.params;

    // Verify user belongs to same tenant
    const user = await User.findOne({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userRoles = await UserRole.findAll({
      where: {
        userId,
      },
      include: [
        {
          model: Role,
          as: "role",
          required: true,
        },
        {
          model: Department,
          as: "department",
          required: false,
        },
      ],
    });

    res.json({ userRoles });
  } catch (error: any) {
    logger.error("Get user roles error:", error);
    res.status(500).json({ error: "Failed to get user roles" });
  }
}

/**
 * Assign role to user
 */
export async function assignRole(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);

    const { userId } = req.params;
    const { roleId, departmentId } = req.body;

    // Verify user belongs to same tenant
    const user = await User.findOne({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify role exists and is accessible
    const role = await Role.findOne({
      where: {
        id: roleId,
        [Op.or]: [
          { tenantId: null },
          { tenantId },
        ],
      },
    });

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    // Verify department if provided
    if (departmentId) {
      const department = await Department.findOne({
        where: {
          id: departmentId,
          tenantId,
        },
      });

      if (!department) {
        res.status(404).json({ error: "Department not found" });
        return;
      }
    }

    // Check if role already assigned
    const existing = await UserRole.findOne({
      where: {
        userId,
        roleId,
        departmentId: departmentId || null,
      },
    });

    if (existing) {
      res.status(409).json({ error: "Role already assigned to user" });
      return;
    }

    const userRole = await UserRole.create({
      userId,
      roleId,
      departmentId: departmentId || null,
      assignedBy: req.user.id,
    });

    const createdUserRole = await UserRole.findByPk(userRole.userId, {
      include: [
        {
          model: Role,
          as: "role",
          required: true,
        },
        {
          model: Department,
          as: "department",
          required: false,
        },
      ],
    });

    // Clear cache for this user
    clearUserCache(userId, tenantId);

    res.status(201).json({ userRole: createdUserRole });
  } catch (error: any) {
    logger.error("Assign role error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ error: "Role already assigned to user" });
      return;
    }
    res.status(500).json({ error: "Failed to assign role" });
  }
}

/**
 * Remove role from user
 */
export async function removeRole(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);

    const { userId, roleId } = req.params;

    // Verify user belongs to same tenant
    const user = await User.findOne({
      where: {
        id: userId,
        tenantId,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userRole = await UserRole.findOne({
      where: {
        userId,
        roleId,
      },
    });

    if (!userRole) {
      res.status(404).json({ error: "Role assignment not found" });
      return;
    }

    await userRole.destroy();

    // Clear cache for this user
    clearUserCache(userId, tenantId);

    res.json({ message: "Role removed successfully" });
  } catch (error: any) {
    logger.error("Remove role error:", error);
    res.status(500).json({ error: "Failed to remove role" });
  }
}

