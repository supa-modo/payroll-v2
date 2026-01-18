/**
 * Migration: Enhance Notifications Table
 * Adds priority, channel, status, metadata, group_key, and delivery tracking fields
 */

import { QueryInterface, DataTypes } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    // Create ENUM types
    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
      `);
    } catch (error: any) {
      if (!error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE notification_channel AS ENUM ('in_app', 'email', 'push', 'sms');
      `);
    } catch (error: any) {
      if (!error?.message?.includes("already exists")) {
        throw error;
      }
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'delivered', 'failed');
      `);
    } catch (error: any) {
      if (!error?.message?.includes("already exists")) {
        throw error;
      }
    }

    // Add new columns
    // Check if priority column exists (idempotent)
    const priorityExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'priority'
      );
    `);

    if (!(priorityExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "priority", {
          type: DataTypes.ENUM("low", "normal", "high", "urgent"),
          allowNull: false,
          defaultValue: "normal",
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if channels column exists (idempotent)
    const channelsExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'channels'
      );
    `);

    if (!(channelsExists[0][0] as any).exists) {
      // Use raw SQL for ARRAY of ENUM type (Sequelize doesn't handle this well)
      try {
        await queryInterface.sequelize.query(`
          ALTER TABLE "notifications" 
          ADD COLUMN "channels" notification_channel[] 
          DEFAULT ARRAY['in_app']::notification_channel[];
        `);
      } catch (error: any) {
        if (
          !error?.message?.includes("already exists") &&
          !error?.message?.includes("duplicate") &&
          !(error?.message?.includes("column") && error?.message?.includes("already"))
        ) {
          throw error;
        }
      }
    }

    // Check if status column exists (idempotent)
    const statusExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'status'
      );
    `);

    if (!(statusExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "status", {
          type: DataTypes.ENUM("pending", "sent", "delivered", "failed"),
          allowNull: false,
          defaultValue: "pending",
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if metadata column exists (idempotent)
    const metadataExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'metadata'
      );
    `);

    if (!(metadataExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "metadata", {
          type: DataTypes.JSONB,
          allowNull: true,
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if group_key column exists (idempotent)
    const groupKeyExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'group_key'
      );
    `);

    if (!(groupKeyExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "group_key", {
          type: DataTypes.STRING(255),
          allowNull: true,
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if sent_at column exists (idempotent)
    const sentAtExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'sent_at'
      );
    `);

    if (!(sentAtExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "sent_at", {
          type: DataTypes.DATE,
          allowNull: true,
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if delivered_at column exists (idempotent)
    const deliveredAtExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'delivered_at'
      );
    `);

    if (!(deliveredAtExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "delivered_at", {
          type: DataTypes.DATE,
          allowNull: true,
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if failed_at column exists (idempotent)
    const failedAtExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'failed_at'
      );
    `);

    if (!(failedAtExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "failed_at", {
          type: DataTypes.DATE,
          allowNull: true,
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if retry_count column exists (idempotent)
    const retryCountExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'retry_count'
      );
    `);

    if (!(retryCountExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "retry_count", {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Check if error_message column exists (idempotent)
    const errorMessageExists = await queryInterface.sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications' 
        AND column_name = 'error_message'
      );
    `);

    if (!(errorMessageExists[0][0] as any).exists) {
      try {
        await queryInterface.addColumn("notifications", "error_message", {
          type: DataTypes.TEXT,
          allowNull: true,
        });
      } catch (error: any) {
        if (!error?.message?.includes("already exists") && !error?.message?.includes("duplicate")) {
          throw error;
        }
      }
    }

    // Add indexes for new fields
    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_notifications_priority" 
        ON "notifications" ("priority");
      `);
    } catch (error: any) {
      // Ignore if already exists
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_notifications_status" 
        ON "notifications" ("status");
      `);
    } catch (error: any) {
      // Ignore if already exists
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_notifications_group_key" 
        ON "notifications" ("group_key") 
        WHERE "group_key" IS NOT NULL;
      `);
    } catch (error: any) {
      // Ignore if already exists
    }

    try {
      await queryInterface.sequelize.query(`
        CREATE INDEX IF NOT EXISTS "idx_notifications_metadata" 
        ON "notifications" USING GIN ("metadata") 
        WHERE "metadata" IS NOT NULL;
      `);
    } catch (error: any) {
      // Ignore if already exists
    }
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tableExists = await queryInterface.sequelize.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'notifications'
    );
  `);

  if ((tableExists[0][0] as any).exists) {
    // Drop indexes
    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "idx_notifications_metadata";
      `);
    } catch (error: any) {
      // Ignore errors
    }

    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "idx_notifications_group_key";
      `);
    } catch (error: any) {
      // Ignore errors
    }

    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "idx_notifications_status";
      `);
    } catch (error: any) {
      // Ignore errors
    }

    try {
      await queryInterface.sequelize.query(`
        DROP INDEX IF EXISTS "idx_notifications_priority";
      `);
    } catch (error: any) {
      // Ignore errors
    }

    // Remove columns
    const columnsToRemove = [
      "error_message",
      "retry_count",
      "failed_at",
      "delivered_at",
      "sent_at",
      "group_key",
      "metadata",
      "status",
      "channels",
      "priority",
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn("notifications", column);
      } catch (error: any) {
        // Ignore errors during rollback
      }
    }

    // Drop ENUM types
    try {
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS notification_status;
      `);
    } catch (error: any) {
      // Ignore errors
    }

    try {
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS notification_channel;
      `);
    } catch (error: any) {
      // Ignore errors
    }

    try {
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS notification_priority;
      `);
    } catch (error: any) {
      // Ignore errors
    }
  }
}
