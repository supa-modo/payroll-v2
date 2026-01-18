import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import PayrollPeriod from "./PayrollPeriod";
import User from "./User";
import Tenant from "./Tenant";

interface TaxRemittanceAttributes {
  id: string;
  tenantId: string;
  payrollPeriodId: string;
  taxType: string;
  amount: number;
  dueDate: Date;
  remittedAt?: Date | null;
  remittedBy?: string | null;
  remittanceReference?: string | null;
  status: string;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TaxRemittanceCreationAttributes
  extends Optional<
    TaxRemittanceAttributes,
    "id" | "remittedAt" | "remittedBy" | "remittanceReference" | "notes" | "createdAt" | "updatedAt"
  > {}

class TaxRemittance
  extends Model<TaxRemittanceAttributes, TaxRemittanceCreationAttributes>
  implements TaxRemittanceAttributes
{
  declare id: string;
  declare tenantId: string;
  declare payrollPeriodId: string;
  declare taxType: string;
  declare amount: number;
  declare dueDate: Date;
  declare remittedAt: Date | null | undefined;
  declare remittedBy: string | null | undefined;
  declare remittanceReference: string | null | undefined;
  declare status: string;
  declare notes: string | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

TaxRemittance.init(
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
    payrollPeriodId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "payroll_period_id",
      references: {
        model: PayrollPeriod,
        key: "id",
      },
    },
    taxType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "tax_type",
      validate: {
        isIn: [["PAYE", "NSSF", "NHIF"]],
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "due_date",
    },
    remittedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "remitted_at",
    },
    remittedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "remitted_by",
      references: {
        model: User,
        key: "id",
      },
    },
    remittanceReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "remittance_reference",
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "pending",
      validate: {
        isIn: [["pending", "remitted"]],
      },
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "tax_remittances",
    modelName: "TaxRemittance",
    indexes: [
      {
        unique: true,
        fields: ["payroll_period_id", "tax_type"],
        name: "unique_period_tax_type",
      },
      {
        fields: ["tenant_id"],
        name: "idx_tax_remittances_tenant",
      },
      {
        fields: ["payroll_period_id"],
        name: "idx_tax_remittances_period",
      },
      {
        fields: ["status"],
        name: "idx_tax_remittances_status",
      },
      {
        fields: ["due_date"],
        name: "idx_tax_remittances_due_date",
      },
    ],
  }
);

export default TaxRemittance;
