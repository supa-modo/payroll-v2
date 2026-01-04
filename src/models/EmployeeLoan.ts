import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import Employee from "./Employee";
import User from "./User";

interface EmployeeLoanAttributes {
  id: string;
  tenantId: string;
  employeeId: string;
  loanType: string;
  loanNumber: string;
  principalAmount: number;
  interestRate: number;
  totalAmount: number;
  repaymentStartDate: Date;
  monthlyDeduction: number;
  remainingBalance: number;
  totalPaid: number;
  status: string;
  reason?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface EmployeeLoanCreationAttributes
  extends Optional<
    EmployeeLoanAttributes,
    "id" | "interestRate" | "totalPaid" | "status" | "reason" | "approvedBy" | "approvedAt" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
  > {}

class EmployeeLoan
  extends Model<EmployeeLoanAttributes, EmployeeLoanCreationAttributes>
  implements EmployeeLoanAttributes
{
  declare id: string;
  declare tenantId: string;
  declare employeeId: string;
  declare loanType: string;
  declare loanNumber: string;
  declare principalAmount: number;
  declare interestRate: number;
  declare totalAmount: number;
  declare repaymentStartDate: Date;
  declare monthlyDeduction: number;
  declare remainingBalance: number;
  declare totalPaid: number;
  declare status: string;
  declare reason: string | null | undefined;
  declare approvedBy: string | null | undefined;
  declare approvedAt: Date | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | null | undefined;
  declare updatedBy: string | null | undefined;
}

EmployeeLoan.init(
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
    loanType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "loan_type",
    },
    loanNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "loan_number",
    },
    principalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "principal_amount",
    },
    interestRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      field: "interest_rate",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "total_amount",
    },
    repaymentStartDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "repayment_start_date",
    },
    monthlyDeduction: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "monthly_deduction",
    },
    remainingBalance: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "remaining_balance",
    },
    totalPaid: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0,
      field: "total_paid",
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: "active",
      validate: {
        isIn: [["pending", "active", "completed", "written_off"]],
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
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
    tableName: "employee_loans",
    modelName: "EmployeeLoan",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "loan_number"],
        name: "unique_loan_number",
      },
      {
        fields: ["employee_id"],
        name: "idx_loans_employee",
        where: {
          status: "active",
        },
      },
    ],
  }
);

export default EmployeeLoan;

