import { DataTypes, QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable("salary_reliefs", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "tenants", key: "id" },
      onDelete: "CASCADE",
    },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    relief_type: { type: DataTypes.STRING(30), allowNull: false },
    calculation_type: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "fixed" },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    percentage_value: { type: DataTypes.DECIMAL(8, 4), allowNull: true },
    max_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    min_amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    is_mandatory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    country: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "Kenya" },
    effective_from: { type: DataTypes.DATEONLY, allowNull: false },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    config: { type: DataTypes.JSONB, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.createTable("employee_salary_reliefs", {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    employee_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "employees", key: "id" },
      onDelete: "CASCADE",
    },
    salary_relief_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: "salary_reliefs", key: "id" },
      onDelete: "CASCADE",
    },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    effective_from: { type: DataTypes.DATEONLY, allowNull: false },
    effective_to: { type: DataTypes.DATEONLY, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  });

  await queryInterface.sequelize.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS "unique_salary_relief_code_effective" ON "salary_reliefs" ("tenant_id","code","effective_from");`
  );
  await queryInterface.sequelize.query(
    `CREATE UNIQUE INDEX IF NOT EXISTS "unique_employee_salary_relief" ON "employee_salary_reliefs" ("employee_id","salary_relief_id","effective_from");`
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable("employee_salary_reliefs");
  await queryInterface.dropTable("salary_reliefs");
}
