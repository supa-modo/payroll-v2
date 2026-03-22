## Kenya Payroll Compliance Checklist

### 1. Statutory Deductions

- **PAYE (Residents)**: Progressive bands (10–35%) applied to taxable income with personal and insurance reliefs deducted after band tax. Verified programmatically in `src/tests/payroll/kenyaPayrollCompliance.spec.ts` via processing a monthly payroll and inspecting gross pay, deductions, and net pay.
- **NSSF**: Tiered contributions using the latest Kenya two-tier rules, applied to pensionable pay and capped per tier. Exercised indirectly by the same payroll compliance test through the statutory calculation service.
- **SHIF**: 2.75% of gross salary with a minimum of KES 300 per month, no employer contribution. Asserted in the payroll compliance test by checking that SHIF is non-zero and scales with gross.
- **Housing Levy (AHL)**: 1.5% of gross salary for employee (employer-side handled externally), included as a statutory deduction item and stored on `Payroll`. Covered by the payroll compliance test where total statutory deductions must include Housing Levy.

### 2. Reliefs

- **Personal Relief**: Standard monthly KES 2,400 plus any configured mandatory or employee-specific reliefs. Applied after band tax and validated by end-to-end payroll runs for fixture employees.
- **Insurance Relief**: Percentage-based up to a monthly cap, using SHIF and configured insurance reliefs. Capped correctly and reflected in PAYE net tax. Verified indirectly by ensuring PAYE remains non-negative after reliefs.

### 3. Process Deadlines

- **Remittance Due Dates**: All statutory deductions (PAYE, NSSF, SHIF, Housing Levy) must be remitted by the 9th of the following month. Operationally enforced via:
  - Period lifecycle: `draft → processing → pending_approval → approved → locked`.
  - Locking a period triggers creation of `TaxRemittance` records (tested in `src/tests/payroll/payrollLifecycle.spec.ts`).

### 4. Application in System

- **Payroll Period Lifecycle**: Creation, overlap prevention, processing, approval, and locking paths validated in `src/tests/payroll/payrollLifecycle.spec.ts`.
- **Employee Onboarding & Salary Setup**: Basic flows for creating employees and ensuring salary setup are covered in `src/tests/employees/employeeOnboarding.spec.ts`, which can be extended with assertions on mandatory deductions and revision history.
- **Loans and Auto-Deductions**: Fixture employees include a loaned case; during payroll processing, loan repayments are created and loan balances updated, ensuring no duplicate repayments on re-processing (covered in payroll lifecycle and compliance paths).
- **Expenses & RBAC**: Expense submission and basic permission flows are exercised via `src/tests/expenses/expensePermissions.spec.ts`, which confirms that authenticated users with the right role can submit expenses through the API.

