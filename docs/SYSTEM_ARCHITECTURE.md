# Payroll & Expense Management System - System Architecture

## Executive Summary

A comprehensive, multi-tenant, cloud-ready payroll and expense management system designed for financial discipline, auditability, and compliance. Built with scalability, security, and user experience at its core.

---

## 1. Core Design Principles

| Principle                  | Implementation                                                         |
| -------------------------- | ---------------------------------------------------------------------- |
| **Single Source of Truth** | Centralized data store with normalized schema; no data duplication     |
| **Auditability**           | Immutable audit logs, change history tracking, locked periods          |
| **Automation + Control**   | Automated calculations with manual approval gates                      |
| **Compliance-Ready**       | Extensible tax/statutory deduction framework (Kenya-focused initially) |
| **Simple UX**              | Role-based interfaces, guided workflows, minimal complexity            |
| **Multi-tenancy**          | Complete data isolation per organization                               |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Admin     │  │     HR      │  │   Manager   │  │  Employee   │         │
│  │  Dashboard  │  │  Dashboard  │  │  Dashboard  │  │   Portal    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                                             │
│                      React Typescript Frontend                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              API GATEWAY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Rate Limiting │ Authentication │ Request Validation │ Logging              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │   Auth Service   │  │  Tenant Service  │  │  Employee Service│           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │ Payroll Service  │  │ Expense Service  │  │  Report Service  │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │Notification Svc  │  │Document Service  │  │   Audit Service  │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
│                                                                             │
│                     Node.js / Express.js Backend                            │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐           │
│  │   PostgreSQL     │  │      Redis       │  │   File Storage   │           │
│  │  (Primary DB)    │  │   (Cache/Queue)  │  │  (S3/Cloudinary) │           │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Multi-Tenancy Architecture

### Tenant Isolation Strategy: **Schema-per-Tenant with Shared Database**

```
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  tenant_abc     │  │  tenant_xyz     │  │  tenant_123     │  │
│  │  ─────────────  │  │  ─────────────  │  │  ─────────────  │  │
│  │  employees      │  │  employees      │  │  employees      │  │
│  │  payrolls       │  │  payrolls       │  │  payrolls       │  │
│  │  expenses       │  │  expenses       │  │  expenses       │  │
│  │  ...            │  │  ...            │  │  ...            │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    public schema                         │   │
│  │  tenants, subscription_plans, system_config              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Alternative: Row-Level Isolation (Simpler for MVP)

- All data in shared tables with `tenant_id` foreign key
- Row-level security policies in PostgreSQL
- Simpler to implement, suitable for Phase 1

---

## 4. Service Architecture

### 4.1 Authentication & Authorization Service

```
Responsibilities:
├── User registration & login
├── JWT token management
├── Password reset flow
├── Session management
├── Role-based access control (RBAC)
├── Permission validation
└── Multi-factor authentication (Phase 2)
```

### 4.2 Tenant Service

```
Responsibilities:
├── Organization/Company management
├── Tenant provisioning
├── Subscription management
├── Tenant settings & configuration
├── Custom branding
└── Multi-company hierarchy
```

### 4.3 Employee Service

```
Responsibilities:
├── Employee CRUD operations
├── Personal information management
├── Employment details tracking
├── Bank/payment information
├── Document management
├── Employment status transitions
└── Employee self-service
```

### 4.4 Payroll Service

```
Responsibilities:
├── Salary component configuration
├── Payroll period management
├── Gross pay calculation
├── Deduction processing (statutory + internal)
├── Net pay computation
├── Payroll approval workflow
├── Payslip generation (PDF)
├── Payment status tracking
└── Payroll history & immutability
```

### 4.5 Expense Service

```
Responsibilities:
├── Expense category management
├── Expense submission
├── Receipt/document uploads
├── Approval workflow
├── Expense status management
├── Budget tracking (optional)
└── Reimbursement processing
```

### 4.6 Reporting Service

```
Responsibilities:
├── Payroll reports generation
├── Expense analytics
├── Departmental summaries
├── Trend analysis
├── Export functionality (CSV/Excel/PDF)
└── Dashboard metrics
```

### 4.7 Audit Service

```
Responsibilities:
├── Action logging
├── Change history tracking
├── Data modification timestamps
├── User activity tracking
└── Compliance reporting
```

### 4.8 Notification Service

```
Responsibilities:
├── Email notifications
├── In-app notifications
├── Notification preferences
├── Template management
└── Delivery tracking
```

### 4.9 Document Service

```
Responsibilities:
├── File upload handling
├── Secure file storage
├── Document versioning
├── Access control
└── Document retrieval
```

---

## 5. Security Architecture

### 5.1 Authentication Flow

```
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────┐
│  User   │───▶│ Login   │───▶│ Auth Service│───▶│ Database │
└─────────┘    └─────────┘    └─────────────┘    └──────────┘
                                    │
                                    ▼
                              ┌───────────┐
                              │ JWT Token │
                              │ (Access + │
                              │  Refresh) │
                              └───────────┘
```

### 5.2 Security Measures

| Layer              | Measure                                                                 |
| ------------------ | ----------------------------------------------------------------------- |
| **Transport**      | TLS 1.3, HTTPS only                                                     |
| **Authentication** | JWT tokens, bcrypt password hashing                                     |
| **Authorization**  | RBAC with granular permissions                                          |
| **Data**           | Encryption at rest (AES-256), field-level encryption for sensitive data |
| **API**            | Rate limiting, request validation, CORS                                 |
| **Sessions**       | Secure cookies, token rotation, session timeouts                        |
| **Audit**          | Complete action logging, immutable audit trail                          |

### 5.3 Role-Based Access Control (RBAC)

```
┌─────────────────────────────────────────────────────────────────┐
│                        RBAC Structure                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tenant                                                          │
│    └── Roles                                                     │
│          ├── Super Admin                                         │
│          │     └── All permissions                               │
│          ├── Admin / Finance Manager                             │
│          │     ├── payroll:*                                     │
│          │     ├── expense:approve                               │
│          │     ├── employee:*                                    │
│          │     └── report:*                                      │
│          ├── HR Officer                                          │
│          │     ├── employee:*                                    │
│          │     ├── payroll:view                                  │
│          │     └── salary_structure:*                            │
│          ├── Department Manager                                  │
│          │     ├── expense:submit                                │
│          │     ├── expense:approve:department                    │
│          │     └── employee:view:department                      │
│          └── Employee                                            │
│                ├── profile:view:self                             │
│                ├── payslip:view:self                             │
│                └── expense:submit:self                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Data Flow Diagrams

### 6.1 Payroll Processing Flow

```
┌──────────────┐
│ Payroll      │
│ Period       │
│ Selection    │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│                    AUTO-CALCULATION ENGINE                     │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌────────────┐    ┌────────────┐    ┌────────────────────┐  │
│  │ Fetch All  │───▶│ Calculate  │───▶│ Apply Deductions   │  │
│  │ Employees  │    │ Gross Pay  │    │ - Statutory (PAYE, │  │
│  │ & Salaries │    │            │    │   NSSF, NHIF)      │  │
│  └────────────┘    └────────────┘    │ - Internal (loans, │  │
│                                       │   advances)        │  │
│                                       └────────────────────┘  │
│                                                   │            │
│                                                   ▼            │
│                                       ┌────────────────────┐  │
│                                       │ Calculate Net Pay  │  │
│                                       └────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Admin        │◀─── Review Summary
│ Review       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Approve /    │
│ Reject       │
└──────┬───────┘
       │
       ▼ (if approved)
┌──────────────────────────────────────────────────────────────┐
│                                                                │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐  │
│  │ Lock Period │  │ Generate    │  │ Send Notifications   │  │
│  │ (Immutable) │  │ Payslips    │  │ to Employees         │  │
│  └─────────────┘  └─────────────┘  └──────────────────────┘  │
│                                                                │
└────────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────┐
│ Record       │
│ Payout       │
│ Status       │
└──────────────┘
```

### 6.2 Expense Workflow

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   Employee   │         │   Manager    │         │   Finance    │
│   Submits    │────────▶│   Reviews    │────────▶│   Approves   │
│   Expense    │         │   & Approves │         │   & Pays     │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                        │
       ▼                        ▼                        ▼
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ Status:      │         │ Status:      │         │ Status:      │
│ PENDING      │         │ APPROVED     │         │ PAID         │
└──────────────┘         │ or REJECTED  │         └──────────────┘
                         └──────────────┘
```

---

## 7. API Design Principles

### RESTful Conventions

```
Base URL:  https://api.{domain}/v1

Endpoints follow pattern:
  GET    /employees          - List all employees
  POST   /employees          - Create employee
  GET    /employees/:id      - Get single employee
  PUT    /employees/:id      - Update employee
  DELETE /employees/:id      - Delete employee

Nested resources:
  GET    /employees/:id/payslips
  GET    /payroll-periods/:id/payrolls
```

### Standard Response Format

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "pagination": {
      "page": 1,
      "perPage": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

---

## 8. Integration Points

### Phase 2 Integrations

| Integration        | Purpose                                 |
| ------------------ | --------------------------------------- |
| **M-Pesa API**     | Mobile money payouts                    |
| **Bank APIs**      | Direct bank transfers (KCB BUNI API)    |
| **Email Provider** | Transactional emails (AWS SES) |
| **SMS Gateway**    | Notification delivery (AfricasTalking) |
| **Cloud Storage**  | Document storage (AWS S3/Digital Ocean Spaces)    |
| **KRA iTax**       | Tax compliance reporting (future)       |

---

## 9. Deployment Architecture

### Production Environment (Recommended)

```
                        ┌─────────────────┐
                        │   CloudFlare    │
                        │   (CDN + WAF)   │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  Load Balancer  │
                        └────────┬────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌────────────┐     ┌────────────┐     ┌────────────┐
       │ App Server │     │ App Server │     │ App Server │
       │    (1)     │     │    (2)     │     │    (3)     │
       └────────────┘     └────────────┘     └────────────┘
              │                  │                  │
              └──────────────────┼──────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
       ┌────────────┐     ┌────────────┐     ┌────────────┐
       │ PostgreSQL │     │   Redis    │     │  S3/Cloud  │
       │  Primary   │     │  Cluster   │     │  Storage   │
       │  + Replica │     │            │     │            │
       └────────────┘     └────────────┘     └────────────┘
```

### Development Environment

```
┌───────────────────────────────────────────────────────────────┐
│                      Docker Compose                            │
├───────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐   │
│  │   Frontend  │  │   Backend   │  │   PostgreSQL        │   │
│  │   (React)   │  │   (Node)    │  │                     │   │
│  │   :3000     │  │   :5000     │  │   :5432             │   │
│  └─────────────┘  └─────────────┘  └─────────────────────┘   │
│                                                                │
│  ┌─────────────┐  ┌─────────────┐                            │
│  │    Redis    │  │   Mailhog   │                            │
│  │   :6379     │  │   :8025     │                            │
│  └─────────────┘  └─────────────┘                            │
└───────────────────────────────────────────────────────────────┘
```

---

## 10. Scalability Considerations

| Aspect                 | Strategy                                     |
| ---------------------- | -------------------------------------------- |
| **Horizontal Scaling** | Stateless API servers behind load balancer   |
| **Database Scaling**   | Read replicas, connection pooling            |
| **Caching**            | Redis for sessions, frequently accessed data |
| **Background Jobs**    | Queue-based processing (Bull/Redis)          |
| **File Storage**       | Cloud storage with CDN distribution          |
| **Search**             | Elasticsearch for complex queries (Phase 2)  |

---

## 11. Monitoring & Observability

```
┌─────────────────────────────────────────────────────────────────┐
│                     Monitoring Stack                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Logging    │  │  Metrics    │  │  Error Tracking         │ │
│  │  (ELK/Loki) │  │ (Prometheus)│  │  (Sentry)               │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ Dashboards  │  │  Alerts     │  │  APM                    │ │
│  │  (Grafana)  │  │ (PagerDuty) │  │  (NewRelic/DataDog)     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. Review [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for complete data models
2. Review [API_SPECIFICATION.md](./API_SPECIFICATION.md) for endpoint details
3. Review [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for phased execution plan
