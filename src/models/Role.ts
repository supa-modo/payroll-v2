import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";

interface RoleAttributes {
  id: string;
  tenantId?: string | null;
  name: string;
  displayName: string;
  description?: string | null;
  isSystemRole: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface RoleCreationAttributes
  extends Optional<RoleAttributes, "id" | "tenantId" | "description" | "isSystemRole" | "createdAt" | "updatedAt"> {}

class Role
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  declare id: string;
  declare tenantId: string | null | undefined;
  declare name: string;
  declare displayName: string;
  declare description: string | null | undefined;
  declare isSystemRole: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true,
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
    displayName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "display_name",
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSystemRole: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_system_role",
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
    tableName: "roles",
    modelName: "Role",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "name"],
        name: "roles_tenant_name_unique",
      },
    ],
  }
);

export default Role;

