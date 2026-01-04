/**
 * Seed Roles and Permissions
 * Creates default roles and permissions for the system
 */

import { Role, Permission, RolePermission } from "../models";
import { sequelize } from "../config/database";
import logger from "../utils/logger";

/**
 * Default permissions for the system
 */
const DEFAULT_PERMISSIONS = [
  // Employee permissions
  { name: "employee:read", displayName: "View Employees", description: "View employee information" },
  { name: "employee:create", displayName: "Create Employees", description: "Create new employees" },
  { name: "employee:update", displayName: "Update Employees", description: "Update employee information" },
  { name: "employee:delete", displayName: "Delete Employees", description: "Delete employees" },

  // Department permissions
  { name: "department:read", displayName: "View Departments", description: "View department information" },
  { name: "department:create", displayName: "Create Departments", description: "Create new departments" },
  { name: "department:update", displayName: "Update Departments", description: "Update department information" },
  { name: "department:delete", displayName: "Delete Departments", description: "Delete departments" },

  // Payroll permissions
  { name: "payroll:read", displayName: "View Payroll", description: "View payroll information" },
  { name: "payroll:create", displayName: "Create Payroll Periods", description: "Create new payroll periods" },
  { name: "payroll:update", displayName: "Update Payroll", description: "Update payroll information" },
  { name: "payroll:process", displayName: "Process Payroll", description: "Process payroll calculations" },
  { name: "payroll:approve", displayName: "Approve Payroll", description: "Approve payroll periods" },
  { name: "payroll:lock", displayName: "Lock Payroll", description: "Lock payroll periods" },

  // Salary permissions
  { name: "salary:read", displayName: "View Salary", description: "View salary information" },
  { name: "salary:create", displayName: "Create Salary Components", description: "Create salary components" },
  { name: "salary:update", displayName: "Update Salary", description: "Update salary information" },
  { name: "salary:delete", displayName: "Delete Salary Components", description: "Delete salary components" },

  // Expense permissions
  { name: "expense:read", displayName: "View Expenses", description: "View expense information" },
  { name: "expense:create", displayName: "Create Expenses", description: "Submit expenses" },
  { name: "expense:update", displayName: "Update Expenses", description: "Update expense information" },
  { name: "expense:approve", displayName: "Approve Expenses", description: "Approve expense requests" },
  { name: "expense:delete", displayName: "Delete Expenses", description: "Delete expenses" },

  // Loan permissions
  { name: "loan:read", displayName: "View Loans", description: "View loan information" },
  { name: "loan:create", displayName: "Create Loans", description: "Create new loans" },
  { name: "loan:update", displayName: "Update Loans", description: "Update loan information" },
  { name: "loan:approve", displayName: "Approve Loans", description: "Approve loan requests" },

  // Report permissions
  { name: "reports:view:payroll", displayName: "View Payroll Reports", description: "View payroll reports" },
  { name: "reports:view:expenses", displayName: "View Expense Reports", description: "View expense reports" },
  { name: "reports:export", displayName: "Export Reports", description: "Export reports to various formats" },

  // Admin permissions
  { name: "admin:users", displayName: "Manage Users", description: "Manage user accounts" },
  { name: "admin:roles", displayName: "Manage Roles", description: "Manage roles and permissions" },
  { name: "admin:settings", displayName: "Manage Settings", description: "Manage system settings" },
];

/**
 * Role definitions with their permissions
 */
const ROLE_DEFINITIONS = [
  {
    name: "Admin",
    displayName: "Administrator",
    description: "Full system access with all permissions",
    isSystemRole: true,
    permissions: DEFAULT_PERMISSIONS.map((p) => p.name), // All permissions
  },
  {
    name: "HR Manager",
    displayName: "HR Manager",
    description: "Human Resources management",
    isSystemRole: true,
    permissions: [
      "employee:read",
      "employee:create",
      "employee:update",
      "department:read",
      "department:create",
      "department:update",
      "salary:read",
      "salary:create",
      "salary:update",
      "reports:view:payroll",
      "reports:view:expenses",
    ],
  },
  {
    name: "Payroll Manager",
    displayName: "Payroll Manager",
    description: "Payroll processing and management",
    isSystemRole: true,
    permissions: [
      "employee:read",
      "payroll:read",
      "payroll:create",
      "payroll:update",
      "payroll:process",
      "payroll:approve",
      "payroll:lock",
      "salary:read",
      "salary:update",
      "reports:view:payroll",
      "reports:export",
    ],
  },
  {
    name: "Finance Manager",
    displayName: "Finance Manager",
    description: "Financial management and approvals",
    isSystemRole: true,
    permissions: [
      "expense:read",
      "expense:approve",
      "payroll:read",
      "payroll:approve",
      "loan:read",
      "loan:approve",
      "reports:view:payroll",
      "reports:view:expenses",
      "reports:export",
    ],
  },
  {
    name: "Employee",
    displayName: "Employee",
    description: "Basic employee access",
    isSystemRole: true,
    permissions: [
      "employee:read", // Can view own profile
      "expense:read",
      "expense:create",
      "expense:update",
      "loan:read",
    ],
  },
];

/**
 * Seed system-wide roles and permissions
 */
export async function seedRolesAndPermissions(): Promise<void> {
  try {
    logger.info("Seeding roles and permissions...");

    // Create all permissions (system-wide, tenantId = null)
    const createdPermissions: Map<string, Permission> = new Map();

    for (const permData of DEFAULT_PERMISSIONS) {
      const [permission] = await Permission.findOrCreate({
        where: {
          name: permData.name,
        },
        defaults: {
          name: permData.name,
          displayName: permData.displayName,
          description: permData.description,
          category: permData.name.split(":")[0] || "general",
        },
      });
      createdPermissions.set(permData.name, permission);
    }

    logger.info(`Created/found ${createdPermissions.size} permissions`);

    // Create system roles
    for (const roleData of ROLE_DEFINITIONS) {
      const [role] = await Role.findOrCreate({
        where: {
          name: roleData.name,
          tenantId: null,
          isSystemRole: true,
        },
        defaults: {
          name: roleData.name,
          displayName: roleData.displayName,
          description: roleData.description,
          tenantId: null,
          isSystemRole: true,
        },
      });

      // Assign permissions to role
      for (const permissionName of roleData.permissions) {
        const permission = createdPermissions.get(permissionName);
        if (permission) {
          await RolePermission.findOrCreate({
            where: {
              roleId: role.id,
              permissionId: permission.id,
            },
            defaults: {
              roleId: role.id,
              permissionId: permission.id,
            },
          });
        }
      }

      logger.info(`Created/found role: ${roleData.name} with ${roleData.permissions.length} permissions`);
    }

    logger.info("Roles and permissions seeded successfully");
  } catch (error: any) {
    logger.error("Error seeding roles and permissions:", error);
    throw error;
  }
}

/**
 * Create tenant-specific Admin role based on system Admin role
 */
export async function createTenantAdminRole(tenantId: string): Promise<Role> {
  const transaction = await sequelize.transaction();
  try {
    // Find system Admin role
    const systemAdminRole = await Role.findOne({
      where: {
        name: "Admin",
        tenantId: null,
        isSystemRole: true,
      },
      transaction,
    });

    if (!systemAdminRole) {
      // If system Admin role doesn't exist, create it first
      await seedRolesAndPermissions();
      const refreshedSystemAdminRole = await Role.findOne({
        where: {
          name: "Admin",
          tenantId: null,
          isSystemRole: true,
        },
        transaction,
      });
      if (!refreshedSystemAdminRole) {
        throw new Error("Failed to create system Admin role");
      }
      // Get all permissions (permissions are system-wide, no tenantId)
      const allPermissions = await Permission.findAll({
        transaction,
      });

      // Create tenant-specific Admin role
      const tenantAdminRole = await Role.create(
        {
          name: "Admin",
          displayName: "Administrator",
          description: "Full system access for this tenant",
          tenantId,
          isSystemRole: false,
        },
        { transaction }
      );

      // Assign all permissions to tenant Admin role
      for (const permission of allPermissions) {
        await RolePermission.create(
          {
            roleId: tenantAdminRole.id,
            permissionId: permission.id,
          },
          { transaction }
        );
      }

      await transaction.commit();
      logger.info(`Created tenant Admin role for tenant ${tenantId}`);
      return tenantAdminRole;
    }

      // Get all permissions (system Admin should have all)
      const allPermissions = await Permission.findAll({
        transaction,
      });

    // Create tenant-specific Admin role
    const [tenantAdminRole] = await Role.findOrCreate({
      where: {
        name: "Admin",
        tenantId,
        isSystemRole: false,
      },
      defaults: {
        name: "Admin",
        displayName: "Administrator",
        description: "Full system access for this tenant",
        tenantId,
        isSystemRole: false,
      },
      transaction,
    });

    // Assign all permissions to tenant Admin role
    for (const permission of allPermissions) {
      await RolePermission.findOrCreate({
        where: {
          roleId: tenantAdminRole.id,
          permissionId: permission.id,
        },
        defaults: {
          roleId: tenantAdminRole.id,
          permissionId: permission.id,
        },
        transaction,
      });
    }

    await transaction.commit();
    logger.info(`Created tenant Admin role for tenant ${tenantId}`);
    return tenantAdminRole;
  } catch (error: any) {
    await transaction.rollback();
    logger.error("Error creating tenant Admin role:", error);
    throw error;
  }
}

