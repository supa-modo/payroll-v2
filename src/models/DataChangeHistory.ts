import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

interface DataChangeHistoryAttributes {
  id: string;
  tenantId?: string | null;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedBy?: string | null;
  changedAt: Date;
  changeReason?: string | null;
}

interface DataChangeHistoryCreationAttributes
  extends Optional<
    DataChangeHistoryAttributes,
    "id" | "tenantId" | "oldValue" | "newValue" | "changedBy" | "changedAt" | "changeReason"
  > {}

class DataChangeHistory
  extends Model<DataChangeHistoryAttributes, DataChangeHistoryCreationAttributes>
  implements DataChangeHistoryAttributes
{
  declare id: string;
  declare tenantId: string | null | undefined;
  declare entityType: string;
  declare entityId: string;
  declare fieldName: string;
  declare oldValue: string | null | undefined;
  declare newValue: string | null | undefined;
  declare changedBy: string | null | undefined;
  declare changedAt: Date;
  declare changeReason: string | null | undefined;
}

DataChangeHistory.init(
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
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "entity_type",
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "entity_id",
    },
    fieldName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "field_name",
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "old_value",
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "new_value",
    },
    changedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "changed_by",
      references: {
        model: User,
        key: "id",
      },
    },
    changedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "changed_at",
    },
    changeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "change_reason",
    },
  },
  {
    sequelize,
    tableName: "data_change_history",
    modelName: "DataChangeHistory",
    timestamps: false,
    indexes: [
      {
        fields: ["entity_type", "entity_id", "changed_at"],
        name: "idx_change_history_entity",
      },
    ],
  }
);

export default DataChangeHistory;

