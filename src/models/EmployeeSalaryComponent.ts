import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Employee from "./Employee";
import SalaryComponent from "./SalaryComponent";
import User from "./User";

interface EmployeeSalaryComponentAttributes {
  id: string;
  employeeId: string;
  salaryComponentId: string;
  amount: number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface EmployeeSalaryComponentCreationAttributes
  extends Optional<
    EmployeeSalaryComponentAttributes,
    "id" | "effectiveTo" | "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
  > {}

class EmployeeSalaryComponent
  extends Model<EmployeeSalaryComponentAttributes, EmployeeSalaryComponentCreationAttributes>
  implements EmployeeSalaryComponentAttributes
{
  declare id: string;
  declare employeeId: string;
  declare salaryComponentId: string;
  declare amount: number;
  declare effectiveFrom: Date;
  declare effectiveTo: Date | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare createdBy: string | null | undefined;
  declare updatedBy: string | null | undefined;
}

EmployeeSalaryComponent.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "employee_id",
      references: {
        model: Employee,
        key: "id",
      },
    },
    salaryComponentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "salary_component_id",
      references: {
        model: SalaryComponent,
        key: "id",
      },
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
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
    tableName: "employee_salary_components",
    modelName: "EmployeeSalaryComponent",
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "salary_component_id", "effective_from"],
        name: "unique_active_component",
      },
      {
        fields: ["employee_id"],
        name: "idx_employee_salary_employee",
      },
      {
        fields: ["employee_id", "effective_from", "effective_to"],
        name: "idx_employee_salary_effective",
      },
    ],
  }
);

export default EmployeeSalaryComponent;

