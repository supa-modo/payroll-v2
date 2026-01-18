import { DataTypes, Model, Optional, Op } from "sequelize";
import { sequelize } from "../config/database";
import Tenant from "./Tenant";
import User from "./User";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";
export type NotificationChannel = "in_app" | "email" | "push" | "sms";
export type NotificationStatus = "pending" | "sent" | "delivered" | "failed";

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
  priority: NotificationPriority;
  channels: NotificationChannel[];
  status: NotificationStatus;
  metadata?: Record<string, any> | null;
  groupKey?: string | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  retryCount: number;
  errorMessage?: string | null;
}

interface NotificationCreationAttributes
  extends Optional<
    NotificationAttributes,
    | "id"
    | "entityType"
    | "entityId"
    | "actionUrl"
    | "readAt"
    | "createdAt"
    | "expiresAt"
    | "priority"
    | "channels"
    | "status"
    | "metadata"
    | "groupKey"
    | "sentAt"
    | "deliveredAt"
    | "failedAt"
    | "retryCount"
    | "errorMessage"
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
  declare priority: NotificationPriority;
  declare channels: NotificationChannel[];
  declare status: NotificationStatus;
  declare metadata: Record<string, any> | null | undefined;
  declare groupKey: string | null | undefined;
  declare sentAt: Date | null | undefined;
  declare deliveredAt: Date | null | undefined;
  declare failedAt: Date | null | undefined;
  declare retryCount: number;
  declare errorMessage: string | null | undefined;

  /**
   * Mark notification as sent
   */
  public async markAsSent(): Promise<void> {
    await this.update({
      status: "sent",
      sentAt: new Date(),
    });
  }

  /**
   * Mark notification as delivered
   */
  public async markAsDelivered(): Promise<void> {
    await this.update({
      status: "delivered",
      deliveredAt: new Date(),
    });
  }

  /**
   * Mark notification as failed
   */
  public async markAsFailed(errorMessage?: string): Promise<void> {
    await this.update({
      status: "failed",
      failedAt: new Date(),
      errorMessage: errorMessage || null,
      retryCount: this.retryCount + 1,
    });
  }

  /**
   * Increment retry count
   */
  public async incrementRetry(): Promise<void> {
    await this.update({
      retryCount: this.retryCount + 1,
    });
  }

  /**
   * Check if notification is expired
   */
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if notification is read
   */
  public isRead(): boolean {
    return this.readAt !== null && this.readAt !== undefined;
  }
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
    priority: {
      type: DataTypes.ENUM("low", "normal", "high", "urgent"),
      allowNull: false,
      defaultValue: "normal",
    },
    channels: {
      type: DataTypes.ARRAY(DataTypes.ENUM("in_app", "email", "push", "sms")),
      allowNull: true,
      defaultValue: ["in_app"],
      field: "channels",
    },
    status: {
      type: DataTypes.ENUM("pending", "sent", "delivered", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    groupKey: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "group_key",
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "sent_at",
    },
    deliveredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivered_at",
    },
    failedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "failed_at",
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "retry_count",
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "error_message",
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
      {
        fields: ["priority"],
        name: "idx_notifications_priority",
      },
      {
        fields: ["status"],
        name: "idx_notifications_status",
      },
      {
        fields: ["group_key"],
        name: "idx_notifications_group_key",
        where: {
          group_key: { [Op.ne]: null },
        },
      },
    ],
    scopes: {
      active: {
        where: {
          expiresAt: {
            [Op.gt]: new Date(),
          },
        },
      },
      unread: {
        where: {
          readAt: null,
        },
      },
      pending: {
        where: {
          status: "pending",
        },
      },
      failed: {
        where: {
          status: "failed",
        },
      },
    },
  }
);

export default Notification;

