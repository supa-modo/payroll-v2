import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import Employee from "./Employee";
import ExpenseCategory from "./ExpenseCategory";
import Department from "./Department";
import User from "./User";

interface ExpenseAttributes {
  id: string;
  tenantId: string;
  employeeId: string;
  categoryId: string;
  departmentId?: string | null;
  expenseNumber: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  exchangeRate: number;
  amountInBaseCurrency?: number | null;
  expenseDate: Date;
  status: string;
  submittedAt?: Date | null;
  rejectionReason?: string | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  paidAt?: Date | null;
  paidBy?: string | null;
  paymentReference?: string | null;
  paymentMethod?: string | null;
  hasReceipt: boolean;
  receiptVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
  deletedAt?: Date | null;
}

interface ExpenseCreationAttributes
  extends Optional<
    ExpenseAttributes,
    "id" | "departmentId" | "description" | "currency" | "exchangeRate" | "amountInBaseCurrency" | "status" | "submittedAt" | "rejectionReason" | "rejectedAt" | "rejectedBy" | "paidAt" | "paidBy" | "paymentReference" | "paymentMethod" | "hasReceipt" | "receiptVerified" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy" | "deletedAt"
  > {}

class Expense
  extends Model<ExpenseAttributes, ExpenseCreationAttributes>
  implements ExpenseAttributes
{
  declare id: string;
  declare tenantId: string;
  declare employeeId: string;
  declare categoryId: string;
  declare departmentId: string | null | undefined;
  declare expenseNumber: string;
  declare title: string;
  declare description: string | null | undefined;
  declare amount: number;
  declare currency: string;
  declare exchangeRate: number;
  declare amountInBaseCurrency: number | null | undefined;
  declare expenseDate: Date;
  declare status: string;
  declare submittedAt: Date | null | undefined;
  declare rejectionReason: string | null | undefined;
  declare rejectedAt: Date | null | undefined;
  declare rejectedBy: string | null | undefined;
  declare paidAt: Date | null | undefined;
  declare paidBy: string | null | undefined;
  declare paymentReference: string | null | undefined;
  declare paymentMethod: string | null | undefined;
  declare hasReceipt: boolean;
  declare receiptVerified: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | null | undefined;
  declare updatedBy: string | null | undefined;
  declare deletedAt: Date | null | undefined;
}

Expense.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "tenant_id",
      references: {
        model: Tenant,
        key: "id",
      },
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "employee_id",
      references: {
        model: Employee,
        key: "id",
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "category_id",
      references: {
        model: ExpenseCategory,
        key: "id",
      },
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "department_id",
      references: {
        model: Department,
        key: "id",
      },
    },
    expenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "expense_number",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: "KES",
    },
    exchangeRate: {
      type: DataTypes.DECIMAL(10, 4),
      defaultValue: 1,
      field: "exchange_rate",
    },
    amountInBaseCurrency: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "amount_in_base_currency",
    },
    expenseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "expense_date",
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "draft",
      validate: {
        isIn: [["draft", "submitted", "pending_manager", "pending_finance", "approved", "rejected", "paid", "cancelled"]],
      },
    },
    submittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "submitted_at",
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "rejection_reason",
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "rejected_at",
    },
    rejectedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "rejected_by",
      references: {
        model: User,
        key: "id",
      },
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
    paidBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "paid_by",
      references: {
        model: User,
        key: "id",
      },
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "payment_reference",
    },
    paymentMethod: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "payment_method",
    },
    hasReceipt: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "has_receipt",
    },
    receiptVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "receipt_verified",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "created_by",
      references: {
        model: User,
        key: "id",
      },
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "updated_by",
      references: {
        model: User,
        key: "id",
      },
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    },
  },
  {
    sequelize,
    tableName: "expenses",
    modelName: "Expense",
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "expense_number"],
        name: "unique_expense_number",
      },
      {
        fields: ["tenant_id"],
        name: "idx_expenses_tenant",
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ["employee_id"],
        name: "idx_expenses_employee",
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ["tenant_id", "status"],
        name: "idx_expenses_status",
        where: {
          deleted_at: null,
        },
      },
      {
        fields: ["tenant_id", "expense_date"],
        name: "idx_expenses_date",
        where: {
          deleted_at: null,
        },
      },
    ],
  }
);

export default Expense;

