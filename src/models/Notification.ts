import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

interface NotificationAttributes {
  id: string;
  tenantId: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  readAt?: Date | null;
  createdAt: Date;
  expiresAt: Date;
}

interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    "id" | "entityType" | "entityId" | "actionUrl" | "readAt" | "createdAt" | "expiresAt"
  > {}

class Notification
  extends Model<NotificationAttributes, NotificationCreationAttributes>
  implements NotificationAttributes
{
  declare id: string;
  declare tenantId: string;
  declare userId: string;
  declare type: string;
  declare title: string;
  declare message: string;
  declare entityType: string | null | undefined;
  declare entityId: string | null | undefined;
  declare actionUrl: string | null | undefined;
  declare readAt: Date | null | undefined;
  declare readonly createdAt: Date;
  declare expiresAt: Date;
}

Notification.init(
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
        model: Tenant,
        key: "id",
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      references: {
        model: User,
        key: "id",
      },
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    entityType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "entity_type",
    },
    entityId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "entity_id",
    },
    actionUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: "action_url",
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
  },
  {
    sequelize,
    tableName: "notifications",
    modelName: "Notification",
    timestamps: false,
    indexes: [
      {
        fields: ["user_id", "read_at", "created_at"],
        name: "idx_notifications_user",
      },
    ],
  }
);

export default Notification;

