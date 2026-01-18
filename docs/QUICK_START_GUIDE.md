# Quick Start Guide

## 5-Minute Setup Checklist

Follow these essential steps to get your payroll system up and running:

### Step 1: Register Your Organization (2 minutes)

1. Go to registration page
2. Enter:
   - Organization Name
   - Organization Subdomain (unique identifier)
   - Admin Name, Email, Password
3. Click **Register**
4. You're automatically logged in

### Step 2: Configure Statutory Rates (2 minutes)

1. Navigate to **Admin > Statutory Rates**
2. Create three rates:

**PAYE:**
- Rate Type: `paye`
- Country: `Kenya`
- Effective From: `2024-01-01`
- Config:
```json
{
  "brackets": [
    {"min": 0, "max": 24000, "rate": 10},
    {"min": 24001, "max": 32333, "rate": 25},
    {"min": 32334, "max": null, "rate": 30}
  ],
  "personalRelief": 2400
}
```

**NSSF:**
- Rate Type: `nssf`
- Country: `Kenya`
- Effective From: `2024-01-01`
- Config:
```json
{
  "rate": 6,
  "maxAmount": 18000
}
```

**NHIF:**
- Rate Type: `nhif`
- Country: `Kenya`
- Effective From: `2024-01-01`
- Config:
```json
{
  "tiers": [
    {"min": 0, "max": 5999, "amount": 150},
    {"min": 6000, "max": 7999, "amount": 300},
    {"min": 8000, "max": 11999, "amount": 400},
    {"min": 12000, "max": 14999, "amount": 500},
    {"min": 15000, "max": 19999, "amount": 600},
    {"min": 20000, "max": 24999, "amount": 750},
    {"min": 25000, "max": 29999, "amount": 850},
    {"min": 30000, "max": 34999, "amount": 900},
    {"min": 35000, "max": 39999, "amount": 950},
    {"min": 40000, "max": null, "amount": 1000}
  ]
}
```

### Step 3: Create Salary Components (1 minute)

1. Navigate to **Salary > Components**
2. Create these essential components:

**Basic Salary:**
- Name: `Basic Salary`
- Code: `BASIC`
- Type: `earning`
- Category: `basic`
- Calculation: `fixed`
- Default Amount: `50000`
- Taxable: `Yes`

**Transport Allowance:**
- Name: `Transport Allowance`
- Code: `TRANSPORT`
- Type: `earning`
- Category: `allowance`
- Calculation: `fixed`
- Default Amount: `5000`
- Taxable: `Yes`

**PAYE (Display):**
- Name: `PAYE`
- Code: `PAYE`
- Type: `deduction`
- Category: `statutory`
- Calculation: `fixed`
- Default Amount: `0`
- Statutory: `Yes`
- Statutory Type: `paye`

**NSSF (Display):**
- Name: `NSSF`
- Code: `NSSF`
- Type: `deduction`
- Category: `statutory`
- Calculation: `fixed`
- Default Amount: `0`
- Statutory: `Yes`
- Statutory Type: `nssf`

**NHIF (Display):**
- Name: `NHIF`
- Code: `NHIF`
- Type: `deduction`
- Category: `statutory`
- Calculation: `fixed`
- Default Amount: `0`
- Statutory: `Yes`
- Statutory Type: `nhif`

## Essential Workflows

### Adding Your First Employee

1. Go to **Employees**
2. Click **Add Employee**
3. Fill in:
   - Personal Information (Name, DOB, etc.)
   - Contact Information
   - Employment Details (Department, Job Title, Hire Date)
   - KRA PIN, NSSF Number, NHIF Number
4. Click **Create Employee**
5. Go to **Salary** tab
6. Click **Add Component**
7. Select components and enter amounts
8. Set Effective From date
9. Click **Save**

### Processing Your First Payroll

1. Go to **Payroll > Periods**
2. Click **Create Period**
3. Enter:
   - Period Name: `Payroll January 2026`
   - Start Date: `2026-01-01`
   - End Date: `2026-01-31`
   - Pay Date: `2026-02-05`
4. Click **Create**
5. Click **Process Payroll**
6. Review payroll summary
7. Click **Approve Payroll**
8. Click **Lock Period**

## Quick Reference

### Navigation Paths

| Feature | Path |
|---------|------|
| Employees | `/employees` |
| Departments | `/departments` |
| Salary Components | `/salary/components` |
| Statutory Rates | `/admin/statutory-rates` |
| Payroll Periods | `/payroll/periods` |
| Reports | `/reports` |
| Tax Remittances | `/reports/tax-remittances` |

### Key API Endpoints

| Action | Endpoint | Method |
|--------|----------|--------|
| Get Statutory Rates | `/api/settings/statutory-rates` | GET |
| Create Statutory Rate | `/api/settings/statutory-rates` | POST |
| Get Salary Components | `/api/salary-components` | GET |
| Create Salary Component | `/api/salary-components` | POST |
| Get Employee Salary | `/api/employees/:id/salary` | GET |
| Assign Components | `/api/employees/:id/salary/components` | POST |
| Process Payroll | `/api/payroll-periods/:id/process` | POST |

### Common Configurations

#### PAYE Configuration Template
```json
{
  "brackets": [
    {"min": 0, "max": 24000, "rate": 10},
    {"min": 24001, "max": 32333, "rate": 25},
    {"min": 32334, "max": null, "rate": 30}
  ],
  "personalRelief": 2400
}
```

#### NSSF Configuration Template
```json
{
  "rate": 6,
  "maxAmount": 18000
}
```

#### NHIF Configuration Template
```json
{
  "tiers": [
    {"min": 0, "max": 5999, "amount": 150},
    {"min": 6000, "max": 7999, "amount": 300},
    {"min": 8000, "max": 11999, "amount": 400},
    {"min": 12000, "max": 14999, "amount": 500},
    {"min": 15000, "max": 19999, "amount": 600},
    {"min": 20000, "max": 24999, "amount": 750},
    {"min": 25000, "max": 29999, "amount": 850},
    {"min": 30000, "max": 34999, "amount": 900},
    {"min": 35000, "max": 39999, "amount": 950},
    {"min": 40000, "max": null, "amount": 1000}
  ]
}
```

## Common Tasks

### Adding a New Employee

1. Employees → Add Employee
2. Fill in required information
3. Create Employee
4. Go to Salary tab
5. Assign salary components
6. Set amounts and effective date

### Creating a Payroll Period

1. Payroll → Periods → Create Period
2. Enter period name and dates
3. Create period
4. Process Payroll
5. Review and Approve
6. Lock Period

### Viewing Tax Summary

1. Reports → Payroll Reports
2. Select "Tax Summary" tab
3. Set date range
4. View report
5. Check remittance status

### Managing Tax Remittances

1. Reports → Tax Remittances
2. View pending remittances
3. Filter by status, type, date
4. Mark as remitted when paid
5. Track remittance history

## Troubleshooting Quick Fixes

### Taxes Showing as Zero

**Quick Fix:**
1. Go to Admin > Statutory Rates
2. Verify PAYE, NSSF, NHIF rates exist and are active
3. Check effective dates match payroll period
4. Reprocess payroll

### Employee Has No Salary

**Quick Fix:**
1. Go to Employees > [Employee] > Salary
2. Click Add Component
3. Select components and set amounts
4. Set effective date
5. Save

### Payroll Processing Fails

**Quick Fix:**
1. Check employees have salary components
2. Verify statutory rates are configured
3. Check period dates are valid
4. Review error messages
5. Fix issues and retry

## Next Steps

After completing the quick start:

1. **Read Full Guides:**
   - [Statutory Rates Guide](./STATUTORY_RATES_GUIDE.md) - Detailed rate configuration
   - [Salary Components Guide](./SALARY_COMPONENTS_GUIDE.md) - Component setup
   - [Complete System Guide](./COMPLETE_SYSTEM_GUIDE.md) - Full system workflow

2. **Explore Features:**
   - Expense Management
   - Loan Management
   - Advanced Reporting
   - User Role Management

3. **Set Up Additional Features:**
   - Expense Categories
   - Loan Types
   - Custom Reports
   - Notification Preferences

## Support Resources

- **Documentation**: See other guide files in this directory
- **Troubleshooting**: [Troubleshooting Guide](./TROUBLESHOOTING_GUIDE.md)
- **Configuration Templates**: [Configuration Templates](./CONFIGURATION_TEMPLATES.md) - Ready-to-use JSON templates
- **System Logs**: Check server logs for detailed errors
- **Audit Logs**: Admin > Audit Logs for system activity

## Important Reminders

1. **Always configure statutory rates before processing payroll**
2. **Assign salary components to employees before payroll processing**
3. **Review payroll calculations before approving**
4. **Lock periods after approval to prevent changes**
5. **Keep statutory rates updated when tax laws change**

---

**Ready to start?** Follow the 5-minute setup checklist above, then explore the detailed guides for comprehensive information.
