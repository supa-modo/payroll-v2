import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";
import Expense from "./Expense";
import User from "./User";

interface ExpenseDocumentAttributes {
  id: string;
  expenseId: string;
  documentType: string;
  fileName: string;
  filePath: string;
  fileSize?: number | null;
  mimeType?: string | null;
  createdAt: Date;
  createdBy?: string | null;
}

interface ExpenseDocumentCreationAttributes
  extends Optional<
    ExpenseDocumentAttributes,
    "id" | "documentType" | "fileSize" | "mimeType" | "createdAt" | "createdBy"
  > {}

class ExpenseDocument
  extends Model<ExpenseDocumentAttributes, ExpenseDocumentCreationAttributes>
  implements ExpenseDocumentAttributes
{
  declare id: string;
  declare expenseId: string;
  declare documentType: string;
  declare fileName: string;
  declare filePath: string;
  declare fileSize: number | null | undefined;
  declare mimeType: string | null | undefined;
  declare readonly createdAt: Date;
  declare createdBy: string | null | undefined;
}

ExpenseDocument.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    expenseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "expense_id",
      references: {
        model: Expense,
        key: "id",
      },
    },
    documentType: {
      type: DataTypes.STRING(20),
      defaultValue: "receipt",
      field: "document_type",
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "file_name",
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
    tableName: "expense_documents",
    modelName: "ExpenseDocument",
    timestamps: false,
    indexes: [
      {
        fields: ["expense_id"],
        name: "idx_expense_documents_expense",
      },
    ],
  }
);

export default ExpenseDocument;

