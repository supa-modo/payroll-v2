import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Payroll from "./Payroll";
import SalaryComponent from "./SalaryComponent";

interface PayrollItemAttributes {
  id: string;
  payrollId: string;
  salaryComponentId?: string | null;
  name: string;
  type: string;
  category: string;
  amount: number;
  calculationDetails?: Record<string, any> | null;
  createdAt: Date;
}

interface PayrollItemCreationAttributes
  extends Optional<
    PayrollItemAttributes,
    "id" | "salaryComponentId" | "calculationDetails" | "createdAt"
  > {}

class PayrollItem
  extends Model<PayrollItemAttributes, PayrollItemCreationAttributes>
  implements PayrollItemAttributes
{
  declare id: string;
  declare payrollId: string;
  declare salaryComponentId: string | null | undefined;
  declare name: string;
  declare type: string;
  declare category: string;
  declare amount: number;
  declare calculationDetails: Record<string, any> | null | undefined;
  declare readonly createdAt: Date;
}

PayrollItem.init(
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
    salaryComponentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "salary_component_id",
      references: {
        model: SalaryComponent,
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    calculationDetails: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "calculation_details",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "payroll_items",
    modelName: "PayrollItem",
    timestamps: false,
    indexes: [
      {
        fields: ["payroll_id"],
        name: "idx_payroll_items_payroll",
      },
    ],
  }
);

export default PayrollItem;

