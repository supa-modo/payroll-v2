import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Employee from "./Employee";
import SalaryRelief from "./SalaryRelief";

interface EmployeeSalaryReliefAttributes {
  id: string;
  employeeId: string;
  salaryReliefId: string;
  amount?: number | null;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface EmployeeSalaryReliefCreationAttributes
  extends Optional<
    EmployeeSalaryReliefAttributes,
    "id" | "amount" | "effectiveTo" | "createdAt" | "updatedAt"
  > {}

class EmployeeSalaryRelief
  extends Model<EmployeeSalaryReliefAttributes, EmployeeSalaryReliefCreationAttributes>
  implements EmployeeSalaryReliefAttributes
{
  declare id: string;
  declare employeeId: string;
  declare salaryReliefId: string;
  declare amount: number | null | undefined;
  declare effectiveFrom: Date;
  declare effectiveTo: Date | null | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EmployeeSalaryRelief.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "employee_id",
      references: { model: Employee, key: "id" },
    },
    salaryReliefId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "salary_relief_id",
      references: { model: SalaryRelief, key: "id" },
    },
    amount: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    effectiveFrom: { type: DataTypes.DATEONLY, allowNull: false, field: "effective_from" },
    effectiveTo: { type: DataTypes.DATEONLY, allowNull: true, field: "effective_to" },
    createdAt: { type: DataTypes.DATE, field: "created_at" },
    updatedAt: { type: DataTypes.DATE, field: "updated_at" },
  },
  {
    sequelize,
    tableName: "employee_salary_reliefs",
    modelName: "EmployeeSalaryRelief",
    indexes: [
      {
        unique: true,
        fields: ["employee_id", "salary_relief_id", "effective_from"],
        name: "unique_employee_salary_relief",
      },
    ],
  }
);

export default EmployeeSalaryRelief;
