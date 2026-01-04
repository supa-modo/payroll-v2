import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface StatutoryRateAttributes {
  id: string;
  country: string;
  rateType: string;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  config: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface StatutoryRateCreationAttributes
  extends Optional<
    StatutoryRateAttributes,
    "id" | "effectiveTo" | "isActive" | "createdAt" | "updatedAt"
  > {}

class StatutoryRate
  extends Model<StatutoryRateAttributes, StatutoryRateCreationAttributes>
  implements StatutoryRateAttributes
{
  declare id: string;
  declare country: string;
  declare rateType: string;
  declare effectiveFrom: Date;
  declare effectiveTo: Date | null | undefined;
  declare config: Record<string, any>;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

StatutoryRate.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    rateType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "rate_type",
    },
    effectiveFrom: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "effective_from",
    },
    effectiveTo: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "effective_to",
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
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
    tableName: "statutory_rates",
    modelName: "StatutoryRate",
    indexes: [
      {
        unique: true,
        fields: ["country", "rate_type", "effective_from"],
        name: "unique_rate_period",
      },
    ],
  }
);

export default StatutoryRate;

