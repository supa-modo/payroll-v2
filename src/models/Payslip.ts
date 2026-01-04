import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Payroll from "./Payroll";
import User from "./User";

interface PayslipAttributes {
  id: string;
  payrollId: string;
  payslipNumber: string;
  filePath: string;
  generatedAt: Date;
  generatedBy?: string | null;
  firstViewedAt?: Date | null;
  downloadCount: number;
}

interface PayslipCreationAttributes
  extends Optional<
    PayslipAttributes,
    "id" | "generatedAt" | "generatedBy" | "firstViewedAt" | "downloadCount"
  > {}

class Payslip
  extends Model<PayslipAttributes, PayslipCreationAttributes>
  implements PayslipAttributes
{
  declare id: string;
  declare payrollId: string;
  declare payslipNumber: string;
  declare filePath: string;
  declare generatedAt: Date;
  declare generatedBy: string | null | undefined;
  declare firstViewedAt: Date | null | undefined;
  declare downloadCount: number;
}

Payslip.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    payrollId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "payroll_id",
      references: {
        model: Payroll,
        key: "id",
      },
    },
    payslipNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "payslip_number",
    },
    filePath: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: "file_path",
    },
    generatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "generated_at",
    },
    generatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "generated_by",
      references: {
        model: User,
        key: "id",
      },
    },
    firstViewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "first_viewed_at",
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "download_count",
    },
  },
  {
    sequelize,
    tableName: "payslips",
    modelName: "Payslip",
    timestamps: false,
    indexes: [
      {
        fields: ["payroll_id"],
        name: "idx_payslips_payroll",
      },
    ],
  }
);

export default Payslip;

