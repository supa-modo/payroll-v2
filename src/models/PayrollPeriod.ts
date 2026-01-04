import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

interface PayrollPeriodAttributes {
  id: string;
  tenantId: string;
  name: string;
  periodType: string;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  status: string;
  lockedAt?: Date | null;
  lockedBy?: string | null;
  processedAt?: Date | null;
  processedBy?: string | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  totalEmployees: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface PayrollPeriodCreationAttributes
  extends Optional<
    PayrollPeriodAttributes,
    "id" | "status" | "lockedAt" | "lockedBy" | "processedAt" | "processedBy" | "approvedAt" | "approvedBy" | "totalEmployees" | "totalGross" | "totalDeductions" | "totalNet" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
  > {}

class PayrollPeriod
  extends Model<PayrollPeriodAttributes, PayrollPeriodCreationAttributes>
  implements PayrollPeriodAttributes
{
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare periodType: string;
  declare startDate: Date;
  declare endDate: Date;
  declare payDate: Date;
  declare status: string;
  declare lockedAt: Date | null | undefined;
  declare lockedBy: string | null | undefined;
  declare processedAt: Date | null | undefined;
  declare processedBy: string | null | undefined;
  declare approvedAt: Date | null | undefined;
  declare approvedBy: string | null | undefined;
  declare totalEmployees: number;
  declare totalGross: number;
  declare totalDeductions: number;
  declare totalNet: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | null | undefined;
  declare updatedBy: string | null | undefined;
}

PayrollPeriod.init(
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
    periodType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "period_type",
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "end_date",
    },
    payDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "pay_date",
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "draft",
      validate: {
        isIn: [["draft", "processing", "pending_approval", "approved", "paid", "locked"]],
      },
    },
    lockedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "locked_at",
    },
    lockedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "locked_by",
      references: {
        model: User,
        key: "id",
      },
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "processed_at",
    },
    processedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "processed_by",
      references: {
        model: User,
        key: "id",
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "approved_by",
      references: {
        model: User,
        key: "id",
      },
    },
    totalEmployees: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "total_employees",
    },
    totalGross: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: "total_gross",
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: "total_deductions",
    },
    totalNet: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: "total_net",
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
    tableName: "payroll_periods",
    modelName: "PayrollPeriod",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "start_date", "end_date"],
        name: "unique_period_dates",
      },
      {
        fields: ["tenant_id"],
        name: "idx_payroll_periods_tenant",
      },
      {
        fields: ["tenant_id", "start_date", "end_date"],
        name: "idx_payroll_periods_dates",
      },
    ],
  }
);

export default PayrollPeriod;

