import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../config/database";

interface EmployeeAttributes {
  id: string;
  tenantId: string;
  userId?: string;
  departmentId?: string;
  employeeNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: string;
  maritalStatus?: string;
  nationality?: string;
  photoUrl?: string;
  personalEmail?: string;
  workEmail?: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  country?: string;
  nationalId?: string;
  passportNumber?: string;
  kraPin?: string;
  nssfNumber?: string;
  nhifNumber?: string;
  employmentType: string;
  jobTitle: string;
  jobGrade?: string;
  hireDate: Date;
  probationEndDate?: Date;
  contractEndDate?: Date;
  terminationDate?: Date;
  terminationReason?: string;
  status?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

interface EmployeeCreationAttributes extends Optional<
  EmployeeAttributes,
  | "id"
  | "userId"
  | "departmentId"
  | "middleName"
  | "dateOfBirth"
  | "gender"
  | "maritalStatus"
  | "nationality"
  | "photoUrl"
  | "personalEmail"
  | "workEmail"
  | "phonePrimary"
  | "phoneSecondary"
  | "addressLine1"
  | "addressLine2"
  | "city"
  | "county"
  | "postalCode"
  | "country"
  | "nationalId"
  | "passportNumber"
  | "kraPin"
  | "nssfNumber"
  | "nhifNumber"
  | "jobGrade"
  | "probationEndDate"
  | "contractEndDate"
  | "terminationDate"
  | "terminationReason"
  | "status"
  | "emergencyContactName"
  | "emergencyContactPhone"
  | "emergencyContactRelationship"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "createdBy"
  | "updatedBy"
> {}

class Employee
  extends Model<EmployeeAttributes, EmployeeCreationAttributes>
  implements EmployeeAttributes
{
  declare id: string;
  declare tenantId: string;
  declare userId: string | undefined;
  declare departmentId: string | undefined;
  declare employeeNumber: string;
  declare firstName: string;
  declare middleName: string | undefined;
  declare lastName: string;
  declare dateOfBirth: Date | undefined;
  declare gender: string | undefined;
  declare maritalStatus: string | undefined;
  declare nationality: string | undefined;
  declare photoUrl: string | undefined;
  declare personalEmail: string | undefined;
  declare workEmail: string | undefined;
  declare phonePrimary: string | undefined;
  declare phoneSecondary: string | undefined;
  declare addressLine1: string | undefined;
  declare addressLine2: string | undefined;
  declare city: string | undefined;
  declare county: string | undefined;
  declare postalCode: string | undefined;
  declare country: string | undefined;
  declare nationalId: string | undefined;
  declare passportNumber: string | undefined;
  declare kraPin: string | undefined;
  declare nssfNumber: string | undefined;
  declare nhifNumber: string | undefined;
  declare employmentType: string;
  declare jobTitle: string;
  declare jobGrade: string | undefined;
  declare hireDate: Date;
  declare probationEndDate: Date | undefined;
  declare contractEndDate: Date | undefined;
  declare terminationDate: Date | undefined;
  declare terminationReason: string | undefined;
  declare status: string | undefined;
  declare emergencyContactName: string | undefined;
  declare emergencyContactPhone: string | undefined;
  declare emergencyContactRelationship: string | undefined;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt: Date | undefined;
  declare createdBy: string | undefined;
  declare updatedBy: string | undefined;

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

Employee.init(
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
        model: "tenants",
        key: "id",
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "department_id",
      references: {
        model: "departments",
        key: "id",
      },
    },
    employeeNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      field: "employee_number",
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name",
    },
    middleName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "middle_name",
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "last_name",
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "date_of_birth",
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    maritalStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "marital_status",
    },
    nationality: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    photoUrl: {
      type: DataTypes.STRING(512),
      allowNull: true,
      field: "photo_url",
    },
    personalEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "personal_email",
    },
    workEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "work_email",
    },
    phonePrimary: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "phone_primary",
    },
    phoneSecondary: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "phone_secondary",
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "address_line1",
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "address_line2",
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    county: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    postalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "postal_code",
    },
    country: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: "Kenya",
    },
    nationalId: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "national_id",
    },
    passportNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "passport_number",
    },
    kraPin: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "kra_pin",
    },
    nssfNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "nssf_number",
    },
    nhifNumber: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "nhif_number",
    },
    employmentType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "employment_type",
    },
    jobTitle: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "job_title",
    },
    jobGrade: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "job_grade",
    },
    hireDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "hire_date",
    },
    probationEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "probation_end_date",
    },
    contractEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "contract_end_date",
    },
    terminationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: "termination_date",
    },
    terminationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "termination_reason",
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: "active",
    },
    emergencyContactName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "emergency_contact_name",
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "emergency_contact_phone",
    },
    emergencyContactRelationship: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "emergency_contact_relationship",
    },
    createdAt: {
      type: DataTypes.DATE,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: "updated_at",
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "deleted_at",
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "created_by",
    },
    updatedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: "updated_by",
    },
  },
  {
    sequelize,
    tableName: "employees",
    modelName: "Employee",
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ["tenant_id", "employee_number"],
        name: "employees_tenant_number_unique",
      },
      {
        fields: ["tenant_id"],
        name: "idx_employees_tenant",
      },
      {
        fields: ["department_id"],
        name: "idx_employees_department",
      },
      {
        fields: ["tenant_id", "department_id"],
        name: "idx_employees_tenant_department",
      },
      {
        fields: ["tenant_id", "status"],
        name: "idx_employees_tenant_status",
      },
      {
        fields: ["tenant_id", "employment_type"],
        name: "idx_employees_tenant_employment_type",
      },
    ],
  }
);

export default Employee;
