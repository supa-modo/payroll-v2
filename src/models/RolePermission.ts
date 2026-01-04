import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";
import Role from "./Role";
import Permission from "./Permission";

interface RolePermissionAttributes {
  roleId: string;
  permissionId: string;
}

class RolePermission
  extends Model<RolePermissionAttributes>
  implements RolePermissionAttributes
{
  declare roleId: string;
  declare permissionId: string;
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: "role_id",
      references: {
        model: Role,
        key: "id",
      },
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: "permission_id",
      references: {
        model: Permission,
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "role_permissions",
    modelName: "RolePermission",
    timestamps: false,
    indexes: [
      {
        fields: ["role_id", "permission_id"],
        name: "idx_role_permissions_role_permission",
      },
      {
        fields: ["role_id"],
        name: "idx_role_permissions_role",
      },
      {
        fields: ["permission_id"],
        name: "idx_role_permissions_permission",
      },
    ],
  }
);

export default RolePermission;

