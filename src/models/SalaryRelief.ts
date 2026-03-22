import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface SalaryReliefAttributes {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  reliefType: string;
  calculationType: string;
  amount?: number | null;
  percentageValue?: number | null;
  maxAmount?: number | null;
  minAmount?: number | null;
  isMandatory: boolean;
  isActive: boolean;
  country: string;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  config?: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SalaryReliefCreationAttributes
  extends Optional<
    SalaryReliefAttributes,
    "id" | "amount" | "percentageValue" | "maxAmount" | "minAmount" | "isMandatory" | "isActive" | "country" | "effectiveTo" | "config" | "createdAt" | "updatedAt"
  > {}

class SalaryRelief
  extends Model<SalaryReliefAttributes, SalaryReliefCreationAttributes>
  implements SalaryReliefAttributes
{
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare code: string;
  declare reliefType: string;
  declare calculationType: string;
  declare amount: number | null | undefined;
  declare percentageValue: number | null | undefined;
  declare maxAmount: number | null | undefined;
  declare minAmount: number | null | undefined;
  declare isMandatory: boolean;
  declare isActive: boolean;
  declare country: string;
  declare effectiveFrom: Date;
  declare effectiveTo: Date | null | undefined;
  declare config: Record<string, any> | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SalaryRelief.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenantId: { type: DataTypes.UUID, allowNull: false, field: "tenant_id" },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false },
    reliefType: { type: DataTypes.STRING(30), allowNull: false, field: "relief_type" },
    calculationType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "calculation_type",
      validate: { isIn: [["fixed", "percentage"]] },
    },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    percentageValue: { type: DataTypes.DECIMAL(8, 4), allowNull: true, field: "percentage_value" },
    maxAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: true, field: "max_amount" },
    minAmount: { type: DataTypes.DECIMAL(15, 2), allowNull: true, field: "min_amount" },
    isMandatory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: "is_mandatory" },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: "is_active" },
    country: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "Kenya" },
    effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false, field: "effective_from" },
    effectiveTo: { type: DataTypes.DATEONLY, allowNull: true, field: "effective_to" },
    config: { type: DataTypes.JSONB, allowNull: true },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "salary_reliefs",
    modelName: "SalaryRelief",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "code", "effective_from"],
        name: "unique_salary_relief_code_effective",
      },
    ],
  }
);

export default SalaryRelief;
