# Payroll & Expense Management System - Technology Stack

## Overview

This document outlines the recommended technology choices for building a world-class, enterprise-grade payroll and expense management system. Each choice is justified with alternatives where applicable.

---

## Core Technology Stack

### Frontend

| Category             | Technology                      | Justification                                                  |
| -------------------- | ------------------------------- | -------------------------------------------------------------- |
| **Framework**        | React.js                        | strong ecosystem                                               |
| **Language**         | TypeScript                      | Type safety, better developer experience, fewer runtime errors |
| **State Management** | Zustand + React Query           | Lightweight, excellent for state management                    |
| **Styling**          | Tailwind CSS                    | Utility-first, rapid development, consistent design            |
| **Forms**            | React Hook Form + Zod           | Performance, validation, type-safe schemas                     |
| **Charts**           | Recharts                        | Lightweight, React-native charting                             |
| **PDF Generation**   | React-PDF (@react-pdf/renderer) | Client-side payslip generation                                 |
| **Date Handling**    | date-fns                        | Lightweight, immutable, tree-shakeable                         |
| **Icons**            | React-icons                     | Consistent, lightweight icon set                               |

### Backend

| Category           | Technology                  | Justification                                             |
| ------------------ | --------------------------- | --------------------------------------------------------- |
| **Runtime**        | Node.js 20+ (LTS)           | Non-blocking I/O, large ecosystem, JavaScript consistency |
| **Framework**      | Express.js + TypeScript     | Mature, flexible, well-documented                         |
| **API Pattern**    | RESTful                     | Standard, easy to understand, good tooling                |
| **Validation**     | Zod / Joi                   | Schema validation, type inference                         |
| **ORM**            | Sequelize                   | Type-safe queries, migrations, excellent DX               |
| **Authentication** | JWT (jsonwebtoken) + bcrypt | Industry standard, stateless auth                         |
| **File Upload**    | Multer + Sharp              | Efficient file handling, image processing                 |
| **PDF Generation** | PDFKit                      | Server-side payslip PDF generation                        |
| **Email**          | Nodemailer                  | Transactional emails                                      |
| **Job Queue**      | BullMQ + Redis              | Background job processing                                 |
| **Logging**        | Winston                     | Structured logging                                        |

### Database

| Category             | Technology                           | Justification                                     |
| -------------------- | ------------------------------------ | ------------------------------------------------- |
| **Primary Database** | PostgreSQL 15+                       | ACID compliance, JSON support, row-level security |
| **Caching**          | Redis                                | Session storage, caching, job queues              |
| **File Storage**     | Cloudinary / AWS S3                  | Scalable file storage, CDN                        |
| **Search (Phase 2)** | PostgreSQL Full-Text / Elasticsearch | Advanced search capabilities                      |

### DevOps & Infrastructure

| Category             | Technology                                   | Justification                            |
| -------------------- | -------------------------------------------- | ---------------------------------------- |
| **Containerization** | Docker                                       | Consistent environments, easy deployment |
| **Orchestration**    | Docker Compose (dev)                         | Local development / Production scaling   |
| **CI/CD**            | GitHub Actions                               | Integrated with repo, good free tier     |
| **Hosting**          | Vercel (Frontend) + Railway/Render (Backend) | Simple deployment, auto-scaling          |
| **Database Hosting** | AWS RDS / Neon                               | Managed PostgreSQL                       |
| **Monitoring**       | Sentry + Uptime monitoring                   | Error tracking, performance              |
| **SSL**              | Cloudflare / Let's Encrypt                   | Free SSL, CDN, DDoS protection           |

---

## Architecture Decisions

### Why React.js with Vite?

```
Pros:
├── Lightweight and fast build times
├── Strong TypeScript support
├── Full control over routing (React Router)
├── Large ecosystem and community
├── Simple mental model
├── Easy to customize and extend
└── Great developer experience with Vite

Cons:
├── No built-in SSR (not needed for dashboard app)
├── Manual routing setup required
└── Need to configure build tools

Alternatives considered:
├── Next.js: Heavier, SSR not needed for internal dashboard
├── Remix: Good alternative, but overkill for this use case
└── Vue/Nuxt: Different ecosystem
```

### Why Express.js?

```
Pros:
├── Mature and battle-tested
├── Minimal and flexible
├── Huge middleware ecosystem
├── Easy to understand and maintain
├── Great documentation
└── Large community

Cons:
├── No built-in structure (need conventions)
├── Callback-based (need async wrappers)
└── No native TypeScript (needs configuration)

Alternatives considered:
├── Fastify: Faster, but smaller ecosystem
├── NestJS: More structured, but heavier
├── Hono: Modern, but newer
└── Koa: Similar to Express, smaller community
```

### Why PostgreSQL?

```
Pros:
├── ACID compliant (critical for payroll)
├── Row-level security for multi-tenancy
├── JSONB support for flexible data
├── Excellent performance
├── Free and open source
├── Advanced features (CTEs, window functions)
└── Strong ecosystem (extensions, tools)

Cons:
├── Slightly more complex than MySQL
├── Requires more configuration
└── Larger resource footprint

Alternatives considered:
├── MySQL: Simpler, but less feature-rich
├── MongoDB: Document-based, not ideal for relational payroll data
└── SQLite: Good for small scale, not for production multi-tenant
```

### Why Sequelize?

```
Pros:
├── Mature and battle-tested ORM
├── Strong TypeScript support
├── Model-based approach with associations
├── Built-in migrations and seeders
├── Hooks and validations
├── Connection pooling
└── Large community and documentation

Cons:
├── Can be verbose for complex queries
├── Learning curve for associations
├── Some complex queries need raw SQL
└── Heavier than query builders

Alternatives considered:
├── Prisma: Modern, but different paradigm
├── TypeORM: Decorator-based, similar features
├── Knex.js: Query builder, more control
└── Raw SQL: Maximum control, more boilerplate
```

---

## Project Structure

### Frontend (`/client`)

```
client/
├── public/
│   └── assets/
├── src/
│   ├── main.tsx                # App entry point
│   ├── App.tsx                 # Root component with routing
│   ├── index.css               # Global styles (Tailwind)
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   └── ResetPasswordPage.tsx
│   │   ├── dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── index.tsx
│   │   ├── employees/
│   │   │   ├── EmployeeListPage.tsx
│   │   │   ├── EmployeeDetailPage.tsx
│   │   │   └── EmployeeFormPage.tsx
│   │   ├── payroll/
│   │   │   ├── PayrollPeriodsPage.tsx
│   │   │   ├── PayrollProcessPage.tsx
│   │   │   └── PayslipViewPage.tsx
│   │   ├── expenses/
│   │   │   ├── ExpenseListPage.tsx
│   │   │   ├── ExpenseDetailPage.tsx
│   │   │   └── ExpenseFormPage.tsx
│   │   ├── reports/
│   │   │   └── ReportsPage.tsx
│   │   └── settings/
│   │       └── SettingsPage.tsx
│   ├── components/
│   │   ├── common/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── ...
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── forms/
│   │   │   ├── EmployeeForm.tsx
│   │   │   ├── ExpenseForm.tsx
│   │   │   └── ...
│   │   └── features/
│   │       ├── employees/
│   │       ├── payroll/
│   │       └── expenses/
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useEmployees.ts
│   │   └── ...
│   ├── lib/
│   │   ├── api.ts              # Axios API client
│   │   ├── utils.ts
│   │   └── validations/
│   ├── stores/
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── types/
│   │   ├── employee.ts
│   │   ├── payroll.ts
│   │   └── ...
│   ├── routes/
│   │   ├── index.tsx           # Route definitions
│   │   └── ProtectedRoute.tsx
│   └── constants/
├── .env
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

### Backend (`/server`)

```
server/
├── src/
│   ├── config/
│   │   ├── database.ts        # Sequelize config
│   │   ├── jwt.ts
│   │   ├── email.ts
│   │   └── storage.ts
│   ├── models/                # Sequelize models
│   │   ├── index.ts           # Model associations
│   │   ├── Tenant.ts
│   │   ├── User.ts
│   │   ├── Role.ts
│   │   ├── Employee.ts
│   │   ├── Department.ts
│   │   ├── PayrollPeriod.ts
│   │   ├── Payroll.ts
│   │   ├── Expense.ts
│   │   └── ...
│   ├── migrations/            # Sequelize migrations
│   │   ├── 001-create-tenants.ts
│   │   ├── 002-create-users.ts
│   │   └── ...
│   ├── seeders/               # Database seeders
│   │   ├── 001-roles.ts
│   │   ├── 002-permissions.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.ts            # JWT authentication
│   │   ├── rbac.ts            # Role-based access control
│   │   ├── tenant.ts          # Multi-tenancy middleware
│   │   ├── validate.ts        # Request validation
│   │   ├── errorHandler.ts    # Global error handling
│   │   └── rateLimiter.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.validation.ts
│   │   ├── employees/
│   │   │   ├── employee.controller.ts
│   │   │   ├── employee.service.ts
│   │   │   ├── employee.routes.ts
│   │   │   └── employee.validation.ts
│   │   ├── payroll/
│   │   │   ├── payroll.controller.ts
│   │   │   ├── payroll.service.ts
│   │   │   ├── payroll.routes.ts
│   │   │   ├── payroll.validation.ts
│   │   │   └── payroll.calculator.ts   # Payroll calculation logic
│   │   ├── expenses/
│   │   │   ├── expense.controller.ts
│   │   │   ├── expense.service.ts
│   │   │   ├── expense.routes.ts
│   │   │   └── expense.validation.ts
│   │   ├── reports/
│   │   ├── notifications/
│   │   ├── documents/
│   │   └── audit/
│   ├── services/
│   │   ├── email.service.ts
│   │   ├── pdf.service.ts
│   │   ├── storage.service.ts
│   │   └── statutory.service.ts   # PAYE, NSSF, NHIF calculations
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   ├── helpers.ts
│   │   └── constants.ts
│   ├── types/
│   │   ├── express.d.ts       # Express type extensions
│   │   └── index.ts
│   ├── jobs/
│   │   ├── payroll.job.ts
│   │   └── notification.job.ts
│   ├── routes/
│   │   └── index.ts           # Route aggregation
│   └── app.ts                 # Express app setup
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── .env
├── .env.example
├── .sequelizerc              # Sequelize CLI config
├── docker-compose.yml
├── Dockerfile
├── tsconfig.json
└── package.json
```

---

## Development Workflow

### Local Development

```bash
# 1. Clone repository
git clone <repo-url>
cd payroll

# 2. Install dependencies
cd client && npm install
cd ../server && npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start services with Docker
docker-compose up -d postgres redis

# 5. Run database migrations
cd server
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# 6. Start development servers
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm run dev
```

### Docker Compose (Development)

```yaml
version: "3.8"
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: payroll
      POSTGRES_PASSWORD: payroll123
      POSTGRES_DB: payroll_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  redis_data:
```

---

## Environment Variables

### Backend (`.env`)

```env
# Application
NODE_ENV=development
PORT=5000
API_VERSION=v1

# Database
DATABASE_URL="postgresql://payroll:payroll123@localhost:5432/payroll_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@payroll.com

# File Storage (Cloudinary example)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Frontend URL (for CORS, emails)
FRONTEND_URL=http://localhost:3000
```

### Frontend (`.env`)

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_APP_NAME="Payroll System"
```

---

## Quality Standards

### Code Quality

| Tool                   | Purpose           |
| ---------------------- | ----------------- |
| ESLint                 | Code linting      |
| Prettier               | Code formatting   |
| Husky                  | Git hooks         |
| lint-staged            | Pre-commit checks |
| TypeScript strict mode | Type safety       |

### Testing

| Type              | Tool             | Coverage Target |
| ----------------- | ---------------- | --------------- |
| Unit Tests        | Jest / Vitest    | 80%+            |
| Integration Tests | Supertest        | Critical paths  |
| E2E Tests         | Playwright       | Key workflows   |
| API Tests         | Postman/Insomnia | All endpoints   |

### Documentation

| Type      | Tool            |
| --------- | --------------- |
| API Docs  | Swagger/OpenAPI |
| Code Docs | TypeDoc         |
| User Docs | Markdown        |

---

## Security Checklist

- [ ] HTTPS everywhere
- [ ] Helmet.js for security headers
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] SQL injection prevention (Sequelize parameterized)
- [ ] XSS prevention (React auto-escapes)
- [ ] CSRF tokens for forms
- [ ] Password hashing (bcrypt)
- [ ] JWT with proper expiry
- [ ] Sensitive data encryption
- [ ] Input validation on all endpoints
- [ ] File upload validation
- [ ] Audit logging enabled
- [ ] Regular dependency updates

---

## Performance Considerations

1. **Database**

   - Connection pooling (Sequelize default)
   - Proper indexing (see DATABASE_SCHEMA.md)
   - Query optimization
   - Pagination for list endpoints

2. **API**

   - Response compression
   - Caching strategies (Redis)
   - Lazy loading

3. **Frontend**
   - Code splitting (React.lazy + Suspense)
   - Image optimization
   - Lazy loading components
   - Virtual lists for large tables

---

## Next Steps

1. Review [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for build phases
2. Set up the development environment
3. Begin Phase 1 implementation
