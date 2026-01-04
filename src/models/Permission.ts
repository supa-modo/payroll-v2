import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface PermissionAttributes {
  id: string;
  name: string;
  displayName: string;
  description?: string | null;
  category: string;
  createdAt: Date;
}

interface PermissionCreationAttributes
  extends Optional<PermissionAttributes, "id" | "description" | "createdAt"> {}

class Permission
  extends Model<PermissionAttributes, PermissionCreationAttributes>
  implements PermissionAttributes
{
  declare id: string;
  declare name: string;
  declare displayName: string;
  declare description: string | null | undefined;
  declare category: string;
  declare readonly createdAt: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
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
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "permissions",
    modelName: "Permission",
  }
);

export default Permission;

