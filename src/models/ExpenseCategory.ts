import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

interface ExpenseCategoryAttributes {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  description?: string | null;
  monthlyBudget?: number | null;
  requiresReceipt: boolean;
  maxAmount?: number | null;
  requiresManagerApproval: boolean;
  requiresFinanceApproval: boolean;
  autoApproveBelow?: number | null;
  glAccountCode?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface ExpenseCategoryCreationAttributes
  extends Optional<
    ExpenseCategoryAttributes,
    "id" | "description" | "monthlyBudget" | "requiresReceipt" | "maxAmount" | "requiresManagerApproval" | "requiresFinanceApproval" | "autoApproveBelow" | "glAccountCode" | "isActive" | "displayOrder" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
  > {}

class ExpenseCategory
  extends Model<ExpenseCategoryAttributes, ExpenseCategoryCreationAttributes>
  implements ExpenseCategoryAttributes
{
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare code: string;
  declare description: string | null | undefined;
  declare monthlyBudget: number | null | undefined;
  declare requiresReceipt: boolean;
  declare maxAmount: number | null | undefined;
  declare requiresManagerApproval: boolean;
  declare requiresFinanceApproval: boolean;
  declare autoApproveBelow: number | null | undefined;
  declare glAccountCode: string | null | undefined;
  declare isActive: boolean;
  declare displayOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | null | undefined;
  declare updatedBy: string | null | undefined;
}

ExpenseCategory.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    monthlyBudget: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "monthly_budget",
    },
    requiresReceipt: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "requires_receipt",
    },
    maxAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "max_amount",
    },
    requiresManagerApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "requires_manager_approval",
    },
    requiresFinanceApproval: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "requires_finance_approval",
    },
    autoApproveBelow: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "auto_approve_below",
    },
    glAccountCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "gl_account_code",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "display_order",
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
  },
  {
    sequelize,
    tableName: "expense_categories",
    modelName: "ExpenseCategory",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "code"],
        name: "unique_category_code",
      },
      {
        fields: ["tenant_id"],
        name: "idx_expense_categories_tenant",
        where: {
          is_active: true,
        },
      },
    ],
  }
);

export default ExpenseCategory;

