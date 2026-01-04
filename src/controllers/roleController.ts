/**
 * Role Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Role, Permission, RolePermission } from "../models";
import { Op } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import { clearUserCache } from "../middleware/rbac";

/**
 * Get all roles for tenant
 */
export async function getRoles(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const roles = await Role.findAll({
      where: {
        [Op.or]: [
          { tenantId: null }, // System roles
          { tenantId }, // Tenant-specific roles
        ],
      },
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    res.json({ roles });
  } catch (error: any) {
    logger.error("Get roles error:", error);
    res.status(500).json({ error: "Failed to get roles" });
  }
}

/**
 * Get single role with permissions
 */
export async function getRole(
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

    const role = await Role.findOne({
      where: {
        id,
        [Op.or]: [
          { tenantId: null },
          { tenantId },
        ],
      },
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
          required: false,
        },
      ],
    });

    if (!role) {
      res.status(404).json({ error: "Role not found" });
      return;
    }

    res.json({ role });
  } catch (error: any) {
    logger.error("Get role error:", error);
    res.status(500).json({ error: "Failed to get role" });
  }
}

/**
 * Create new role
 */
export async function createRole(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { name, displayName, description } = req.body;

    // Check for duplicate name
    const existing = await Role.findOne({
      where: {
        tenantId,
        name,
      },
    });

    if (existing) {
      res.status(409).json({ error: "Role with this name already exists" });
      return;
    }

    const role = await Role.create({
      tenantId,
      name,
      displayName,
      description,
      isSystemRole: false,
    });

    const createdRole = await Role.findByPk(role.id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
          required: false,
        },
      ],
    });

    res.status(201).json({ role: createdRole });
  } catch (error: any) {
    logger.error("Create role error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ error: "Role with this name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create role" });
  }
}

/**
 * Update role
 */
export async function updateRole(
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
    const { displayName, description } = req.body;

    const role = await Role.findOne({
      where: {
        id,
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

    // Prevent updating system roles
    if (role.isSystemRole) {
      res.status(403).json({ error: "Cannot update system role" });
      return;
    }

    // Prevent updating tenant-specific roles from other tenants
    if (role.tenantId && role.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await role.update({
      displayName: displayName || role.displayName,
      description: description !== undefined ? description : role.description,
    });

    const updatedRole = await Role.findByPk(role.id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
          required: false,
        },
      ],
    });

    res.json({ role: updatedRole });
  } catch (error: any) {
    logger.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
}

/**
 * Delete role
 */
export async function deleteRole(
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

    const role = await Role.findOne({
      where: {
        id,
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

    // Prevent deleting system roles
    if (role.isSystemRole) {
      res.status(403).json({ error: "Cannot delete system role" });
      return;
    }

    // Prevent deleting tenant-specific roles from other tenants
    if (role.tenantId && role.tenantId !== tenantId) {
      res.status(403).json({ error: "Access denied" });
      return;
    }

    await role.destroy();

    res.json({ message: "Role deleted successfully" });
  } catch (error: any) {
    logger.error("Delete role error:", error);
    res.status(500).json({ error: "Failed to delete role" });
  }
}

/**
 * Assign permissions to role
 */
export async function assignPermissions(
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
    const { permissionIds } = req.body;

    if (!Array.isArray(permissionIds)) {
      res.status(400).json({ error: "permissionIds must be an array" });
      return;
    }

    const role = await Role.findOne({
      where: {
        id,
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

    // Verify all permissions exist
    const permissions = await Permission.findAll({
      where: {
        id: {
          [Op.in]: permissionIds,
        },
      },
    });

    if (permissions.length !== permissionIds.length) {
      res.status(400).json({ error: "One or more permissions not found" });
      return;
    }

    // Remove existing permissions
    await RolePermission.destroy({
      where: {
        roleId: id,
      },
    });

    // Add new permissions
    await RolePermission.bulkCreate(
      permissionIds.map((permissionId: string) => ({
        roleId: id,
        permissionId,
      }))
    );

    // Clear cache for all users with this role
    clearUserCache("", tenantId);

    const updatedRole = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
          required: false,
        },
      ],
    });

    res.json({ role: updatedRole });
  } catch (error: any) {
    logger.error("Assign permissions error:", error);
    res.status(500).json({ error: "Failed to assign permissions" });
  }
}

/**
 * Remove permission from role
 */
export async function removePermission(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id, permissionId } = req.params;

    const role = await Role.findOne({
      where: {
        id,
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

    await RolePermission.destroy({
      where: {
        roleId: id,
        permissionId,
      },
    });

    // Clear cache
    clearUserCache("", tenantId);

    const updatedRole = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: "permissions",
          through: {
            attributes: [],
          },
          required: false,
        },
      ],
    });

    res.json({ role: updatedRole });
  } catch (error: any) {
    logger.error("Remove permission error:", error);
    res.status(500).json({ error: "Failed to remove permission" });
  }
}

