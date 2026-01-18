# Payroll & Expense Management System v2

A simplified, clean rebuild of the payroll system with improved architecture and UI.

## Project Structure

```
payroll-v2/
├── server/          # Backend (Express + TypeScript + Sequelize)
└── client/          # Frontend (React + TypeScript + Vite)
```

## Features

- ✅ Multi-tenant architecture
- ✅ Authentication & Authorization (JWT)
- ✅ Department Management
- ✅ Employee Management
- ✅ Clean, simplified codebase
- ✅ Improved UI with proper spacing and styling

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL
- npm >= 9.0.0

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start Docker services (PostgreSQL, Redis, Mailhog):
```bash
cd server
docker-compose up -d
```

4. Create `.env` file in server directory:
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
DATABASE_URL=postgresql://payroll:payroll123@localhost:5432/payroll_dev
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
LOG_LEVEL=info
```

5. Seed database with initial data:
```bash
npm run seed:dev
```

6. Start development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file (optional):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start development server:
```bash
npm run dev
```

## Architecture Improvements

### Backend
- Function-based controllers (simpler than class-based)
- Direct model usage (removed unnecessary service layer for simple CRUD)
- Cleaner validation with express-validator
- Simplified error handling

### Frontend
- Improved UI components with proper spacing
- Reusable DataTable component
- Better form components with consistent styling
- Simplified state management (Zustand only for auth)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new tenant and admin
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Departments
- `GET /api/departments` - Get all departments
- `GET /api/departments/:id` - Get single department
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Employees
- `GET /api/employees` - Get all employees (with pagination and search)
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

## Development

### Backend
```bash
npm run dev      # Start with nodemon
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run linter
```

### Frontend
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run linter
```

## Documentation

Comprehensive guides are available to help you configure and use the system:

- **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Get started in 5 minutes
- **[Statutory Rates Guide](./STATUTORY_RATES_GUIDE.md)** - Configure PAYE, NSSF, NHIF rates
- **[Salary Components Guide](./SALARY_COMPONENTS_GUIDE.md)** - Set up salary components
- **[Complete System Guide](./COMPLETE_SYSTEM_GUIDE.md)** - Full system workflow documentation
- **[Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)** - Common issues and solutions
- **[Configuration Templates](./CONFIGURATION_TEMPLATES.md)** - Ready-to-use JSON templates

### Quick Setup Checklist

1. **Configure Statutory Rates** (Required before payroll)
   - Set up PAYE brackets
   - Set up NSSF rate
   - Set up NHIF tiers
   - See [Statutory Rates Guide](./STATUTORY_RATES_GUIDE.md)

2. **Create Salary Components**
   - Basic Salary
   - Allowances (Transport, House, Medical)
   - Statutory components (PAYE, NSSF, NHIF)
   - See [Salary Components Guide](./SALARY_COMPONENTS_GUIDE.md)

3. **Add Employees**
   - Create employee records
   - Assign salary components
   - Set effective dates

4. **Process Payroll**
   - Create payroll period
   - Process payroll
   - Review and approve
   - Lock period

For detailed instructions, see the [Complete System Guide](./COMPLETE_SYSTEM_GUIDE.md).

## License

MIT

