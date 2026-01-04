import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

interface AuditLogAttributes {
  id: string;
  tenantId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  changes?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

interface AuditLogCreationAttributes
  extends Optional<
    AuditLogAttributes,
    "id" | "tenantId" | "userId" | "previousData" | "newData" | "changes" | "ipAddress" | "userAgent" | "createdAt"
  > {}

class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  declare id: string;
  declare tenantId: string | null | undefined;
  declare userId: string | null | undefined;
  declare action: string;
  declare entityType: string;
  declare entityId: string;
  declare previousData: Record<string, any> | null | undefined;
  declare newData: Record<string, any> | null | undefined;
  declare changes: Record<string, any> | null | undefined;
  declare ipAddress: string | null | undefined;
  declare userAgent: string | null | undefined;
  declare readonly createdAt: Date;
}

AuditLog.init(
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
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
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
    previousData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "previous_data",
    },
    newData: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "new_data",
    },
    changes: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.INET,
      allowNull: true,
      field: "ip_address",
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "user_agent",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
    modelName: "AuditLog",
    timestamps: false,
    indexes: [
      {
        fields: ["tenant_id", "created_at"],
        name: "idx_audit_logs_tenant",
      },
      {
        fields: ["entity_type", "entity_id"],
        name: "idx_audit_logs_entity",
      },
      {
        fields: ["user_id", "created_at"],
        name: "idx_audit_logs_user",
      },
    ],
  }
);

export default AuditLog;

