import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import User from "./User";
import Role from "./Role";
import Department from "./Department";

interface UserRoleAttributes {
  userId: string;
  roleId: string;
  departmentId?: string | null;
  assignedAt: Date;
  assignedBy?: string | null;
}

interface UserRoleCreationAttributes
  extends Optional<UserRoleAttributes, "departmentId" | "assignedAt" | "assignedBy"> {}

class UserRole
  extends Model<UserRoleAttributes, UserRoleCreationAttributes>
  implements UserRoleAttributes
{
  declare userId: string;
  declare roleId: string;
  declare departmentId: string | null | undefined;
  declare assignedAt: Date;
  declare assignedBy: string | null | undefined;
}

UserRole.init(
  {
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
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
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      primaryKey: true,
      field: "department_id",
      references: {
        model: Department,
        key: "id",
      },
    },
    assignedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "assigned_at",
    },
    assignedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "assigned_by",
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    sequelize,
    tableName: "user_roles",
    modelName: "UserRole",
    timestamps: false,
    indexes: [
      {
        fields: ["user_id", "role_id"],
        name: "idx_user_roles_user_role",
      },
      {
        fields: ["user_id"],
        name: "idx_user_roles_user",
      },
      {
        fields: ["role_id"],
        name: "idx_user_roles_role",
      },
    ],
  }
);

export default UserRole;

