import { QueryInterface, DataTypes } from "sequelize";

async function addColumnIfMissing(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string,
  definition: any
): Promise<void> {
  const table = await queryInterface.describeTable(tableName);
  if (!table[columnName]) {
    await queryInterface.addColumn(tableName, columnName, definition);
  }
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  await addColumnIfMissing(queryInterface, "payrolls", "shif_amount", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "payrolls", "housing_levy_amount", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "payrolls", "taxable_income", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "payrolls", "personal_relief", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
  await addColumnIfMissing(queryInterface, "payrolls", "insurance_relief", {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const table = await queryInterface.describeTable("payrolls");
  const columns = [
    "insurance_relief",
    "personal_relief",
    "taxable_income",
    "housing_levy_amount",
    "shif_amount",
  ];
  for (const column of columns) {
    if (table[column]) {
      await queryInterface.removeColumn("payrolls", column);
    }
  }
}
