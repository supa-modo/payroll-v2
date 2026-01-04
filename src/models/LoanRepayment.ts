import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import EmployeeLoan from "./EmployeeLoan";
import Payroll from "./Payroll";
import User from "./User";

interface LoanRepaymentAttributes {
  id: string;
  loanId: string;
  payrollId?: string | null;
  amount: number;
  repaymentDate: Date;
  paymentType: string;
  balanceAfter: number;
  notes?: string | null;
  createdAt: Date;
  createdBy?: string | null;
}

interface LoanRepaymentCreationAttributes
  extends Optional<
    LoanRepaymentAttributes,
    "id" | "payrollId" | "notes" | "createdAt" | "createdBy"
  > {}

class LoanRepayment
  extends Model<LoanRepaymentAttributes, LoanRepaymentCreationAttributes>
  implements LoanRepaymentAttributes
{
  declare id: string;
  declare loanId: string;
  declare payrollId: string | null | undefined;
  declare amount: number;
  declare repaymentDate: Date;
  declare paymentType: string;
  declare balanceAfter: number;
  declare notes: string | null | undefined;
  declare readonly createdAt: Date;
  declare createdBy: string | null | undefined;
}

LoanRepayment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    loanId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "loan_id",
      references: {
        model: EmployeeLoan,
        key: "id",
      },
    },
    payrollId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "payroll_id",
      references: {
        model: Payroll,
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    repaymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "repayment_date",
    },
    paymentType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "payment_type",
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "balance_after",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
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
  },
  {
    sequelize,
    tableName: "loan_repayments",
    modelName: "LoanRepayment",
    timestamps: false,
    indexes: [
      {
        fields: ["loan_id"],
        name: "idx_loan_repayments_loan",
      },
    ],
  }
);

export default LoanRepayment;

