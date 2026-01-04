import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Expense from "./Expense";
import User from "./User";

interface ExpenseApprovalAttributes {
  id: string;
  expenseId: string;
  approvalLevel: string;
  approverId: string;
  action: string;
  comments?: string | null;
  actedAt: Date;
}

interface ExpenseApprovalCreationAttributes
  extends Optional<
    ExpenseApprovalAttributes,
    "id" | "comments" | "actedAt"
  > {}

class ExpenseApproval
  extends Model<ExpenseApprovalAttributes, ExpenseApprovalCreationAttributes>
  implements ExpenseApprovalAttributes
{
  declare id: string;
  declare expenseId: string;
  declare approvalLevel: string;
  declare approverId: string;
  declare action: string;
  declare comments: string | null | undefined;
  declare actedAt: Date;
}

ExpenseApproval.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    expenseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "expense_id",
      references: {
        model: Expense,
        key: "id",
      },
    },
    approvalLevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "approval_level",
    },
    approverId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "approver_id",
      references: {
        model: User,
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["approved", "rejected", "returned"]],
      },
    },
    comments: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    actedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "acted_at",
    },
  },
  {
    sequelize,
    tableName: "expense_approvals",
    modelName: "ExpenseApproval",
    timestamps: false,
    indexes: [
      {
        fields: ["expense_id"],
        name: "idx_expense_approvals_expense",
      },
    ],
  }
);

export default ExpenseApproval;

