# Payroll & Expense Management System - API Specification

## Overview

This document defines the complete RESTful API for the payroll and expense management system. All endpoints follow REST conventions and return JSON responses.

---

## API Standards

### Base URL

```
Production:  https://api.{domain}/v1
Development: http://localhost:5000/api/v1
```

### Authentication

All endpoints (except auth endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### Standard Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [{ "field": "email", "message": "Email is required" }]
  }
}
```

### HTTP Status Codes

| Code | Description                          |
| ---- | ------------------------------------ |
| 200  | Success                              |
| 201  | Resource created                     |
| 204  | No content (successful delete)       |
| 400  | Bad request / Validation error       |
| 401  | Unauthorized (invalid/missing token) |
| 403  | Forbidden (insufficient permissions) |
| 404  | Resource not found                   |
| 409  | Conflict (duplicate resource)        |
| 422  | Unprocessable entity                 |
| 429  | Rate limit exceeded                  |
| 500  | Internal server error                |

### Common Query Parameters

| Parameter   | Type    | Description                            |
| ----------- | ------- | -------------------------------------- |
| `page`      | integer | Page number (default: 1)               |
| `perPage`   | integer | Items per page (default: 20, max: 100) |
| `sortBy`    | string  | Field to sort by                       |
| `sortOrder` | string  | `asc` or `desc`                        |
| `search`    | string  | Search term                            |

---

## API Endpoints

### 1. Authentication (`/auth`)

#### POST `/auth/register`

Register a new organization and admin user.

**Request:**

```json
{
  "organization": {
    "name": "Acme Corporation",
    "slug": "acme-corp"
  },
  "user": {
    "email": "admin@acme.com",
    "password": "SecurePassword123!",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Response:** `201 Created`

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "uuid",
      "name": "Acme Corporation",
      "slug": "acme-corp"
    },
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

---

#### POST `/auth/login`

Authenticate user and receive tokens.

**Request:**

```json
{
  "email": "admin@acme.com",
  "password": "SecurePassword123!"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@acme.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["admin"],
      "permissions": ["employee:read", "payroll:process"]
    },
    "tenant": {
      "id": "uuid",
      "name": "Acme Corporation"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token",
      "expiresIn": 3600
    }
  }
}
```

---

#### POST `/auth/refresh`

Refresh access token.

**Request:**

```json
{
  "refreshToken": "refresh_token"
}
```

---

#### POST `/auth/logout`

Invalidate refresh token.

---

#### POST `/auth/forgot-password`

Request password reset email.

**Request:**

```json
{
  "email": "user@acme.com"
}
```

---

#### POST `/auth/reset-password`

Reset password with token.

**Request:**

```json
{
  "token": "reset_token",
  "password": "NewPassword123!"
}
```

---

#### GET `/auth/me`

Get current user profile.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": { ... },
    "employee": { ... },
    "permissions": [...]
  }
}
```

---

### 2. Departments (`/departments`)

#### GET `/departments`

List all departments.

**Permissions:** `department:manage` or `employee:read`

**Query Parameters:**

- `isActive` (boolean): Filter by active status
- `parentId` (uuid): Filter by parent department

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Finance",
      "code": "FIN",
      "parentId": null,
      "managerId": "uuid",
      "managerName": "Jane Doe",
      "employeeCount": 15,
      "isActive": true
    }
  ]
}
```

---

#### POST `/departments`

Create a new department.

**Permissions:** `department:manage`

**Request:**

```json
{
  "name": "Human Resources",
  "code": "HR",
  "parentId": null,
  "managerId": "employee_uuid",
  "description": "HR Department"
}
```

---

#### GET `/departments/:id`

Get department details.

---

#### PUT `/departments/:id`

Update department.

---

#### DELETE `/departments/:id`

Delete department (soft delete).

---

### 3. Employees (`/employees`)

#### GET `/employees`

List all employees.

**Permissions:** `employee:read` or `employee:read:self`

**Query Parameters:**

- `departmentId` (uuid): Filter by department
- `status` (string): `active`, `suspended`, `terminated`
- `employmentType` (string): `permanent`, `contract`, `casual`
- `search` (string): Search by name, email, employee number

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeNumber": "EMP001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@acme.com",
      "jobTitle": "Software Engineer",
      "departmentId": "uuid",
      "departmentName": "Engineering",
      "employmentType": "permanent",
      "status": "active",
      "hireDate": "2024-01-15",
      "photoUrl": "https://..."
    }
  ],
  "meta": {
    "pagination": { ... }
  }
}
```

---

#### POST `/employees`

Create a new employee.

**Permissions:** `employee:create`

**Request:**

```json
{
  "employeeNumber": "EMP002",
  "firstName": "Jane",
  "lastName": "Smith",
  "personalEmail": "jane.smith@email.com",
  "workEmail": "jane.smith@acme.com",
  "phonePrimary": "+254700000000",

  "dateOfBirth": "1990-05-15",
  "gender": "female",
  "nationality": "Kenyan",
  "nationalId": "12345678",
  "kraPin": "A001234567Z",
  "nssfNumber": "123456789",
  "nhifNumber": "987654321",

  "departmentId": "uuid",
  "jobTitle": "Accountant",
  "employmentType": "permanent",
  "hireDate": "2025-01-02",

  "addressLine1": "123 Main Street",
  "city": "Nairobi",
  "county": "Nairobi",
  "postalCode": "00100",

  "emergencyContactName": "John Smith",
  "emergencyContactPhone": "+254711111111",
  "emergencyContactRelationship": "spouse",

  "bankDetails": {
    "paymentMethod": "bank",
    "bankName": "Equity Bank",
    "accountNumber": "1234567890",
    "accountName": "Jane Smith"
  },

  "salaryComponents": [
    { "componentId": "uuid", "amount": 80000 },
    { "componentId": "uuid", "amount": 10000 }
  ],

  "createUserAccount": true
}
```

---

#### GET `/employees/:id`

Get employee details.

**Response includes:**

- Personal information
- Employment details
- Bank details (masked for security)
- Current salary components
- Department info

---

#### PUT `/employees/:id`

Update employee.

**Permissions:** `employee:update`

---

#### DELETE `/employees/:id`

Terminate/remove employee (soft delete).

---

#### GET `/employees/:id/payslips`

Get employee's payslip history.

---

#### GET `/employees/:id/expenses`

Get employee's expense history.

---

#### GET `/employees/:id/documents`

Get employee's documents.

---

#### POST `/employees/:id/documents`

Upload employee document.

**Request:** `multipart/form-data`

```
documentType: "contract"
documentName: "Employment Contract 2025"
file: <file>
expiryDate: "2026-01-01" (optional)
```

---

#### PUT `/employees/:id/status`

Change employee status.

**Request:**

```json
{
  "status": "suspended",
  "reason": "Disciplinary action",
  "effectiveDate": "2025-01-15"
}
```

---

### 4. Salary Components (`/salary-components`)

#### GET `/salary-components`

List all salary components.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Basic Salary",
      "code": "BASIC",
      "type": "earning",
      "category": "basic",
      "calculationType": "fixed",
      "isTaxable": true,
      "isStatutory": false,
      "isActive": true,
      "displayOrder": 1
    },
    {
      "id": "uuid",
      "name": "PAYE",
      "code": "PAYE",
      "type": "deduction",
      "category": "statutory",
      "calculationType": "percentage",
      "isTaxable": false,
      "isStatutory": true,
      "statutoryType": "paye",
      "isActive": true
    }
  ]
}
```

---

#### POST `/salary-components`

Create salary component.

**Permissions:** `salary:configure`

**Request:**

```json
{
  "name": "Transport Allowance",
  "code": "TRANSPORT",
  "type": "earning",
  "category": "allowance",
  "calculationType": "fixed",
  "defaultAmount": 5000,
  "isTaxable": true,
  "displayOrder": 3
}
```

---

#### PUT `/salary-components/:id`

Update salary component.

---

#### DELETE `/salary-components/:id`

Deactivate salary component.

---

### 5. Employee Salary (`/employees/:id/salary`)

#### GET `/employees/:id/salary`

Get employee's current salary structure.

**Response:**

```json
{
  "success": true,
  "data": {
    "employeeId": "uuid",
    "employeeName": "Jane Smith",
    "grossSalary": 95000,
    "components": [
      {
        "id": "uuid",
        "componentId": "uuid",
        "componentName": "Basic Salary",
        "componentCode": "BASIC",
        "type": "earning",
        "amount": 80000,
        "effectiveFrom": "2025-01-01"
      },
      {
        "id": "uuid",
        "componentId": "uuid",
        "componentName": "Transport Allowance",
        "componentCode": "TRANSPORT",
        "type": "earning",
        "amount": 15000,
        "effectiveFrom": "2025-01-01"
      }
    ],
    "revisionHistory": [
      {
        "date": "2025-01-01",
        "previousGross": 80000,
        "newGross": 95000,
        "changePercentage": 18.75,
        "reason": "Annual increment"
      }
    ]
  }
}
```

---

#### PUT `/employees/:id/salary`

Update employee salary (creates revision history).

**Permissions:** `salary:assign`

**Request:**

```json
{
  "effectiveFrom": "2025-02-01",
  "reason": "Promotion",
  "components": [
    { "componentId": "uuid", "amount": 100000 },
    { "componentId": "uuid", "amount": 20000 }
  ]
}
```

---

### 6. Payroll Periods (`/payroll-periods`)

#### GET `/payroll-periods`

List payroll periods.

**Query Parameters:**

- `year` (integer): Filter by year
- `status` (string): Filter by status

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "January 2025",
      "periodType": "monthly",
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "payDate": "2025-01-25",
      "status": "approved",
      "totalEmployees": 50,
      "totalGross": 5000000,
      "totalDeductions": 1200000,
      "totalNet": 3800000,
      "processedAt": "2025-01-20T10:30:00Z",
      "approvedAt": "2025-01-21T14:00:00Z"
    }
  ]
}
```

---

#### POST `/payroll-periods`

Create a new payroll period.

**Permissions:** `payroll:process`

**Request:**

```json
{
  "name": "February 2025",
  "periodType": "monthly",
  "startDate": "2025-02-01",
  "endDate": "2025-02-28",
  "payDate": "2025-02-25"
}
```

---

#### GET `/payroll-periods/:id`

Get payroll period details with summary.

---

#### POST `/payroll-periods/:id/process`

Process payroll for all employees.

**Permissions:** `payroll:process`

**Response:**

```json
{
  "success": true,
  "data": {
    "periodId": "uuid",
    "status": "pending_approval",
    "processedCount": 50,
    "totalGross": 5000000,
    "totalDeductions": 1200000,
    "totalNet": 3800000,
    "breakdown": {
      "paye": 800000,
      "nssf": 250000,
      "nhif": 150000
    }
  }
}
```

---

#### POST `/payroll-periods/:id/approve`

Approve processed payroll.

**Permissions:** `payroll:approve`

---

#### POST `/payroll-periods/:id/lock`

Lock payroll period (immutable).

---

#### GET `/payroll-periods/:id/payrolls`

List all employee payrolls for the period.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "employeeId": "uuid",
      "employeeName": "Jane Smith",
      "employeeNumber": "EMP002",
      "department": "Finance",
      "grossPay": 95000,
      "totalDeductions": 25000,
      "netPay": 70000,
      "status": "approved",
      "paymentMethod": "bank"
    }
  ]
}
```

---

#### GET `/payroll-periods/:id/payrolls/:employeeId`

Get detailed payroll for specific employee.

---

#### POST `/payroll-periods/:id/generate-payslips`

Generate PDF payslips for all employees.

---

#### POST `/payroll-periods/:id/mark-paid`

Mark payroll as paid.

**Request:**

```json
{
  "paymentDate": "2025-01-25",
  "paymentReference": "BATCH-2025-01-001"
}
```

---

### 7. Payslips (`/payslips`)

#### GET `/payslips`

List payslips (filtered by user permissions).

---

#### GET `/payslips/:id`

Get payslip details.

---

#### GET `/payslips/:id/download`

Download payslip PDF.

---

### 8. Expense Categories (`/expense-categories`)

#### GET `/expense-categories`

List expense categories.

---

#### POST `/expense-categories`

Create expense category.

**Permissions:** `category:manage`

**Request:**

```json
{
  "name": "Travel",
  "code": "TRAVEL",
  "description": "Work-related travel expenses",
  "requiresReceipt": true,
  "maxAmount": 50000,
  "requiresManagerApproval": true,
  "requiresFinanceApproval": true,
  "autoApproveBelow": 1000
}
```

---

#### PUT `/expense-categories/:id`

Update category.

---

#### DELETE `/expense-categories/:id`

Deactivate category.

---

### 9. Expenses (`/expenses`)

#### GET `/expenses`

List expenses.

**Query Parameters:**

- `status` (string): Filter by status
- `categoryId` (uuid): Filter by category
- `employeeId` (uuid): Filter by employee
- `departmentId` (uuid): Filter by department
- `dateFrom` (date): Start date
- `dateTo` (date): End date
- `minAmount` (number): Minimum amount
- `maxAmount` (number): Maximum amount

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "expenseNumber": "EXP-2025-0001",
      "title": "Client Meeting - Lunch",
      "categoryId": "uuid",
      "categoryName": "Meals",
      "employeeId": "uuid",
      "employeeName": "Jane Smith",
      "departmentName": "Sales",
      "amount": 2500,
      "currency": "KES",
      "expenseDate": "2025-01-10",
      "status": "pending_manager",
      "hasReceipt": true,
      "submittedAt": "2025-01-11T09:00:00Z"
    }
  ]
}
```

---

#### POST `/expenses`

Submit new expense.

**Permissions:** `expense:submit`

**Request:** `multipart/form-data`

```json
{
  "title": "Client Meeting - Lunch",
  "categoryId": "uuid",
  "amount": 2500,
  "currency": "KES",
  "expenseDate": "2025-01-10",
  "description": "Lunch with ABC Corp client",
  "receipts": [<file>, <file>]
}
```

---

#### GET `/expenses/:id`

Get expense details.

**Response includes:**

- Expense details
- Category info
- Uploaded receipts
- Approval history
- Payment info (if paid)

---

#### PUT `/expenses/:id`

Update expense (only if draft or returned).

---

#### DELETE `/expenses/:id`

Cancel/delete expense (only if draft).

---

#### POST `/expenses/:id/submit`

Submit expense for approval.

---

#### POST `/expenses/:id/approve`

Approve expense.

**Permissions:** `expense:approve` or `expense:approve:department`

**Request:**

```json
{
  "comments": "Approved for reimbursement"
}
```

---

#### POST `/expenses/:id/reject`

Reject expense.

**Request:**

```json
{
  "reason": "Receipt not clear, please resubmit"
}
```

---

#### POST `/expenses/:id/return`

Return expense for revision.

**Request:**

```json
{
  "comments": "Please add more details"
}
```

---

#### POST `/expenses/:id/mark-paid`

Mark expense as paid.

**Permissions:** `expense:pay`

**Request:**

```json
{
  "paymentMethod": "mpesa",
  "paymentReference": "MPESA123456",
  "paidDate": "2025-01-15"
}
```

---

#### GET `/expenses/:id/documents`

Get expense documents/receipts.

---

#### POST `/expenses/:id/documents`

Upload additional documents.

---

### 10. Loans & Advances (`/loans`)

#### GET `/loans`

List employee loans.

---

#### POST `/loans`

Create loan/advance.

**Permissions:** `loan:create`

**Request:**

```json
{
  "employeeId": "uuid",
  "loanType": "salary_advance",
  "principalAmount": 50000,
  "interestRate": 0,
  "repaymentStartDate": "2025-02-01",
  "monthlyDeduction": 10000,
  "reason": "Personal emergency"
}
```

---

#### GET `/loans/:id`

Get loan details with repayment history.

---

#### PUT `/loans/:id`

Update loan terms.

---

#### POST `/loans/:id/approve`

Approve loan.

---

#### GET `/loans/:id/repayments`

Get repayment history.

---

### 11. Reports (`/reports`)

#### GET `/reports/payroll/summary`

Payroll summary report.

**Query Parameters:**

- `periodId` (uuid): Specific period
- `year` (integer): Year
- `month` (integer): Month
- `departmentId` (uuid): Filter by department

**Response:**

```json
{
  "success": true,
  "data": {
    "period": "January 2025",
    "summary": {
      "totalEmployees": 50,
      "totalGross": 5000000,
      "totalNet": 3800000,
      "totalPAYE": 800000,
      "totalNSSF": 250000,
      "totalNHIF": 150000
    },
    "byDepartment": [
      {
        "department": "Engineering",
        "employeeCount": 20,
        "totalGross": 2500000,
        "totalNet": 1900000
      }
    ]
  }
}
```

---

#### GET `/reports/payroll/history`

Payroll history/trends report.

---

#### GET `/reports/expense/summary`

Expense summary report.

**Query Parameters:**

- `dateFrom` (date)
- `dateTo` (date)
- `departmentId` (uuid)
- `categoryId` (uuid)

---

#### GET `/reports/expense/by-category`

Expenses breakdown by category.

---

#### GET `/reports/expense/by-department`

Expenses breakdown by department.

---

#### GET `/reports/expense/top-spenders`

Top expense submitters.

---

#### POST `/reports/export`

Export report data.

**Request:**

```json
{
  "reportType": "payroll_summary",
  "format": "xlsx",
  "filters": {
    "year": 2025,
    "month": 1
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://...",
    "expiresAt": "2025-01-02T12:00:00Z"
  }
}
```

---

### 12. Audit Logs (`/audit-logs`)

#### GET `/audit-logs`

List audit logs.

**Permissions:** `audit:view`

**Query Parameters:**

- `entityType` (string): Filter by entity
- `entityId` (uuid): Filter by specific entity
- `userId` (uuid): Filter by user
- `action` (string): Filter by action
- `dateFrom` (date)
- `dateTo` (date)

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "action": "update",
      "entityType": "employee",
      "entityId": "uuid",
      "userId": "uuid",
      "userName": "Admin User",
      "changes": {
        "salary": { "from": 80000, "to": 95000 }
      },
      "ipAddress": "192.168.1.1",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  ]
}
```

---

### 13. Notifications (`/notifications`)

#### GET `/notifications`

Get user notifications.

**Query Parameters:**

- `unreadOnly` (boolean)
- `type` (string)

---

#### PUT `/notifications/:id/read`

Mark notification as read.

---

#### PUT `/notifications/read-all`

Mark all notifications as read.

---

### 14. Settings (`/settings`)

#### GET `/settings`

Get tenant settings.

---

#### PUT `/settings`

Update tenant settings.

**Permissions:** `settings:manage`

**Request:**

```json
{
  "payrollApprovalRequired": true,
  "expenseReceiptRequired": true,
  "defaultCurrency": "KES",
  "payrollDay": 25,
  "fiscalYearStart": "01-01"
}
```

---

#### GET `/settings/statutory-rates`

Get statutory tax rates (PAYE, NSSF, NHIF).

---

### 15. Dashboard (`/dashboard`)

#### GET `/dashboard/admin`

Admin dashboard data.

**Response:**

```json
{
  "success": true,
  "data": {
    "employees": {
      "total": 50,
      "active": 48,
      "newThisMonth": 2
    },
    "payroll": {
      "currentPeriod": "January 2025",
      "status": "approved",
      "totalPayroll": 3800000
    },
    "expenses": {
      "pendingApproval": 12,
      "pendingPayment": 5,
      "monthlyTotal": 150000
    },
    "recentActivity": [
      { "type": "expense_submitted", "message": "...", "time": "..." }
    ]
  }
}
```

---

#### GET `/dashboard/employee`

Employee self-service dashboard.

---

## Webhooks (Future)

For integrations, webhooks can be configured for events:

- `payroll.processed`
- `payroll.approved`
- `expense.submitted`
- `expense.approved`
- `employee.created`

---

## Rate Limiting

| Endpoint Type       | Limit               |
| ------------------- | ------------------- |
| Authentication      | 10 requests/minute  |
| API (authenticated) | 100 requests/minute |
| Report exports      | 10 requests/hour    |
| File uploads        | 20 requests/minute  |

---

## Versioning

API versioning is done via URL path (`/v1/`, `/v2/`). Deprecated versions will be supported for 6 months after a new version release.
