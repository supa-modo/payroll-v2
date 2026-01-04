import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface DepartmentAttributes {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
}

interface DepartmentCreationAttributes
  extends Optional<
    DepartmentAttributes,
    | "id"
    | "code"
    | "description"
    | "managerId"
    | "parentDepartmentId"
    | "isActive"
    | "createdAt"
    | "updatedAt"
    | "createdBy"
    | "updatedBy"
    | "deletedAt"
  > {}

class Department
  extends Model<DepartmentAttributes, DepartmentCreationAttributes>
  implements DepartmentAttributes
{
  declare id: string;
  declare tenantId: string;
  declare name: string;
  declare code: string | undefined;
  declare description: string | undefined;
  declare managerId: string | undefined;
  declare parentDepartmentId: string | undefined;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | undefined;
  declare updatedBy: string | undefined;
  declare readonly deletedAt: Date | undefined;
}

Department.init(
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
        model: "tenants",
        key: "id",
      },
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "manager_id",
    },
    parentDepartmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "parent_id",
      references: {
        model: "departments",
        key: "id",
      },
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
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
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "created_by",
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "updated_by",
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    },
  },
  {
    sequelize,
    tableName: "departments",
    modelName: "Department",
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "name"],
        name: "departments_tenant_name_unique",
      },
      {
        unique: true,
        fields: ["tenant_id", "code"],
        name: "departments_tenant_code_unique",
        where: {
          code: { [require("sequelize").Op.ne]: null },
        },
      },
    ],
  }
);

export default Department;

