import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

interface SalaryComponentAttributes {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  type: string;
  category: string;
  calculationType: string;
  defaultAmount?: number | null;
  percentageOf?: string | null;
  percentageValue?: number | null;
  isTaxable: boolean;
  isStatutory: boolean;
  statutoryType?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface SalaryComponentCreationAttributes
  extends Optional<
    SalaryComponentAttributes,
    "id" | "defaultAmount" | "percentageOf" | "percentageValue" | "isTaxable" | "isStatutory" | "statutoryType" | "isActive" | "displayOrder" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
  > {}

class SalaryComponent
  extends Model<SalaryComponentAttributes, SalaryComponentCreationAttributes>
  implements SalaryComponentAttributes
{
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare code: string;
  declare type: string;
  declare category: string;
  declare calculationType: string;
  declare defaultAmount: number | null | undefined;
  declare percentageOf: string | null | undefined;
  declare percentageValue: number | null | undefined;
  declare isTaxable: boolean;
  declare isStatutory: boolean;
  declare statutoryType: string | null | undefined;
  declare isActive: boolean;
  declare displayOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | null | undefined;
  declare updatedBy: string | null | undefined;
}

SalaryComponent.init(
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
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["earning", "deduction"]],
      },
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    calculationType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "calculation_type",
      validate: {
        isIn: [["fixed", "percentage"]],
      },
    },
    defaultAmount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "default_amount",
    },
    percentageOf: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "percentage_of",
      references: {
        model: "salary_components",
        key: "id",
      },
    },
    percentageValue: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: "percentage_value",
    },
    isTaxable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_taxable",
    },
    isStatutory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_statutory",
    },
    statutoryType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "statutory_type",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: "display_order",
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
    tableName: "salary_components",
    modelName: "SalaryComponent",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "code"],
        name: "unique_component_code",
      },
      {
        fields: ["tenant_id"],
        name: "idx_salary_components_tenant",
        where: {
          is_active: true,
        },
      },
    ],
  }
);

export default SalaryComponent;

