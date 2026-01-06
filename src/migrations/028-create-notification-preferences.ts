/**
 * Migration: Create Notification Preferences Table
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_preferences'
    );
  `);

  if (!(tableExists[0][0] as any).exists) {
    await queryInterface.createTable("notification_preferences", {
      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      email_payslip: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      email_expense_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      email_approval_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      inapp_payslip: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      inapp_expense_status: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      inapp_approval_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notification_preferences'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    await queryInterface.dropTable("notification_preferences");
  }
}

