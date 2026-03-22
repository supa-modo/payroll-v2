import dotenv from "dotenv";
import { sequelize } from "../config/database";
import {
  Tenant,
  User,
  Employee,
  SalaryComponent,
  EmployeeSalaryComponent,
  EmployeeLoan,
} from "../models";
import logger from "../utils/logger";

dotenv.config();

async function seedFixtures() {
  await sequelize.authenticate();

  const [tenant] = await Tenant.findOrCreate({
    where: { slug: "kenya-corp" },
    defaults: {
      name: "KENYA_CORP LTD",
      slug: "kenya-corp",
      email: "info@kenya-corp.local",
      settings: {},
      isActive: true,
    },
  });

  // Core users
  const [tenantAdmin] = await User.findOrCreate({
    where: { email: "admin@fixture.local", tenantId: tenant.id },
    defaults: {
      email: "admin@fixture.local",
      password: "Password123!",
      firstName: "Admin",
      lastName: "Fixture",
      role: "admin",
      isActive: true,
      isEmailVerified: true,
      tenantId: tenant.id,
      isSystemAdmin: false,
    },
  });

  const employeesData = [
    {
      key: "standard",
      email: "standard@fixture.local",
      basicSalary: 100000,
    },
    {
      key: "high",
      email: "high@fixture.local",
      basicSalary: 900000,
    },
    {
      key: "low",
      email: "low@fixture.local",
      basicSalary: 20000,
    },
    {
      key: "loan",
      email: "loan@fixture.local",
      basicSalary: 120000,
    },
  ] as const;

  const today = new Date().toISOString().slice(0, 10);

  // Create salary components (tenant-scoped)
  const components: Record<string, SalaryComponent> = {};
  const componentDefs = [
    { code: "BASIC", name: "Basic Salary", type: "earning", category: "basic" },
    { code: "HOUSE", name: "House Allowance", type: "earning", category: "allowance" },
    { code: "TRANSPORT", name: "Transport Allowance", type: "earning", category: "allowance" },
    { code: "PAYE", name: "PAYE", type: "deduction", category: "statutory", statutoryType: "paye" },
    { code: "NSSF", name: "NSSF", type: "deduction", category: "statutory", statutoryType: "nssf" },
    { code: "SHIF", name: "SHIF", type: "deduction", category: "statutory", statutoryType: "shif" },
    {
      code: "HOUSLEVY",
      name: "Housing Levy",
      type: "deduction",
      category: "statutory",
      statutoryType: "housing_levy",
    },
    {
      code: "LOAN_REPAY",
      name: "Loan Repayment",
      type: "deduction",
      category: "loan",
    },
  ];

  for (const def of componentDefs) {
    const [comp] = await SalaryComponent.findOrCreate({
      where: { tenantId: tenant.id, code: def.code },
      defaults: {
        tenantId: tenant.id,
        name: def.name,
        code: def.code,
        type: def.type,
        category: def.category,
        calculationType: "fixed",
        isTaxable: def.type === "earning",
        isStatutory: !!def.statutoryType,
        statutoryType: def.statutoryType || null,
        isActive: true,
        displayOrder: 0,
        createdBy: tenantAdmin.id,
      },
    });
    components[def.code] = comp;
  }

  // Create employees and assign salary components
  for (const emp of employeesData) {
    const [user] = await User.findOrCreate({
      where: { email: emp.email, tenantId: tenant.id },
      defaults: {
        email: emp.email,
        password: "Password123!",
        firstName: emp.key.toUpperCase(),
        lastName: "Employee",
        role: "employee",
        isActive: true,
        isEmailVerified: true,
        tenantId: tenant.id,
      },
    });

    const [employee] = await Employee.findOrCreate({
      where: { tenantId: tenant.id, employeeNumber: `${emp.key.toUpperCase()}-001` },
      defaults: {
        tenantId: tenant.id,
        userId: user.id,
        employeeNumber: `${emp.key.toUpperCase()}-001`,
        firstName: user.firstName,
        lastName: user.lastName,
        employmentType: "permanent",
        jobTitle: "Engineer",
        hireDate: today,
      } as any,
    });

    // Basic salary
    await EmployeeSalaryComponent.findOrCreate({
      where: {
        employeeId: employee.id,
        salaryComponentId: components["BASIC"].id,
        effectiveFrom: today,
      },
      defaults: {
        employeeId: employee.id,
        salaryComponentId: components["BASIC"].id,
        amount: emp.basicSalary,
        effectiveFrom: today,
        effectiveTo: null,
      } as any,
    });

    // For loan employee, create a loan and link repayment component via existing loan logic
    if (emp.key === "loan") {
      // `EmployeeLoan` model uses `loanType`/`loanNumber` (not `loanName`), and
      // `repaymentStartDate`/`monthlyDeduction` (not `startDate`/`monthlyRepaymentAmount`).
      await EmployeeLoan.findOrCreate({
        where: {
          tenantId: tenant.id,
          employeeId: employee.id,
          loanNumber: "FIXTURE-LOAN-001",
        } as any,
        defaults: {
          employeeId: employee.id,
          tenantId: tenant.id,
          loanType: "Fixture Loan",
          loanNumber: "FIXTURE-LOAN-001",
          principalAmount: 60000,
          totalAmount: 60000,
          repaymentStartDate: today,
          monthlyDeduction: 10000,
          remainingBalance: 60000,
          totalPaid: 0,
          interestRate: 0,
          status: "active",
          createdBy: tenantAdmin.id,
        } as any,
      });
    }
  }

  logger.info("Fixture seed completed");
}

if (require.main === module) {
  seedFixtures()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      logger.error("Fixture seed failed", err as Error);
      process.exit(1);
    });
}

