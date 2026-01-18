// Core Models
import Tenant from "./Tenant";
import User from "./User";
import Department from "./Department";
import Employee from "./Employee";

// RBAC Models
import Role from "./Role";
import Permission from "./Permission";
import RolePermission from "./RolePermission";
import UserRole from "./UserRole";
import RefreshToken from "./RefreshToken";

// Employee Extensions
import EmployeeBankDetails from "./EmployeeBankDetails";
import EmployeeDocument from "./EmployeeDocument";

// Salary & Payroll Models
import SalaryComponent from "./SalaryComponent";
import EmployeeSalaryComponent from "./EmployeeSalaryComponent";
import SalaryRevisionHistory from "./SalaryRevisionHistory";
import PayrollPeriod from "./PayrollPeriod";
import Payroll from "./Payroll";
import PayrollItem from "./PayrollItem";
import Payslip from "./Payslip";

// Expense Models
import ExpenseCategory from "./ExpenseCategory";
import Expense from "./Expense";
import ExpenseDocument from "./ExpenseDocument";
import ExpenseApproval from "./ExpenseApproval";

// Loan Models
import EmployeeLoan from "./EmployeeLoan";
import LoanRepayment from "./LoanRepayment";

// System Models
import AuditLog from "./AuditLog";
import DataChangeHistory from "./DataChangeHistory";
import Notification from "./Notification";
import NotificationPreference from "./NotificationPreference";
import SystemSetting from "./SystemSetting";
import StatutoryRate from "./StatutoryRate";

// ============================================
// ASSOCIATIONS
// ============================================

// Tenant Associations
Tenant.hasMany(User, { foreignKey: "tenantId", as: "users" });
Tenant.hasMany(Department, { foreignKey: "tenantId", as: "departments" });
Tenant.hasMany(Employee, { foreignKey: "tenantId", as: "employees" });
Tenant.hasMany(SalaryComponent, { foreignKey: "tenantId", as: "salaryComponents" });
Tenant.hasMany(PayrollPeriod, { foreignKey: "tenantId", as: "payrollPeriods" });
Tenant.hasMany(ExpenseCategory, { foreignKey: "tenantId", as: "expenseCategories" });
Tenant.hasMany(Expense, { foreignKey: "tenantId", as: "expenses" });
Tenant.hasMany(EmployeeLoan, { foreignKey: "tenantId", as: "employeeLoans" });
Tenant.hasMany(AuditLog, { foreignKey: "tenantId", as: "auditLogs" });
Tenant.hasMany(DataChangeHistory, { foreignKey: "tenantId", as: "dataChangeHistory" });
Tenant.hasMany(Notification, { foreignKey: "tenantId", as: "notifications" });
Tenant.hasMany(SystemSetting, { foreignKey: "tenantId", as: "systemSettings" });

// User Associations
User.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
User.hasOne(Employee, { foreignKey: "userId", as: "employee" });
User.hasMany(UserRole, { foreignKey: "userId", as: "userRoles" });
User.hasMany(RefreshToken, { foreignKey: "userId", as: "refreshTokens" });
User.hasMany(EmployeeDocument, { foreignKey: "createdBy", as: "createdDocuments" });
User.hasMany(EmployeeDocument, { foreignKey: "verifiedBy", as: "verifiedDocuments" });
User.hasMany(SalaryRevisionHistory, { foreignKey: "approvedBy", as: "approvedSalaryRevisions" });
User.hasMany(PayrollPeriod, { foreignKey: "lockedBy", as: "lockedPayrollPeriods" });
User.hasMany(PayrollPeriod, { foreignKey: "processedBy", as: "processedPayrollPeriods" });
User.hasMany(PayrollPeriod, { foreignKey: "approvedBy", as: "approvedPayrollPeriods" });
User.hasMany(Payslip, { foreignKey: "generatedBy", as: "generatedPayslips" });
User.hasMany(Expense, { foreignKey: "rejectedBy", as: "rejectedExpenses" });
User.hasMany(Expense, { foreignKey: "paidBy", as: "paidExpenses" });
User.hasMany(ExpenseApproval, { foreignKey: "approverId", as: "expenseApprovals" });
User.hasMany(EmployeeLoan, { foreignKey: "approvedBy", as: "approvedLoans" });
User.hasMany(AuditLog, { foreignKey: "userId", as: "auditLogs" });
User.hasMany(DataChangeHistory, { foreignKey: "changedBy", as: "dataChanges" });
User.hasOne(NotificationPreference, { foreignKey: "userId", as: "notificationPreference" });
User.hasMany(Notification, { foreignKey: "userId", as: "notifications" });
User.hasMany(SystemSetting, { foreignKey: "updatedBy", as: "updatedSettings" });

// Department Associations
Department.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
Department.belongsTo(Department, {
  foreignKey: "parentDepartmentId",
  as: "parentDepartment",
});
Department.hasMany(Department, {
  foreignKey: "parentDepartmentId",
  as: "subDepartments",
});
Department.belongsTo(Employee, {
  foreignKey: "managerId",
  as: "manager",
});
Department.hasMany(Employee, { foreignKey: "departmentId", as: "employees" });
Department.hasMany(UserRole, { foreignKey: "departmentId", as: "userRoles" });
Department.hasMany(Expense, { foreignKey: "departmentId", as: "expenses" });

// Employee Associations
Employee.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
Employee.belongsTo(User, { foreignKey: "userId", as: "user" });
Employee.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
Employee.hasMany(EmployeeBankDetails, { foreignKey: "employeeId", as: "bankDetails" });
Employee.hasMany(EmployeeDocument, { foreignKey: "employeeId", as: "documents" });
Employee.hasMany(EmployeeSalaryComponent, { foreignKey: "employeeId", as: "salaryComponents" });
Employee.hasMany(SalaryRevisionHistory, { foreignKey: "employeeId", as: "salaryRevisions" });
Employee.hasMany(Payroll, { foreignKey: "employeeId", as: "payrolls" });
Employee.hasMany(Expense, { foreignKey: "employeeId", as: "expenses" });
Employee.hasMany(EmployeeLoan, { foreignKey: "employeeId", as: "loans" });
Employee.hasMany(Department, { foreignKey: "managerId", as: "managedDepartments" });

// Role Associations
Role.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
  otherKey: "permissionId",
  as: "permissions",
});
Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  otherKey: "userId",
  as: "users",
});
Role.hasMany(UserRole, { foreignKey: "roleId", as: "userRoles" });
Role.hasMany(RolePermission, { foreignKey: "roleId", as: "rolePermissions" });

// Permission Associations
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
  otherKey: "roleId",
  as: "roles",
});
Permission.hasMany(RolePermission, { foreignKey: "permissionId", as: "rolePermissions" });

// RolePermission Associations (Junction Table)
RolePermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });
RolePermission.belongsTo(Permission, { foreignKey: "permissionId", as: "permission" });

// UserRole Associations (Junction Table)
UserRole.belongsTo(User, { foreignKey: "userId", as: "user" });
UserRole.belongsTo(Role, { foreignKey: "roleId", as: "role" });
UserRole.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
UserRole.belongsTo(User, { foreignKey: "assignedBy", as: "assignedByUser" });

// RefreshToken Associations
RefreshToken.belongsTo(User, { foreignKey: "userId", as: "user" });

// EmployeeBankDetails Associations
EmployeeBankDetails.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
EmployeeBankDetails.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
EmployeeBankDetails.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// EmployeeDocument Associations
EmployeeDocument.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
EmployeeDocument.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
EmployeeDocument.belongsTo(User, { foreignKey: "verifiedBy", as: "verifier" });

// SalaryComponent Associations
SalaryComponent.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
SalaryComponent.belongsTo(SalaryComponent, {
  foreignKey: "percentageOf",
  as: "percentageOfComponent",
});
SalaryComponent.hasMany(EmployeeSalaryComponent, {
  foreignKey: "salaryComponentId",
  as: "employeeSalaryComponents",
});
SalaryComponent.hasMany(PayrollItem, {
  foreignKey: "salaryComponentId",
  as: "payrollItems",
});
SalaryComponent.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
SalaryComponent.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// EmployeeSalaryComponent Associations
EmployeeSalaryComponent.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
EmployeeSalaryComponent.belongsTo(SalaryComponent, {
  foreignKey: "salaryComponentId",
  as: "salaryComponent",
});
EmployeeSalaryComponent.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
EmployeeSalaryComponent.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// SalaryRevisionHistory Associations
SalaryRevisionHistory.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
SalaryRevisionHistory.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });
SalaryRevisionHistory.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// PayrollPeriod Associations
PayrollPeriod.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
PayrollPeriod.hasMany(Payroll, { foreignKey: "payrollPeriodId", as: "payrolls" });
PayrollPeriod.belongsTo(User, { foreignKey: "lockedBy", as: "lockedByUser" });
PayrollPeriod.belongsTo(User, { foreignKey: "processedBy", as: "processedByUser" });
PayrollPeriod.belongsTo(User, { foreignKey: "approvedBy", as: "approvedByUser" });
PayrollPeriod.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
PayrollPeriod.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// Payroll Associations
Payroll.belongsTo(PayrollPeriod, { foreignKey: "payrollPeriodId", as: "payrollPeriod" });
Payroll.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Payroll.hasMany(PayrollItem, { foreignKey: "payrollId", as: "items" });
Payroll.hasOne(Payslip, { foreignKey: "payrollId", as: "payslip" });
Payroll.hasMany(LoanRepayment, { foreignKey: "payrollId", as: "loanRepayments" });

// PayrollItem Associations
PayrollItem.belongsTo(Payroll, { foreignKey: "payrollId", as: "payroll" });
PayrollItem.belongsTo(SalaryComponent, {
  foreignKey: "salaryComponentId",
  as: "salaryComponent",
});

// Payslip Associations
Payslip.belongsTo(Payroll, { foreignKey: "payrollId", as: "payroll" });
Payslip.belongsTo(User, { foreignKey: "generatedBy", as: "generator" });

// ExpenseCategory Associations
ExpenseCategory.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
ExpenseCategory.hasMany(Expense, { foreignKey: "categoryId", as: "expenses" });
ExpenseCategory.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
ExpenseCategory.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// Expense Associations
Expense.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
Expense.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
Expense.belongsTo(ExpenseCategory, { foreignKey: "categoryId", as: "category" });
Expense.belongsTo(Department, { foreignKey: "departmentId", as: "department" });
Expense.hasMany(ExpenseDocument, { foreignKey: "expenseId", as: "documents" });
Expense.hasMany(ExpenseApproval, { foreignKey: "expenseId", as: "approvals" });
Expense.belongsTo(User, { foreignKey: "rejectedBy", as: "rejectedByUser" });
Expense.belongsTo(User, { foreignKey: "paidBy", as: "paidByUser" });
Expense.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
Expense.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// ExpenseDocument Associations
ExpenseDocument.belongsTo(Expense, { foreignKey: "expenseId", as: "expense" });
ExpenseDocument.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// ExpenseApproval Associations
ExpenseApproval.belongsTo(Expense, { foreignKey: "expenseId", as: "expense" });
ExpenseApproval.belongsTo(User, { foreignKey: "approverId", as: "approver" });

// EmployeeLoan Associations
EmployeeLoan.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
EmployeeLoan.belongsTo(Employee, { foreignKey: "employeeId", as: "employee" });
EmployeeLoan.hasMany(LoanRepayment, { foreignKey: "loanId", as: "repayments" });
EmployeeLoan.belongsTo(User, { foreignKey: "approvedBy", as: "approver" });
EmployeeLoan.belongsTo(User, { foreignKey: "createdBy", as: "creator" });
EmployeeLoan.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// LoanRepayment Associations
LoanRepayment.belongsTo(EmployeeLoan, { foreignKey: "loanId", as: "loan" });
LoanRepayment.belongsTo(Payroll, { foreignKey: "payrollId", as: "payroll" });
LoanRepayment.belongsTo(User, { foreignKey: "createdBy", as: "creator" });

// AuditLog Associations
AuditLog.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
AuditLog.belongsTo(User, { foreignKey: "userId", as: "user" });

// DataChangeHistory Associations
DataChangeHistory.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
DataChangeHistory.belongsTo(User, { foreignKey: "changedBy", as: "changedByUser" });

// Notification Associations
Notification.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
Notification.belongsTo(User, { foreignKey: "userId", as: "user" });

// NotificationPreference Associations
NotificationPreference.belongsTo(User, { foreignKey: "userId", as: "user" });

// SystemSetting Associations
SystemSetting.belongsTo(Tenant, { foreignKey: "tenantId", as: "tenant" });
SystemSetting.belongsTo(User, { foreignKey: "updatedBy", as: "updater" });

// Export all models
export {
  // Core
  Tenant,
  User,
  Department,
  Employee,
  // RBAC
  Role,
  Permission,
  RolePermission,
  UserRole,
  RefreshToken,
  // Employee Extensions
  EmployeeBankDetails,
  EmployeeDocument,
  // Salary & Payroll
  SalaryComponent,
  EmployeeSalaryComponent,
  SalaryRevisionHistory,
  PayrollPeriod,
  Payroll,
  PayrollItem,
  Payslip,
  // Expense
  ExpenseCategory,
  Expense,
  ExpenseDocument,
  ExpenseApproval,
  // Loans
  EmployeeLoan,
  LoanRepayment,
  // System
  AuditLog,
  DataChangeHistory,
  Notification,
  NotificationPreference,
  SystemSetting,
  StatutoryRate,
};

// Export Sequelize utilities
export { Op } from "sequelize";