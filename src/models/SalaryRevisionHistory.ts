import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Employee from "./Employee";
import User from "./User";

interface SalaryRevisionHistoryAttributes {
  id: string;
  employeeId: string;
  revisionDate: Date;
  previousGross?: number | null;
  newGross: number;
  changePercentage?: number | null;
  reason?: string | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  componentChanges: Record<string, any>;
  createdAt: Date;
  createdBy?: string | null;
}

interface SalaryRevisionHistoryCreationAttributes
  extends Optional<
    SalaryRevisionHistoryAttributes,
    "id" | "previousGross" | "changePercentage" | "reason" | "approvedBy" | "approvedAt" | "createdAt" | "createdBy"
  > {}

class SalaryRevisionHistory
  extends Model<SalaryRevisionHistoryAttributes, SalaryRevisionHistoryCreationAttributes>
  implements SalaryRevisionHistoryAttributes
{
  declare id: string;
  declare employeeId: string;
  declare revisionDate: Date;
  declare previousGross: number | null | undefined;
  declare newGross: number;
  declare changePercentage: number | null | undefined;
  declare reason: string | null | undefined;
  declare approvedBy: string | null | undefined;
  declare approvedAt: Date | null | undefined;
  declare componentChanges: Record<string, any>;
  declare readonly createdAt: Date;
  declare createdBy: string | null | undefined;
}

SalaryRevisionHistory.init(
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
    revisionDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "revision_date",
    },
    previousGross: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: "previous_gross",
    },
    newGross: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      field: "new_gross",
    },
    changePercentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: "change_percentage",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "approved_by",
      references: {
        model: User,
        key: "id",
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "approved_at",
    },
    componentChanges: {
      type: DataTypes.JSONB,
      allowNull: false,
      field: "component_changes",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
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
  },
  {
    sequelize,
    tableName: "salary_revision_history",
    modelName: "SalaryRevisionHistory",
    timestamps: false,
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_salary_revision_employee",
      },
    ],
  }
);

export default SalaryRevisionHistory;

