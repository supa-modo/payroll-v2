/**
 * Seed Roles and Permissions
 * Creates default system roles and all permissions
 */

import { sequelize } from "../config/database";
import { Role, Permission, RolePermission, User, UserRole } from "../models";
import logger from "../utils/logger";

const defaultRoles = [
  {
    name: "super_admin",
    displayName: "Super Administrator",
    description: "Full system access",
    isSystemRole: true,
  },
  {
    name: "admin",
    displayName: "Administrator",
    description: "Tenant administration and finance management",
    isSystemRole: true,
  },
  {
    name: "hr_officer",
    displayName: "HR Officer",
    description: "Staff management and salary structures",
    isSystemRole: true,
  },
  {
    name: "department_manager",
    displayName: "Department Manager",
    description: "Team expense approval and oversight",
    isSystemRole: true,
  },
  {
    name: "employee",
    displayName: "Employee",
    description: "Self-service access",
    isSystemRole: true,
  },
];

const permissions = [
  // Employee Management
  { name: "employee:create", displayName: "Create Employees", category: "employees" },
  { name: "employee:read", displayName: "View Employees", category: "employees" },
  { name: "employee:update", displayName: "Update Employees", category: "employees" },
  { name: "employee:delete", displayName: "Delete Employees", category: "employees" },
  { name: "employee:read:self", displayName: "View Own Profile", category: "employees" },
  { name: "employee:update:self", displayName: "Update Own Profile", category: "employees" },

  // Payroll
  { name: "payroll:process", displayName: "Process Payroll", category: "payroll" },
  { name: "payroll:approve", displayName: "Approve Payroll", category: "payroll" },
  { name: "payroll:view", displayName: "View Payroll", category: "payroll" },
  { name: "payroll:export", displayName: "Export Payroll Data", category: "payroll" },
  { name: "payslip:view:self", displayName: "View Own Payslips", category: "payroll" },

  // Salary Structure
  { name: "salary:configure", displayName: "Configure Salary Components", category: "salary" },
  { name: "salary:assign", displayName: "Assign Salary to Employees", category: "salary" },
  { name: "salary:view", displayName: "View Salary Information", category: "salary" },

  // Expenses
  { name: "expense:submit", displayName: "Submit Expenses", category: "expenses" },
  { name: "expense:approve", displayName: "Approve Expenses", category: "expenses" },
  { name: "expense:approve:department", displayName: "Approve Department Expenses", category: "expenses" },
  { name: "expense:view", displayName: "View All Expenses", category: "expenses" },
  { name: "expense:view:self", displayName: "View Own Expenses", category: "expenses" },
  { name: "expense:pay", displayName: "Mark Expenses as Paid", category: "expenses" },

  // Reports
  { name: "report:payroll", displayName: "Access Payroll Reports", category: "reports" },
  { name: "report:expense", displayName: "Access Expense Reports", category: "reports" },
  { name: "report:export", displayName: "Export Reports", category: "reports" },

  // Settings
  { name: "settings:manage", displayName: "Manage System Settings", category: "settings" },
  { name: "department:manage", displayName: "Manage Departments", category: "settings" },
  { name: "category:manage", displayName: "Manage Expense Categories", category: "settings" },

  // Audit
  { name: "audit:view", displayName: "View Audit Logs", category: "audit" },
];

// Permission assignments for each role
const rolePermissions: Record<string, string[]> = {
  super_admin: permissions.map((p) => p.name), // All permissions
  admin: [
    "employee:create",
    "employee:read",
    "employee:update",
    "employee:delete",
    "payroll:process",
    "payroll:approve",
    "payroll:view",
    "payroll:export",
    "salary:configure",
    "salary:assign",
    "salary:view",
    "expense:view",
    "expense:approve",
    "expense:pay",
    "report:payroll",
    "report:expense",
    "report:export",
    "settings:manage",
    "department:manage",
    "category:manage",
    "audit:view",
  ],
  hr_officer: [
    "employee:create",
    "employee:read",
    "employee:update",
    "employee:delete",
    "salary:configure",
    "salary:assign",
    "salary:view",
    "payroll:view",
    "report:payroll",
    "department:manage",
  ],
  department_manager: [
    "employee:read",
    "expense:view",
    "expense:approve:department",
    "report:expense",
  ],
  employee: [
    "employee:read:self",
    "employee:update:self",
    "expense:submit",
    "expense:view:self",
    "payslip:view:self",
  ],
};

async function seedRolesAndPermissions(): Promise<void> {
  try {
    logger.info("Starting roles and permissions seed...");

    // Create roles
    logger.info("Creating roles...");
    const createdRoles: Record<string, Role> = {};

    for (const roleData of defaultRoles) {
      const [role, created] = await Role.findOrCreate({
        where: {
          name: roleData.name,
          tenantId: null, // System roles have null tenantId
        },
        defaults: {
          ...roleData,
          tenantId: null,
        },
      });

      createdRoles[roleData.name] = role;
      logger.info(`${created ? "Created" : "Found"} role: ${roleData.name}`);
    }

    // Create permissions
    logger.info("Creating permissions...");
    const createdPermissions: Record<string, Permission> = {};

    for (const permData of permissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: {
          name: permData.name,
        },
        defaults: permData,
      });

      createdPermissions[permData.name] = permission;
      logger.info(`${created ? "Created" : "Found"} permission: ${permData.name}`);
    }

    // Assign permissions to roles
    logger.info("Assigning permissions to roles...");
    for (const [roleName, permissionNames] of Object.entries(rolePermissions)) {
      const role = createdRoles[roleName];
      if (!role) {
        logger.warn(`Role ${roleName} not found, skipping permission assignment`);
        continue;
      }

      // Get existing permissions for this role
      const existingRolePermissions = await RolePermission.findAll({
        where: {
          roleId: role.id,
        },
      });

      const existingPermissionIds = new Set(
        existingRolePermissions.map((rp) => rp.permissionId)
      );

      // Assign new permissions
      for (const permName of permissionNames) {
        const permission = createdPermissions[permName];
        if (!permission) {
          logger.warn(`Permission ${permName} not found, skipping`);
          continue;
        }

        if (!existingPermissionIds.has(permission.id)) {
          await RolePermission.create({
            roleId: role.id,
            permissionId: permission.id,
          });
          logger.info(`Assigned permission ${permName} to role ${roleName}`);
        }
      }
    }

    // Assign admin role to existing admin users
    logger.info("Assigning admin role to existing admin users...");
    const adminRole = createdRoles["admin"];
    if (adminRole) {
      const adminUsers = await User.findAll({
        where: {
          role: "admin",
        },
      });

      for (const user of adminUsers) {
        const existingUserRole = await UserRole.findOne({
          where: {
            userId: user.id,
            roleId: adminRole.id,
          },
        });

        if (!existingUserRole) {
          // Use a special UUID for global (non-department-scoped) roles
          // The schema uses COALESCE with a default UUID, but we'll use a known value
          const globalDepartmentId = "00000000-0000-0000-0000-000000000000";
          await UserRole.create({
            userId: user.id,
            roleId: adminRole.id,
            departmentId: globalDepartmentId,
            assignedBy: null, // System assignment
          });
          logger.info(`Assigned admin role to user: ${user.email}`);
        }
      }
    }

    logger.info("Roles and permissions seed completed successfully!");
  } catch (error: any) {
    logger.error("Error seeding roles and permissions:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  sequelize
    .authenticate()
    .then(() => {
      logger.info("Database connection established");
      return seedRolesAndPermissions();
    })
    .then(() => {
      logger.info("Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Seed failed:", error);
      process.exit(1);
    });
}

export default seedRolesAndPermissions;

