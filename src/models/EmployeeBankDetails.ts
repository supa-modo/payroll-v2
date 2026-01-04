import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Employee from "./Employee";
import User from "./User";

interface EmployeeBankDetailsAttributes {
  id: string;
  employeeId: string;
  paymentMethod: string;
  isPrimary: boolean;
  bankName?: string | null;
  bankBranch?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  swiftCode?: string | null;
  mpesaPhone?: string | null;
  mpesaName?: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface EmployeeBankDetailsCreationAttributes
  extends Optional<
    EmployeeBankDetailsAttributes,
    "id" | "isPrimary" | "bankName" | "bankBranch" | "accountNumber" | "accountName" | "swiftCode" | "mpesaPhone" | "mpesaName" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
  > {}

class EmployeeBankDetails
  extends Model<EmployeeBankDetailsAttributes, EmployeeBankDetailsCreationAttributes>
  implements EmployeeBankDetailsAttributes
{
  declare id: string;
  declare employeeId: string;
  declare paymentMethod: string;
  declare isPrimary: boolean;
  declare bankName: string | null | undefined;
  declare bankBranch: string | null | undefined;
  declare accountNumber: string | null | undefined;
  declare accountName: string | null | undefined;
  declare swiftCode: string | null | undefined;
  declare mpesaPhone: string | null | undefined;
  declare mpesaName: string | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | null | undefined;
  declare updatedBy: string | null | undefined;
}

EmployeeBankDetails.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
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
      allowNull: false,
      field: "payment_method",
      validate: {
        isIn: [["bank", "mpesa", "cash"]],
      },
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_primary",
    },
    bankName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "bank_name",
    },
    bankBranch: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "bank_branch",
    },
    accountNumber: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "account_number",
    },
    accountName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "account_name",
    },
    swiftCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "swift_code",
    },
    mpesaPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "mpesa_phone",
    },
    mpesaName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "mpesa_name",
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
    tableName: "employee_bank_details",
    modelName: "EmployeeBankDetails",
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_bank_details_employee",
      },
    ],
  }
);

export default EmployeeBankDetails;

