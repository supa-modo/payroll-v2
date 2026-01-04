import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface TenantAttributes {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  settings: Record<string, any>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TenantCreationAttributes
  extends Optional<
    TenantAttributes,
    "id" | "settings" | "isActive" | "createdAt" | "updatedAt"
  > {}

class Tenant
  extends Model<TenantAttributes, TenantCreationAttributes>
  implements TenantAttributes
{
  declare id: string;
  declare name: string;
  declare slug: string;
  declare email: string;
  declare phone: string | null;
  declare address: string | null;
  declare logoUrl: string | null;
  declare settings: Record<string, any>;
  declare isActive: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Tenant.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    logoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: "logo_url",
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
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
  },
  {
    sequelize,
    tableName: "tenants",
    modelName: "Tenant",
  }
);

export default Tenant;

