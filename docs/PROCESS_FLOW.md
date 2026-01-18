# Payroll System - Process Flow Documentation

## Overview

This document outlines the complete process flow for the Payroll & Expense Management System, from initial company registration through daily operations.

---

## 1. System Initialization & Setup

### 1.1 Company Registration

**Flow:**

1. User visits registration page
2. Fills in company details:
   - Organization name
   - Organization subdomain (unique identifier)
   - Admin user details (first name, last name, email, password)
3. System creates:
   - New tenant record
   - Admin user account
   - Tenant-specific "Admin" role with all permissions
   - Links admin user to Admin role
4. User is automatically logged in
5. System redirects to onboarding wizard (first-time setup) or dashboard

**Key Points:**

- The first user created during registration is automatically assigned the "Admin" role
- This admin has full system access for their tenant
- System admin can also create tenants via the system admin interface

### 1.2 Onboarding Wizard (First-Time Setup)

**Flow:**

1. After registration, new tenants are guided through onboarding
2. **Step 1: Welcome** - Introduction and overview
3. **Step 2: Departments** - Create organizational departments
   - Add department names and optional codes
   - Can add multiple departments
   - Can skip and add later
4. **Step 3: Employees** - Add first employees
   - Enter employee basic information
   - Assign to departments
   - Can add multiple employees
   - Can skip and add later
5. **Step 4: Salary Components** - Configure salary structure
   - Pre-filled with common components (Basic Salary, PAYE, NSSF, NHIF)
   - Can modify or add more
   - Can skip and configure later
6. **Step 5: Complete** - Setup summary and next steps
7. Redirect to dashboard

**Key Points:**

- Onboarding is optional - users can skip steps
- All setup can be done later from respective pages
- Onboarding helps new users get started quickly

---

## 2. Employee Management

### 2.1 Creating an Employee

**Flow:**

1. Navigate to Employees page
2. Click "Add Employee" button
3. Fill in employee form with multiple sections:

   **Section 1: Personal Information**

   - First name, middle name, last name
   - Date of birth
   - Gender, marital status, nationality
   - Photo upload

   **Section 2: Contact Information**

   - Personal email
   - Work email (required if creating user account)
   - Primary and secondary phone numbers

   **Section 3: Address Information**

   - Address lines, city, county, postal code, country

   **Section 4: Identification**

   - National ID, passport number
   - KRA PIN, NSSF number, NHIF number

   **Section 5: Employment Details**

   - Job title, job grade
   - Department assignment
   - Employment type (permanent, contract, casual, intern)
   - Hire date, probation end date, contract end date (if applicable)

   **Section 6: Emergency Contact**

   - Contact name, phone, relationship

   **Section 7: User Account & Role Assignment** (NEW - Only for new employees)

   - Checkbox: "Create user account for this employee"
   - If checked:
     - Select role from available roles
     - Enter password (minimum 8 characters)
     - User account will be created using work email
     - Role will be assigned to the user
     - Employee will be linked to the user account

4. Click "Create Employee"
5. System creates:
   - Employee record
   - (Optional) User account if requested
   - (Optional) User-role assignment if user account created
   - Links employee to user account if created
6. Success message displayed
7. Form remains open to add:
   - Bank details (Section 8)
   - Documents (Section 9)

**Key Points:**

- Employee creation and user account creation are now integrated
- Role assignment happens during employee creation (if user account is created)
- Employees can be created without user accounts (for manual payroll entry)
- User accounts can be created later if needed
- Work email is required if creating a user account

### 2.2 Editing an Employee

**Flow:**

1. Navigate to Employees page
2. Click edit icon on employee row
3. Employee form opens with existing data
4. User account section is NOT shown (user accounts managed separately)
5. Make changes
6. Click "Update Employee"
7. Changes saved

### 2.3 Managing Employee Bank Details

**Flow:**

1. Open employee form (create or edit)
2. After employee is created, "Bank Details" section appears
3. Add bank account information:
   - Payment method (Bank Transfer, M-Pesa)
   - Bank name, branch, account number
   - Account name
   - SWIFT code (for international)
   - M-Pesa phone and name (if applicable)
   - Mark as primary
4. Can add multiple bank details
5. Changes saved immediately

### 2.4 Managing Employee Documents

**Flow:**

1. Open employee form (create or edit)
2. After employee is created, "Documents" section appears
3. Upload documents:
   - Click "Upload Document"
   - Select file
   - Enter document type and description
   - Upload
4. View, download, or delete existing documents
5. Changes saved immediately

---

## 3. Role & Permission Management

### 3.1 Role Assignment During Employee Creation

**Flow:**

1. When creating a new employee, check "Create user account"
2. Select a role from the dropdown
3. Enter password
4. System automatically:
   - Creates user account
   - Assigns selected role to user
   - Links employee to user account
   - Assigns role with department scope (if department selected)

**Key Points:**

- Role assignment is now part of employee creation workflow
- Simplifies the process - no need to create user separately
- Role is assigned with department scope if employee has a department

### 3.2 Manual Role Assignment

**Flow:**

1. Navigate to Admin > Roles
2. Select user
3. Click "Assign Role"
4. Select role and optional department
5. Role assigned

---

## 4. Payroll Processing

### 4.1 Creating a Payroll Period

**Flow:**

1. Navigate to Payroll > Periods
2. Click "Create Period"
3. Enter:
   - Period name
   - Start date
   - End date
   - Pay date
4. System validates:
   - No overlapping periods
   - Dates are valid
5. Period created with status "draft"

### 4.2 Processing Payroll

**Flow:**

1. Select a payroll period
2. Click "Process Payroll"
3. System:
   - Calculates gross pay for all active employees
   - Applies salary components
   - Calculates statutory deductions (PAYE, NSSF, NHIF)
   - Calculates other deductions (loans, advances, etc.)
   - Calculates net pay
   - Creates payroll records for each employee
4. Review payroll summary
5. Approve or reject
6. Once approved, period status changes to "approved"
7. Can lock period to prevent further changes

### 4.3 Generating Payslips

**Flow:**

1. After payroll is approved
2. Navigate to employee's payroll record
3. Click "Generate Payslip"
4. System generates PDF payslip
5. Employee can view/download from their account

---

## 5. Expense Management

### 5.1 Submitting an Expense

**Flow:**

1. Employee navigates to "My Expenses" or "Submit Expense"
2. Clicks "Submit Expense"
3. Fills in:
   - Expense category
   - Department (if applicable)
   - Title, description
   - Amount, currency
   - Expense date
   - Upload receipts/documents
4. Submits expense
5. Status: "pending"

### 5.2 Approving Expenses

**Flow:**

1. Manager/Admin navigates to "Expenses"
2. Views pending expenses
3. Reviews expense details and documents
4. Approves or rejects
5. If approved:
   - Status changes to "approved"
   - May require finance approval (if configured)
6. Once fully approved, can be marked as "paid"

---

## 6. System Administration

### 6.1 System Admin Interface

**Flow:**

1. System admin logs in
2. Redirected to System Admin dashboard
3. Can access:
   - **System Stats**: View system-wide statistics
   - **Tenants**: Manage all tenants
     - Create new tenants
     - Edit tenant details
     - Reset tenant admin passwords
     - Delete tenants
     - View tenant statistics

**Key Points:**

- System admin has no tenant association
- Can manage all tenants in the system
- Has elevated privileges

### 6.2 Tenant Admin Operations

**Flow:**

1. Tenant admin logs in
2. Redirected to tenant dashboard
3. Can manage:
   - Employees
   - Departments
   - Payroll
   - Expenses
   - Reports
   - Roles and permissions
   - Settings

---

## 7. User Authentication & Authorization

### 7.1 Login Flow

**Flow:**

1. User visits login page
2. Enters email and password
3. System validates credentials
4. If system admin:
   - Redirects to `/system-admin/stats`
   - Shows system admin menu
5. If tenant user:
   - Redirects to `/dashboard`
   - Shows tenant menu based on permissions
6. Token stored for session management

### 7.2 Permission Checking

**Flow:**

1. User attempts to access a resource
2. System checks:
   - User is authenticated
   - User has required role/permission
   - Resource belongs to user's tenant (if applicable)
3. If authorized: Access granted
4. If not authorized: 403 Forbidden

---

## 8. Common Workflows

### 8.1 New Employee Onboarding

**Complete Flow:**

1. Admin creates employee (with user account and role)
2. Employee receives credentials (via email or manual sharing)
3. Employee logs in
4. Employee can:
   - View their profile
   - View payslips
   - Submit expenses
   - Access features based on role

### 8.2 Monthly Payroll Processing

**Complete Flow:**

1. Admin creates payroll period for the month
2. Admin processes payroll
3. System calculates all amounts
4. Admin reviews and approves
5. Payslips generated automatically
6. Employees can view/download payslips
7. Period locked to prevent changes

### 8.3 Expense Reimbursement

**Complete Flow:**

1. Employee submits expense with receipts
2. Manager reviews and approves
3. Finance reviews and approves (if required)
4. Admin marks as paid
5. Expense reflected in reports

---

## 9. Data Flow Diagrams

### 9.1 Employee Creation with User Account

```
[Admin]
  ↓
[Create Employee Form]
  ↓
[Fill Employee Details]
  ↓
[Check "Create User Account"]
  ↓
[Select Role]
  ↓
[Enter Password]
  ↓
[Submit]
  ↓
[Backend: Create Employee]
  ↓
[Backend: Create User Account]
  ↓
[Backend: Assign Role]
  ↓
[Backend: Link Employee to User]
  ↓
[Success: Employee + User Created]
```

### 9.2 Payroll Processing Flow

```
[Admin]
  ↓
[Create Payroll Period]
  ↓
[Process Payroll]
  ↓
[System: Calculate for Each Employee]
  ├─→ [Get Employee Salary Components]
  ├─→ [Calculate Gross Pay]
  ├─→ [Calculate Deductions]
  │   ├─→ [PAYE]
  │   ├─→ [NSSF]
  │   ├─→ [NHIF]
  │   └─→ [Other Deductions]
  └─→ [Calculate Net Pay]
  ↓
[Create Payroll Records]
  ↓
[Admin Reviews]
  ↓
[Approve/Reject]
  ↓
[If Approved: Generate Payslips]
  ↓
[Lock Period]
```

---

## 10. Key Improvements Made

### 10.1 Employee Creation with Role Assignment

**Before:**

- Employee created separately
- User account created separately
- Role assigned separately
- Three separate steps

**After:**

- Employee creation includes optional user account creation
- Role assignment integrated into employee creation
- Single streamlined process
- Better user experience

### 10.2 System Admin Interface

**Before:**

- No system-wide admin interface
- Manual tenant management

**After:**

- Dedicated system admin interface
- Easy tenant management
- System-wide statistics
- Password reset capabilities

### 10.3 Onboarding Wizard

**Before:**

- New users had to figure out setup themselves
- No guidance on initial configuration

**After:**

- Step-by-step onboarding wizard
- Guided setup process
- Pre-filled common configurations
- Can skip steps if needed

---

## 11. Best Practices

1. **Employee Creation:**

   - Always create user accounts for employees who need system access
   - Assign appropriate roles based on job function
   - Use department-scoped roles when applicable

2. **Role Management:**

   - Create roles before creating employees
   - Use descriptive role names
   - Assign minimum required permissions

3. **Payroll Processing:**

   - Review calculations before approving
   - Lock periods after approval
   - Keep audit trail of changes

4. **Security:**
   - Use strong passwords
   - Regularly review user roles
   - Monitor system admin access

---

## 12. Troubleshooting

### Common Issues:

1. **"Insufficient permissions" error:**

   - Check user's role assignments
   - Verify role has required permissions
   - Ensure user is active

2. **Employee creation fails:**

   - Check required fields are filled
   - Verify email format
   - Ensure department exists (if assigned)

3. **Role assignment fails:**
   - Verify role exists
   - Check role is accessible to tenant
   - Ensure user account was created

---

## Conclusion

This process flow documentation provides a comprehensive guide to using the Payroll & Expense Management System. The system is designed to be intuitive and efficient, with integrated workflows that reduce manual steps and improve user experience.

For technical details, refer to:

- `DATABASE_SCHEMA.md` - Database structure
- `API_SPECIFICATION.md` - API endpoints
- `SYSTEM_ARCHITECTURE.md` - System architecture
