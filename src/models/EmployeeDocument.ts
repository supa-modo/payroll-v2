import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Employee from "./Employee";
import User from "./User";

interface EmployeeDocumentAttributes {
  id: string;
  employeeId: string;
  documentType: string;
  documentName: string;
  filePath: string;
  fileSize?: number | null;
  mimeType?: string | null;
  expiryDate?: Date | null;
  isVerified: boolean;
  verifiedBy?: string | null;
  verifiedAt?: Date | null;
  createdAt: Date;
  createdBy?: string | null;
  deletedAt?: Date | null;
}

interface EmployeeDocumentCreationAttributes
  extends Optional<
    EmployeeDocumentAttributes,
    "id" | "fileSize" | "mimeType" | "expiryDate" | "isVerified" | "verifiedBy" | "verifiedAt" | "createdAt" | "createdBy" | "deletedAt"
  > {}

class EmployeeDocument
  extends Model<EmployeeDocumentAttributes, EmployeeDocumentCreationAttributes>
  implements EmployeeDocumentAttributes
{
  declare id: string;
  declare employeeId: string;
  declare documentType: string;
  declare documentName: string;
  declare filePath: string;
  declare fileSize: number | null | undefined;
  declare mimeType: string | null | undefined;
  declare expiryDate: Date | null | undefined;
  declare isVerified: boolean;
  declare verifiedBy: string | null | undefined;
  declare verifiedAt: Date | null | undefined;
  declare readonly createdAt: Date;
  declare createdBy: string | null | undefined;
  declare deletedAt: Date | null | undefined;
}

EmployeeDocument.init(
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
    documentType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "document_type",
    },
    documentName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "document_name",
    },
    filePath: {
      type: DataTypes.STRING(512),
      allowNull: false,
      field: "file_path",
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "file_size",
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "mime_type",
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "expiry_date",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_verified",
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "verified_by",
      references: {
        model: User,
        key: "id",
      },
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "verified_at",
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    },
  },
  {
    sequelize,
    tableName: "employee_documents",
    modelName: "EmployeeDocument",
    paranoid: true,
    indexes: [
      {
        fields: ["employee_id"],
        name: "idx_employee_documents",
        where: {
          deleted_at: null,
        },
      },
    ],
  }
);

export default EmployeeDocument;

