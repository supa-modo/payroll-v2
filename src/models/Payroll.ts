import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import PayrollPeriod from "./PayrollPeriod";
import Employee from "./Employee";

interface PayrollAttributes {
  id: string;
  payrollPeriodId: string;
  employeeId: string;
  paymentMethod?: string | null;
  bankAccount?: string | null;
  mpesaPhone?: string | null;
  grossPay: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  payeAmount: number;
  nssfAmount: number;
  nhifAmount: number;
  status: string;
  paidAt?: Date | null;
  paymentReference?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PayrollCreationAttributes
  extends Optional<
    PayrollAttributes,
    "id" | "paymentMethod" | "bankAccount" | "mpesaPhone" | "payeAmount" | "nssfAmount" | "nhifAmount" | "status" | "paidAt" | "paymentReference" | "createdAt" | "updatedAt"
  > {}

class Payroll
  extends Model<PayrollAttributes, PayrollCreationAttributes>
  implements PayrollAttributes
{
  declare id: string;
  declare payrollPeriodId: string;
  declare employeeId: string;
  declare paymentMethod: string | null | undefined;
  declare bankAccount: string | null | undefined;
  declare mpesaPhone: string | null | undefined;
  declare grossPay: number;
  declare totalEarnings: number;
  declare totalDeductions: number;
  declare netPay: number;
  declare payeAmount: number;
  declare nssfAmount: number;
  declare nhifAmount: number;
  declare status: string;
  declare paidAt: Date | null | undefined;
  declare paymentReference: string | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Payroll.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "employee_id",
      references: {
        model: Employee,
        key: "id",
      },
    },
    paymentMethod: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "payment_method",
    },
    bankAccount: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "bank_account",
    },
    mpesaPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "mpesa_phone",
    },
    grossPay: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "gross_pay",
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "total_earnings",
    },
    totalDeductions: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "total_deductions",
    },
    netPay: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "net_pay",
    },
    payeAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: "paye_amount",
    },
    nssfAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: "nssf_amount",
    },
    nhifAmount: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: "nhif_amount",
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "calculated",
      validate: {
        isIn: [["calculated", "approved", "paid", "failed"]],
      },
    },
    paidAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "paid_at",
    },
    paymentReference: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "payment_reference",
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
    tableName: "payrolls",
    modelName: "Payroll",
    indexes: [
      {
        unique: true,
        fields: ["payroll_period_id", "employee_id"],
        name: "unique_employee_payroll",
      },
      {
        fields: ["payroll_period_id"],
        name: "idx_payrolls_period",
      },
      {
        fields: ["employee_id"],
        name: "idx_payrolls_employee",
      },
    ],
  }
);

export default Payroll;

