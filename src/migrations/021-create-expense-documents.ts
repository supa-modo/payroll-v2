/**
 * Migration: Create Expense Documents Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expense_documents'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("expense_documents", {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      expense_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "expenses", key: "id" },
        onDelete: "CASCADE",
      },
      document_type: {
        type: DataTypes.STRING(20),
        defaultValue: "receipt",
        allowNull: false,
      },
      file_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING(512),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
      },
    });

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_expense_documents_expense" 
        ON "expense_documents" ("expense_id");
      `);
    } catch (error: any) {
      if (error?.code !== "42P01" && !error?.message?.includes("already exists")) {
        throw error;
      }
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expense_documents'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("expense_documents");
  }
}


