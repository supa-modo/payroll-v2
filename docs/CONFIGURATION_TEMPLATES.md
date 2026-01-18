# Configuration Templates

This document provides ready-to-use configuration templates for quick setup of the payroll system.

## Statutory Rates Templates

### Kenya PAYE Configuration (2024)

```json
{
  "rateType": "paye",
  "country": "Kenya",
  "effectiveFrom": "2024-01-01",
  "effectiveTo": null,
  "config": {
    "brackets": [
      {
        "min": 0,
        "max": 24000,
        "rate": 10
      },
      {
        "min": 24001,
        "max": 32333,
        "rate": 25
      },
      {
        "min": 32334,
        "max": null,
        "rate": 30
      }
    ],
    "personalRelief": 2400
  },
  "isActive": true
}
```

**API Call:**
```bash
POST /api/settings/statutory-rates
Content-Type: application/json

{
  "rateType": "paye",
  "country": "Kenya",
  "effectiveFrom": "2024-01-01",
  "config": {
    "brackets": [
      {"min": 0, "max": 24000, "rate": 10},
      {"min": 24001, "max": 32333, "rate": 25},
      {"min": 32334, "max": null, "rate": 30}
    ],
    "personalRelief": 2400
  }
}
```

### Kenya NSSF Configuration (2024)

```json
{
  "rateType": "nssf",
  "country": "Kenya",
  "effectiveFrom": "2024-01-01",
  "effectiveTo": null,
  "config": {
    "rate": 6,
    "maxAmount": 18000
  },
  "isActive": true
}
```

**API Call:**
```bash
POST /api/settings/statutory-rates
Content-Type: application/json

{
  "rateType": "nssf",
  "country": "Kenya",
  "effectiveFrom": "2024-01-01",
  "config": {
    "rate": 6,
    "maxAmount": 18000
  }
}
```

### Kenya NHIF Configuration (2024)

```json
{
  "rateType": "nhif",
  "country": "Kenya",
  "effectiveFrom": "2024-01-01",
  "effectiveTo": null,
  "config": {
    "tiers": [
      {
        "min": 0,
        "max": 5999,
        "amount": 150
      },
      {
        "min": 6000,
        "max": 7999,
        "amount": 300
      },
      {
        "min": 8000,
        "max": 11999,
        "amount": 400
      },
      {
        "min": 12000,
        "max": 14999,
        "amount": 500
      },
      {
        "min": 15000,
        "max": 19999,
        "amount": 600
      },
      {
        "min": 20000,
        "max": 24999,
        "amount": 750
      },
      {
        "min": 25000,
        "max": 29999,
        "amount": 850
      },
      {
        "min": 30000,
        "max": 34999,
        "amount": 900
      },
      {
        "min": 35000,
        "max": 39999,
        "amount": 950
      },
      {
        "min": 40000,
        "max": null,
        "amount": 1000
      }
    ]
  },
  "isActive": true
}
```

**API Call:**
```bash
POST /api/settings/statutory-rates
Content-Type: application/json

{
  "rateType": "nhif",
  "country": "Kenya",
  "effectiveFrom": "2024-01-01",
  "config": {
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
}
```

## Salary Component Templates

### Basic Salary Component

```json
{
  "name": "Basic Salary",
  "code": "BASIC",
  "type": "earning",
  "category": "basic",
  "calculationType": "fixed",
  "defaultAmount": 50000,
  "isTaxable": true,
  "isStatutory": false,
  "isActive": true,
  "displayOrder": 1
}
```

### Transport Allowance (Fixed)

```json
{
  "name": "Transport Allowance",
  "code": "TRANSPORT",
  "type": "earning",
  "category": "allowance",
  "calculationType": "fixed",
  "defaultAmount": 5000,
  "isTaxable": true,
  "isStatutory": false,
  "isActive": true,
  "displayOrder": 2
}
```

### Transport Allowance (Percentage)

```json
{
  "name": "Transport Allowance",
  "code": "TRANSPORT",
  "type": "earning",
  "category": "allowance",
  "calculationType": "percentage",
  "percentageOf": "<BASIC_COMPONENT_ID>",
  "percentageValue": 10,
  "isTaxable": true,
  "isStatutory": false,
  "isActive": true,
  "displayOrder": 2
}
```

**Note**: Replace `<BASIC_COMPONENT_ID>` with the actual Basic Salary component ID.

### House Allowance

```json
{
  "name": "House Allowance",
  "code": "HOUSE",
  "type": "earning",
  "category": "allowance",
  "calculationType": "fixed",
  "defaultAmount": 15000,
  "isTaxable": true,
  "isStatutory": false,
  "isActive": true,
  "displayOrder": 3
}
```

### Medical Allowance (Non-Taxable)

```json
{
  "name": "Medical Allowance",
  "code": "MEDICAL",
  "type": "earning",
  "category": "allowance",
  "calculationType": "fixed",
  "defaultAmount": 3000,
  "isTaxable": false,
  "isStatutory": false,
  "isActive": true,
  "displayOrder": 4
}
```

### PAYE Component (Display Only)

```json
{
  "name": "PAYE",
  "code": "PAYE",
  "type": "deduction",
  "category": "statutory",
  "calculationType": "fixed",
  "defaultAmount": 0,
  "isTaxable": false,
  "isStatutory": true,
  "statutoryType": "paye",
  "isActive": true,
  "displayOrder": 10
}
```

### NSSF Component (Display Only)

```json
{
  "name": "NSSF",
  "code": "NSSF",
  "type": "deduction",
  "category": "statutory",
  "calculationType": "fixed",
  "defaultAmount": 0,
  "isTaxable": false,
  "isStatutory": true,
  "statutoryType": "nssf",
  "isActive": true,
  "displayOrder": 11
}
```

### NHIF Component (Display Only)

```json
{
  "name": "NHIF",
  "code": "NHIF",
  "type": "deduction",
  "category": "statutory",
  "calculationType": "fixed",
  "defaultAmount": 0,
  "isTaxable": false,
  "isStatutory": true,
  "statutoryType": "nhif",
  "isActive": true,
  "displayOrder": 12
}
```

### Loan Deduction Component

```json
{
  "name": "Loan Deduction",
  "code": "LOAN",
  "type": "deduction",
  "category": "internal",
  "calculationType": "fixed",
  "defaultAmount": 0,
  "isTaxable": false,
  "isStatutory": false,
  "isActive": true,
  "displayOrder": 20
}
```

## Employee Salary Assignment Template

### Assigning Multiple Components to Employee

```json
{
  "components": [
    {
      "salaryComponentId": "<BASIC_COMPONENT_ID>",
      "amount": 50000
    },
    {
      "salaryComponentId": "<TRANSPORT_COMPONENT_ID>",
      "amount": 5000
    },
    {
      "salaryComponentId": "<HOUSE_COMPONENT_ID>",
      "amount": 15000
    },
    {
      "salaryComponentId": "<MEDICAL_COMPONENT_ID>",
      "amount": 3000
    }
  ],
  "effectiveFrom": "2024-01-01",
  "reason": "Initial salary assignment"
}
```

**API Call:**
```bash
POST /api/employees/:employeeId/salary/components
Content-Type: application/json

{
  "components": [
    {"salaryComponentId": "uuid-here", "amount": 50000},
    {"salaryComponentId": "uuid-here", "amount": 5000},
    {"salaryComponentId": "uuid-here", "amount": 15000}
  ],
  "effectiveFrom": "2024-01-01",
  "reason": "Initial salary assignment"
}
```

## Payroll Period Template

### Creating a Monthly Payroll Period

```json
{
  "name": "Payroll January 2026",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "payDate": "2026-02-05",
  "periodType": "monthly"
}
```

**API Call:**
```bash
POST /api/payroll-periods
Content-Type: application/json

{
  "name": "Payroll January 2026",
  "startDate": "2026-01-01",
  "endDate": "2026-01-31",
  "payDate": "2026-02-05",
  "periodType": "monthly"
}
```

## Complete Setup Sequence

### Step 1: Create Statutory Rates

```bash
# Create PAYE
curl -X POST http://localhost:3000/api/settings/statutory-rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rateType": "paye",
    "country": "Kenya",
    "effectiveFrom": "2024-01-01",
    "config": {
      "brackets": [
        {"min": 0, "max": 24000, "rate": 10},
        {"min": 24001, "max": 32333, "rate": 25},
        {"min": 32334, "max": null, "rate": 30}
      ],
      "personalRelief": 2400
    }
  }'

# Create NSSF
curl -X POST http://localhost:3000/api/settings/statutory-rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rateType": "nssf",
    "country": "Kenya",
    "effectiveFrom": "2024-01-01",
    "config": {
      "rate": 6,
      "maxAmount": 18000
    }
  }'

# Create NHIF
curl -X POST http://localhost:3000/api/settings/statutory-rates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rateType": "nhif",
    "country": "Kenya",
    "effectiveFrom": "2024-01-01",
    "config": {
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
  }'
```

### Step 2: Create Salary Components

```bash
# Create Basic Salary
curl -X POST http://localhost:3000/api/salary-components \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Basic Salary",
    "code": "BASIC",
    "type": "earning",
    "category": "basic",
    "calculationType": "fixed",
    "defaultAmount": 50000,
    "isTaxable": true,
    "isStatutory": false,
    "isActive": true,
    "displayOrder": 1
  }'

# Create Transport Allowance
curl -X POST http://localhost:3000/api/salary-components \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Transport Allowance",
    "code": "TRANSPORT",
    "type": "earning",
    "category": "allowance",
    "calculationType": "fixed",
    "defaultAmount": 5000,
    "isTaxable": true,
    "isStatutory": false,
    "isActive": true,
    "displayOrder": 2
  }'
```

### Step 3: Assign Components to Employee

```bash
curl -X POST http://localhost:3000/api/employees/EMPLOYEE_ID/salary/components \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "components": [
      {"salaryComponentId": "BASIC_COMPONENT_ID", "amount": 50000},
      {"salaryComponentId": "TRANSPORT_COMPONENT_ID", "amount": 5000}
    ],
    "effectiveFrom": "2024-01-01",
    "reason": "Initial salary assignment"
  }'
```

### Step 4: Create and Process Payroll

```bash
# Create Period
curl -X POST http://localhost:3000/api/payroll-periods \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Payroll January 2026",
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "payDate": "2026-02-05"
  }'

# Process Payroll
curl -X POST http://localhost:3000/api/payroll-periods/PERIOD_ID/process \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Usage Notes

1. **Replace Placeholders:**
   - Replace `<BASIC_COMPONENT_ID>` with actual component IDs
   - Replace `EMPLOYEE_ID` with actual employee IDs
   - Replace `PERIOD_ID` with actual period IDs
   - Replace `YOUR_TOKEN` with actual authentication token

2. **Get Component IDs:**
   ```bash
   GET /api/salary-components
   ```
   Response includes component IDs in the response.

3. **Get Employee IDs:**
   ```bash
   GET /api/employees
   ```
   Response includes employee IDs.

4. **Date Formats:**
   - All dates must be in `YYYY-MM-DD` format
   - Example: `2024-01-01`

5. **Amount Formats:**
   - All amounts are numbers (can include decimals)
   - Example: `50000` or `50000.50`

## Testing Templates

### Test PAYE Calculation

**Employee with Taxable Income of 50,000:**
- Expected PAYE: ~7,383.05
- Calculation:
  - First bracket (0-24,000): 24,000 × 10% = 2,400
  - Second bracket (24,001-32,333): 8,333 × 25% = 2,083.25
  - Third bracket (32,334-50,000): 17,666 × 30% = 5,299.80
  - Total: 9,783.05
  - Less Personal Relief: 9,783.05 - 2,400 = **7,383.05**

### Test NSSF Calculation

**Employee with Gross Pay of 30,000:**
- Expected NSSF: 1,080
- Calculation: min(30,000, 18,000) × 6% = 1,080

**Employee with Gross Pay of 15,000:**
- Expected NSSF: 900
- Calculation: 15,000 × 6% = 900

### Test NHIF Calculation

**Employee with Gross Pay of 25,000:**
- Expected NHIF: 850
- Falls in tier: 25,000 - 29,999

**Employee with Gross Pay of 45,000:**
- Expected NHIF: 1,000
- Falls in tier: 40,000 and above

## Import Script Example

### Bulk Import Statutory Rates

```javascript
// Example Node.js script to import all statutory rates
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const TOKEN = 'YOUR_AUTH_TOKEN';

const rates = [
  {
    rateType: 'paye',
    country: 'Kenya',
    effectiveFrom: '2024-01-01',
    config: {
      brackets: [
        {min: 0, max: 24000, rate: 10},
        {min: 24001, max: 32333, rate: 25},
        {min: 32334, max: null, rate: 30}
      ],
      personalRelief: 2400
    }
  },
  {
    rateType: 'nssf',
    country: 'Kenya',
    effectiveFrom: '2024-01-01',
    config: {
      rate: 6,
      maxAmount: 18000
    }
  },
  {
    rateType: 'nhif',
    country: 'Kenya',
    effectiveFrom: '2024-01-01',
    config: {
      tiers: [
        {min: 0, max: 5999, amount: 150},
        {min: 6000, max: 7999, amount: 300},
        // ... rest of tiers
      ]
    }
  }
];

async function importRates() {
  for (const rate of rates) {
    try {
      const response = await axios.post(
        `${API_BASE}/settings/statutory-rates`,
        rate,
        {
          headers: {
            'Authorization': `Bearer ${TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      console.log(`✓ Created ${rate.rateType} rate`);
    } catch (error) {
      console.error(`✗ Failed to create ${rate.rateType}:`, error.response?.data);
    }
  }
}

importRates();
```

## Next Steps

After using these templates:

1. **Verify Configuration**: Test with sample calculations
2. **Customize**: Adjust amounts and rates for your organization
3. **Document**: Keep records of your configurations
4. **Update**: Keep rates updated when tax laws change

For detailed instructions, see:
- [Statutory Rates Guide](./STATUTORY_RATES_GUIDE.md)
- [Salary Components Guide](./SALARY_COMPONENTS_GUIDE.md)
- [Complete System Guide](./COMPLETE_SYSTEM_GUIDE.md)
