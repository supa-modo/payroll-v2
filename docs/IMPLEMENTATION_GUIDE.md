# Payroll System Implementation Guide

## Overview

This guide provides a comprehensive, prioritized roadmap for implementing the payroll and expense management system. All models from the database schema have been created. This document outlines the next steps for building out the complete system.

## Current Status

### ✅ Completed

**Models (30 total):**

- ✅ Core: Tenant, User, Department, Employee
- ✅ RBAC: Role, Permission, RolePermission, UserRole, RefreshToken
- ✅ Employee Extensions: EmployeeBankDetails, EmployeeDocument
- ✅ Salary: SalaryComponent, EmployeeSalaryComponent, SalaryRevisionHistory
- ✅ Payroll: PayrollPeriod, Payroll, PayrollItem, Payslip
- ✅ Expense: ExpenseCategory, Expense, ExpenseDocument, ExpenseApproval
- ✅ Loans: EmployeeLoan, LoanRepayment
- ✅ System: AuditLog, DataChangeHistory, Notification, NotificationPreference, SystemSetting, StatutoryRate

**Associations:**

- ✅ All model associations defined in `models/index.ts`

**Backend:**

- ✅ Authentication (register, login, refresh, me)
- ✅ Department CRUD
- ✅ Employee CRUD (comprehensive)

**Frontend:**

- ✅ Authentication pages
- ✅ Dashboard layout
- ✅ Employee management UI
- ✅ Department management UI
- ✅ RBAC management UI (roles and permissions)
- ✅ Employee bank details and document management integrated into employee form
- ✅ Salary & Payroll management UI
- ✅ Expense management UI (categories, submission, approvals, my expenses)
- ✅ Loan management UI (loans list, detail, repayment history)

## Implementation Priority

### Phase 1: Complete Foundation (Weeks 1-2)

#### 1.1 RBAC Implementation (Priority: HIGH) ✅

**Backend:**

- [x] ✅ Create Role controller (`controllers/roleController.ts`)

  - ✅ GET /roles - List all roles (with permissions)
  - ✅ POST /roles - Create role
  - ✅ PUT /roles/:id - Update role
  - ✅ DELETE /roles/:id - Delete role (check if system role)
  - ✅ POST /roles/:id/permissions - Assign permissions to role
  - ✅ DELETE /roles/:id/permissions/:permissionId - Remove permission

- [x] ✅ Create Permission controller (`controllers/permissionController.ts`)

  - ✅ GET /permissions - List all permissions (grouped by category)
  - ✅ GET /permissions/:id - Get permission details

- [x] ✅ Create UserRole controller (`controllers/userRoleController.ts`)

  - ✅ GET /users/:userId/roles - Get user roles
  - ✅ POST /users/:userId/roles - Assign role to user
  - ✅ DELETE /users/:userId/roles/:roleId - Remove role from user

- [x] ✅ Create RBAC middleware (`middleware/rbac.ts`)

  - ✅ `checkPermission(permission: string)` - Check if user has permission
  - ✅ `checkRole(role: string)` - Check if user has role
  - ✅ `requirePermission(permission: string)` - Express middleware
  - ✅ `requireRole(role: string)` - Express middleware

- [x] ✅ Create seed script (`server/src/scripts/seedRolesAndPermissions.ts`)
  - ✅ Insert default system roles
  - ✅ Insert all permissions from schema
  - ✅ Assign permissions to default roles

**Frontend:**

- [x] ✅ Role management page (`pages/admin/RolesPage.tsx`)
- [x] ✅ Permission management page (`pages/admin/PermissionsPage.tsx`)
- [x] ✅ User role assignment UI (in user management)

**Dependencies:** None

---

#### 1.2 Employee Extensions (Priority: HIGH) ✅

**Backend:**

- [x] ✅ Create EmployeeBankDetails controller (`controllers/employeeBankDetailsController.ts`)

  - ✅ GET /employees/:employeeId/bank-details - Get bank details
  - ✅ POST /employees/:employeeId/bank-details - Create bank details
  - ✅ PUT /employees/:employeeId/bank-details/:id - Update bank details
  - ✅ DELETE /employees/:employeeId/bank-details/:id - Delete bank details
  - ✅ POST /employees/:employeeId/bank-details/:id/set-primary - Set as primary

- [x] ✅ Create EmployeeDocument controller (`controllers/employeeDocumentController.ts`)

  - ✅ GET /employees/:employeeId/documents - List documents
  - ✅ POST /employees/:employeeId/documents - Upload document
  - ✅ GET /employees/:employeeId/documents/:id - Download document
  - ✅ PUT /employees/:employeeId/documents/:id - Update document metadata
  - ✅ DELETE /employees/:employeeId/documents/:id - Delete document
  - ✅ POST /employees/:employeeId/documents/:id/verify - Verify document

- [x] ✅ Add file upload middleware (`middleware/upload.ts`)
  - ✅ Configure multer for document uploads
  - ✅ File validation (type, size)
  - Cloud storage integration (optional)

**Frontend:**

- [x] ✅ Bank details section in employee form (`components/employees/BankDetailsSection.tsx`)
- [x] ✅ Document management UI (`components/employees/DocumentManager.tsx`)
- [x] ✅ File upload component (`components/ui/FileUpload.tsx`)
- [x] ✅ Integrated bank details and documents into EmployeeFormModal

**Dependencies:** None

---

### Phase 2: Salary & Payroll (Weeks 3-5)

#### 2.1 Salary Configuration (Priority: HIGH)

**Backend:**

- [ ] Create SalaryComponent controller (`controllers/salaryComponentController.ts`)

  - GET /salary-components - List all components
  - POST /salary-components - Create component
  - PUT /salary-components/:id - Update component
  - DELETE /salary-components/:id - Delete component (if not in use)

- [ ] Create EmployeeSalaryComponent controller (`controllers/employeeSalaryController.ts`)
  - GET /employees/:employeeId/salary - Get current salary structure
  - POST /employees/:employeeId/salary - Assign/update salary components
  - GET /employees/:employeeId/salary/history - Get salary revision history
  - POST /employees/:employeeId/salary/revision - Create salary revision

**Frontend:**

- [ ] Salary components management page (`pages/salary/ComponentsPage.tsx`)
- [ ] Employee salary management (`pages/salary/EmployeeSalaryPage.tsx`)
- [ ] Salary revision form (`components/salary/SalaryRevisionForm.tsx`)

**Dependencies:** None

---

#### 2.2 Payroll Processing (Priority: HIGH)

**Backend:**

- [ ] Create PayrollPeriod controller (`controllers/payrollPeriodController.ts`)

  - GET /payroll-periods - List periods
  - POST /payroll-periods - Create period
  - PUT /payroll-periods/:id - Update period
  - POST /payroll-periods/:id/process - Process payroll
  - POST /payroll-periods/:id/approve - Approve payroll
  - POST /payroll-periods/:id/lock - Lock period
  - GET /payroll-periods/:id/summary - Get payroll summary

- [ ] Create Payroll controller (`controllers/payrollController.ts`)

  - GET /payroll-periods/:periodId/payrolls - Get all payrolls for period
  - GET /payrolls/:id - Get payroll details
  - PUT /payrolls/:id - Update payroll (before approval)
  - POST /payrolls/:id/approve - Approve individual payroll
  - POST /payrolls/:id/mark-paid - Mark as paid

- [ ] Create Payslip controller (`controllers/payslipController.ts`)

  - GET /payslips/:id - Get payslip
  - POST /payrolls/:payrollId/generate-payslip - Generate payslip PDF
  - GET /payslips/:id/download - Download payslip PDF

- [ ] Create Payroll Calculation Service (`services/payrollCalculationService.ts`)

  - `calculateGrossPay(employeeId, period)` - Calculate gross pay
  - `calculateStatutoryDeductions(grossPay, employee)` - Calculate PAYE, NSSF, NHIF
  - `calculateInternalDeductions(employeeId, period)` - Calculate loans, advances
  - `calculateNetPay(grossPay, deductions)` - Calculate net pay
  - `processPayrollPeriod(periodId)` - Process entire period

- [ ] Create Statutory Calculation Service (`services/statutoryCalculationService.ts`)

  - `calculatePAYE(taxableIncome, country)` - Calculate PAYE
  - `calculateNSSF(grossPay, country)` - Calculate NSSF
  - `calculateNHIF(grossPay, country)` - Calculate NHIF
  - Load rates from StatutoryRate model

- [ ] Create PDF Generation Service (`services/payslipGeneratorService.ts`)
  - Generate payslip PDF using PDFKit or similar
  - Include company branding
  - Include all salary components breakdown

**Frontend:**

- [ ] Payroll periods page (`pages/payroll/PeriodsPage.tsx`)
- [ ] Payroll processing workflow (`pages/payroll/ProcessPayrollPage.tsx`)
- [ ] Payroll review/approval page (`pages/payroll/ReviewPayrollPage.tsx`)
- [ ] Payslip viewer (`pages/payroll/PayslipViewer.tsx`)

**Dependencies:** Salary Configuration (2.1)

---

### Phase 3: Expense Management (Weeks 6-7)

#### 3.1 Expense Categories (Priority: MEDIUM)

**Backend:**

- [ ] Create ExpenseCategory controller (`controllers/expenseCategoryController.ts`)
  - GET /expense-categories - List categories
  - POST /expense-categories - Create category
  - PUT /expense-categories/:id - Update category
  - DELETE /expense-categories/:id - Delete category

**Frontend:**

- [ ] Expense categories page (`pages/expenses/CategoriesPage.tsx`)

**Dependencies:** None

---

#### 3.2 Expense Submission & Approval (Priority: HIGH)

**Backend:**

- [ ] Create Expense controller (`controllers/expenseController.ts`)

  - GET /expenses - List expenses (with filters)
  - POST /expenses - Submit expense
  - GET /expenses/:id - Get expense details
  - PUT /expenses/:id - Update expense (if draft)
  - DELETE /expenses/:id - Delete expense (if draft)
  - POST /expenses/:id/submit - Submit for approval
  - POST /expenses/:id/approve - Approve expense
  - POST /expenses/:id/reject - Reject expense
  - POST /expenses/:id/mark-paid - Mark as paid

- [ ] Create ExpenseApproval controller (`controllers/expenseApprovalController.ts`)

  - GET /expenses/:expenseId/approvals - Get approval history
  - POST /expenses/:expenseId/approve - Create approval record

- [ ] Create ExpenseDocument controller (`controllers/expenseDocumentController.ts`)
  - POST /expenses/:expenseId/documents - Upload receipt
  - GET /expenses/:expenseId/documents/:id - Download document
  - DELETE /expenses/:expenseId/documents/:id - Delete document

**Frontend:**

- [ ] Expense submission form (`pages/expenses/SubmitExpensePage.tsx`)
- [ ] Expense list page (`pages/expenses/ExpensesPage.tsx`)
- [ ] Expense detail/approval page (`pages/expenses/ExpenseDetailPage.tsx`)
- [ ] My expenses page (`pages/expenses/MyExpensesPage.tsx`)

**Dependencies:** Expense Categories (3.1)

---

### Phase 4: Loans & Advances (Week 8)

#### 4.1 Loan Management (Priority: MEDIUM) ✅

**Backend:**

- [x] ✅ Create EmployeeLoan controller (`controllers/employeeLoanController.ts`)

  - ✅ GET /loans - List loans (with filters)
  - ✅ POST /loans - Create loan
  - ✅ GET /loans/:id - Get loan details
  - ✅ PUT /loans/:id - Update loan
  - ✅ POST /loans/:id/approve - Approve loan
  - ✅ POST /loans/:id/complete - Mark as completed

- [x] ✅ Create LoanRepayment controller (`controllers/loanRepaymentController.ts`)

  - ✅ GET /loans/:loanId/repayments - Get repayment history
  - ✅ POST /loans/:loanId/repayments - Record manual repayment

- [x] ✅ Integrate loan deductions into payroll calculation
  - ✅ Update `payrollCalculationService.ts` to include loan deductions

**Frontend:**

- [x] ✅ Loan management page (`pages/loans/LoansPage.tsx`)
- [x] ✅ Loan creation form (`components/loans/LoanForm.tsx`)
- [x] ✅ Loan repayment history (`components/loans/RepaymentHistory.tsx`)

**Dependencies:** Payroll Processing (2.2)

---

### Phase 5: System Features (Weeks 9-10)

#### 5.1 Audit & Compliance (Priority: MEDIUM)

**Backend:**

- [ ] Create AuditLog controller (`controllers/auditLogController.ts`)

  - GET /audit-logs - List audit logs (with filters)
  - GET /audit-logs/:id - Get audit log details

- [ ] Create audit logging middleware (`middleware/audit.ts`)

  - Log all create/update/delete operations
  - Include user, IP, timestamp, changes

- [ ] Create DataChangeHistory service (`services/dataChangeHistoryService.ts`)
  - Track field-level changes for sensitive data
  - Store old/new values with reason

**Frontend:**

- [ ] Audit log viewer (`pages/admin/AuditLogsPage.tsx`)
- [ ] Data change history viewer (`pages/admin/DataChangeHistoryPage.tsx`)

**Dependencies:** None

---

#### 5.2 Notifications (Priority: MEDIUM)

**Backend:**

- [ ] Create Notification controller (`controllers/notificationController.ts`)

  - GET /notifications - Get user notifications
  - PUT /notifications/:id/read - Mark as read
  - PUT /notifications/read-all - Mark all as read
  - DELETE /notifications/:id - Delete notification

- [ ] Create NotificationPreference controller (`controllers/notificationPreferenceController.ts`)

  - GET /notification-preferences - Get preferences
  - PUT /notification-preferences - Update preferences

- [ ] Create Notification Service (`services/notificationService.ts`)
  - `createNotification(userId, type, title, message, entityType, entityId)`
  - `sendEmailNotification(userId, type, data)`
  - `sendInAppNotification(userId, notification)`

**Frontend:**

- [ ] Notification center (`components/notifications/NotificationCenter.tsx`)
- [ ] Notification preferences page (`pages/settings/NotificationPreferences.tsx`)

**Dependencies:** None

---

#### 5.3 System Settings (Priority: LOW)

**Backend:**

- [ ] Create SystemSetting controller (`controllers/systemSettingController.ts`)

  - GET /settings - Get all settings
  - GET /settings/:key - Get setting by key
  - PUT /settings/:key - Update setting

- [ ] Create StatutoryRate controller (`controllers/statutoryRateController.ts`)
  - GET /statutory-rates - List rates
  - POST /statutory-rates - Create rate
  - PUT /statutory-rates/:id - Update rate

**Frontend:**

- [ ] System settings page (`pages/admin/SettingsPage.tsx`)
- [ ] Statutory rates configuration (`pages/admin/StatutoryRatesPage.tsx`)

**Dependencies:** None

---

## Implementation Checklist

### Immediate Next Steps (This Week)

1. **RBAC Implementation**

   - [ ] Create Role controller and routes
   - [ ] Create Permission controller and routes
   - [ ] Create UserRole controller and routes
   - [ ] Create RBAC middleware
   - [ ] Create seed script for roles/permissions
   - [ ] Test RBAC system

2. **Employee Extensions**
   - [ ] Create EmployeeBankDetails controller and routes
   - [ ] Create EmployeeDocument controller and routes
   - [ ] Add file upload middleware
   - [ ] Update employee form to include bank details
   - [ ] Add document management UI

### Short-term (Next 2 Weeks)

3. **Salary Configuration**

   - [ ] Create SalaryComponent controller
   - [ ] Create EmployeeSalaryComponent controller
   - [ ] Build salary management UI

4. **Payroll Foundation**
   - [ ] Create PayrollPeriod controller
   - [ ] Create Payroll controller
   - [ ] Create payroll calculation service
   - [ ] Create statutory calculation service

### Medium-term (Weeks 3-8)

5. **Expense Management**

   - [ ] Complete expense system
   - [ ] Build approval workflows
   - [ ] Add document handling

6. **Loans & Advances** ✅
   - [x] ✅ Complete loan management
   - [x] ✅ Integrate with payroll

### Long-term (Weeks 9+)

7. **Advanced Features**
   - [ ] Audit logging
   - [ ] Notifications
   - [ ] System settings
   - [x] ✅ Reports & Analytics (Week 12 - Completed)

## Testing Strategy

### Unit Tests

- [ ] Test all calculation services
- [ ] Test RBAC middleware
- [ ] Test validation logic

### Integration Tests

- [ ] Test payroll processing end-to-end
- [ ] Test expense approval workflow
- [ ] Test loan deduction integration

### E2E Tests

- [ ] Test complete payroll cycle
- [ ] Test expense submission and approval
- [ ] Test user role assignment

## Notes

- All models are created and associations are defined
- Focus on one module at a time
- Test thoroughly before moving to next module
- Follow existing code patterns
- Ensure proper error handling
- Add validation for all inputs
- Implement proper authorization checks

## Dependencies Map

```
RBAC → Employee Extensions → Salary → Payroll → Loans
                                    ↓
                              Expense Management
                                    ↓
                              System Features
```

## Success Criteria

- [ ] All CRUD operations work for all entities
- [ ] Payroll can be processed end-to-end
- [ ] Expenses can be submitted and approved
- [ ] Loans are deducted from payroll
- [ ] All audit logs are created
- [ ] Notifications are sent appropriately
- [ ] System is production-ready
