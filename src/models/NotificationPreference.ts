import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import User from "./User";

interface NotificationPreferenceAttributes {
  userId: string;
  emailPayslip: boolean;
  emailExpenseStatus: boolean;
  emailApprovalRequired: boolean;
  inappPayslip: boolean;
  inappExpenseStatus: boolean;
  inappApprovalRequired: boolean;
  updatedAt: Date;
}

interface NotificationPreferenceCreationAttributes
  extends Optional<
    NotificationPreferenceAttributes,
    "emailPayslip" | "emailExpenseStatus" | "emailApprovalRequired" | "inappPayslip" | "inappExpenseStatus" | "inappApprovalRequired" | "updatedAt"
  > {}

class NotificationPreference
  extends Model<NotificationPreferenceAttributes, NotificationPreferenceCreationAttributes>
  implements NotificationPreferenceAttributes
{
  declare userId: string;
  declare emailPayslip: boolean;
  declare emailExpenseStatus: boolean;
  declare emailApprovalRequired: boolean;
  declare inappPayslip: boolean;
  declare inappExpenseStatus: boolean;
  declare inappApprovalRequired: boolean;
  declare readonly updatedAt: Date;
}

NotificationPreference.init(
  {
    userId: {
      type: DataTypes.UUID,
      primaryKey: true,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    emailPayslip: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "email_payslip",
    },
    emailExpenseStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "email_expense_status",
    },
    emailApprovalRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "email_approval_required",
    },
    inappPayslip: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "inapp_payslip",
    },
    inappExpenseStatus: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "inapp_expense_status",
    },
    inappApprovalRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "inapp_approval_required",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "notification_preferences",
    modelName: "NotificationPreference",
    timestamps: false,
  }
);

export default NotificationPreference;

