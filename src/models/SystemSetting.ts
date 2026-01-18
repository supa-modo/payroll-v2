import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

interface SystemSettingAttributes {
  id: string;
  tenantId: string | null;
  key: string;
  value: Record<string, any>;
  description?: string | null;
  category?: string | null;
  updatedAt: Date;
  updatedBy?: string | null;
}

interface SystemSettingCreationAttributes
  extends Optional<
    SystemSettingAttributes,
    "id" | "description" | "category" | "updatedAt" | "updatedBy" | "tenantId"
  > {}

class SystemSetting
  extends Model<SystemSettingAttributes, SystemSettingCreationAttributes>
  implements SystemSettingAttributes
{
  declare id: string;
  declare tenantId: string | null;
  declare key: string;
  declare value: Record<string, any>;
  declare description: string | null | undefined;
  declare category: string | null | undefined;
  declare readonly updatedAt: Date;
  declare updatedBy: string | null | undefined;

  /**
   * Check if this is a global setting
   */
  public isGlobal(): boolean {
    return this.tenantId === null;
  }
}

SystemSetting.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true, // Nullable for global settings
      field: "tenant_id",
      references: {
        model: Tenant,
        key: "id",
      },
    },
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
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
    tableName: "system_settings",
    modelName: "SystemSetting",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "key"],
        name: "unique_setting_key_global",
      },
      {
        unique: true,
        fields: ["key"],
        name: "unique_global_setting_key",
      },
      {
        fields: ["category"],
        name: "idx_system_settings_category",
      },
    ],
  }
);

export default SystemSetting;

