import { QueryInterface } from "sequelize";

const EXPENSE_PERMISSIONS = [
  "expense:view",
  "expense:view:self",
  "expense:submit",
  "expense:pay",
  "expense:delete",
];

const EMPLOYEE_DEFAULT_PERMISSIONS = [
  "employee:read:self",
  "employee:update:self",
  "expense:submit",
  "expense:view:self",
  "payslip:view:self",
];

async function tableExists(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const [results] = await queryInterface.sequelize.query(
    `
    SELECT to_regclass(:tableName) IS NOT NULL AS exists;
    `,
    {
      replacements: { tableName },
    }
  );

  const rows = results as Array<{ exists: boolean }>;
  return rows.length > 0 && rows[0].exists === true;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const hasPermissions = await tableExists(queryInterface, "permissions");
  const hasRoles = await tableExists(queryInterface, "roles");
  const hasRolePermissions = await tableExists(queryInterface, "role_permissions");

  // If the core RBAC tables are missing, skip gracefully to keep migration repeat-safe.
  if (!hasPermissions || !hasRoles || !hasRolePermissions) {
    return;
  }

  for (const permissionName of EXPENSE_PERMISSIONS) {
    await queryInterface.sequelize.query(
      `
      INSERT INTO permissions (id, name, display_name, description, category, created_at, updated_at)
      SELECT gen_random_uuid(), :permissionName, :displayName, :description, 'expenses', NOW(), NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM permissions WHERE name = :permissionName
      );
      `,
      {
        replacements: {
          permissionName,
          displayName: permissionName.replace("expense:", "Expense ").replace(/:/g, " "),
          description: `Permission ${permissionName}`,
        },
      }
    );
  }

  const [employeeRoles] = await queryInterface.sequelize.query(
    `
    SELECT id FROM roles WHERE lower(name) = 'employee';
    `
  );

  for (const row of employeeRoles as Array<{ id: string }>) {
    for (const permissionName of EMPLOYEE_DEFAULT_PERMISSIONS) {
      await queryInterface.sequelize.query(
        `
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT :roleId, p.id
        FROM permissions p
        WHERE p.name = :permissionName
          AND NOT EXISTS (
            SELECT 1
            FROM role_permissions rp
            WHERE rp.role_id = :roleId AND rp.permission_id = p.id
          );
        `,
        {
          replacements: {
            roleId: row.id,
            permissionName,
          },
        }
      );
    }
  }
}

export async function down(_queryInterface: QueryInterface): Promise<void> {
  // Intentionally no-op to avoid removing permissions from production roles.
}
