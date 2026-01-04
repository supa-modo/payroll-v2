import { DataTypes, Model, Optional, Op } from "sequelize";
import { sequelize } from "../config/database";
import bcrypt from "bcryptjs";

interface UserAttributes {
  id: string;
  tenantId: string | null;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  isSystemAdmin: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface UserCreationAttributes extends Optional<
  UserAttributes,
  "id" | "isActive" | "isEmailVerified" | "role" | "isSystemAdmin" | "createdAt" | "updatedAt" | "tenantId"
> {}

class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: string;
  declare tenantId: string | null;
  declare email: string;
  declare password: string;
  declare firstName: string;
  declare lastName: string;
  declare phone: string | undefined;
  declare avatarUrl: string | undefined;
  declare role: string;
  declare isActive: boolean;
  declare isEmailVerified: boolean;
  declare isSystemAdmin: boolean;
  declare lastLoginAt: Date | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  public async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public checkIsActive(): boolean {
    return this.isActive;
  }

  public toJSON(): object {
    const values = { ...this.get() };
    delete (values as any).password;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenantId: {
      type: DataTypes.UUID,
      allowNull: true, // System admins don't have tenantId
      field: "tenant_id",
      references: {
        model: "tenants",
        key: "id",
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "last_name",
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    avatarUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "avatar_url",
    },
    role: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "employee",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_email_verified",
    },
    isSystemAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_system_admin",
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_login_at",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
  },
  {
    sequelize,
    tableName: "users",
    modelName: "User",
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "email"],
        name: "users_tenant_email_unique",
        where: {
          tenant_id: { [Op.ne]: null },
        },
      },
      {
        fields: ["is_system_admin"],
        name: "idx_users_is_system_admin",
        where: {
          is_system_admin: true,
        },
      },
    ],
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

export default User;
