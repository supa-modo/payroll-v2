# Troubleshooting Guide

## Table of Contents

1. [Common Issues](#common-issues)
2. [Payroll Issues](#payroll-issues)
3. [Tax Calculation Issues](#tax-calculation-issues)
4. [Salary Component Issues](#salary-component-issues)
5. [Employee Management Issues](#employee-management-issues)
6. [Expense Management Issues](#expense-management-issues)
7. [System Configuration Issues](#system-configuration-issues)
8. [Best Practices](#best-practices)
9. [Validation Checklist](#validation-checklist)

## Common Issues

### Issue: Cannot Login

**Symptoms:**
- Login page shows error
- "Invalid credentials" message
- Account locked message

**Possible Causes:**
1. Incorrect email or password
2. Account is inactive
3. Account is locked (too many failed attempts)
4. Email not verified (if email verification is enabled)

**Solutions:**
1. **Verify Credentials:**
   - Double-check email and password
   - Check for typos
   - Ensure caps lock is off

2. **Reset Password:**
   - Click "Forgot Password" on login page
   - Enter your email
   - Check email for reset link
   - Follow instructions to reset password

3. **Contact Administrator:**
   - If account is locked, contact system administrator
   - Admin can unlock account or reset password

### Issue: Permission Denied Errors

**Symptoms:**
- "You don't have permission to access this resource"
- 403 Forbidden errors
- Features not visible in menu

**Possible Causes:**
1. User role doesn't have required permission
2. Role not assigned to user
3. Permission not granted to role

**Solutions:**
1. **Check User Role:**
   - Go to Admin > Roles
   - Find your user
   - Verify role is assigned

2. **Check Role Permissions:**
   - Go to Admin > Roles
   - Click on your role
   - Verify required permissions are granted

3. **Contact Administrator:**
   - Request permission to be added to your role
   - Or request a different role with required permissions

### Issue: Data Not Saving

**Symptoms:**
- Form submissions fail
- Changes not persisting
- Error messages on save

**Possible Causes:**
1. Required fields missing
2. Invalid data format
3. Validation errors
4. Network issues
5. Server errors

**Solutions:**
1. **Check Required Fields:**
   - Review form for required fields (marked with *)
   - Fill in all required fields

2. **Validate Data Format:**
   - Check date formats (YYYY-MM-DD)
   - Verify email formats
   - Check number formats

3. **Check Error Messages:**
   - Read error messages carefully
   - Address specific validation errors

4. **Check Network:**
   - Verify internet connection
   - Try refreshing the page
   - Check browser console for errors

5. **Contact Support:**
   - If issue persists, contact support with:
     - Error message
     - Steps to reproduce
     - Browser and OS information

## Payroll Issues

### Issue: Payroll Processing Fails

**Symptoms:**
- "Process Payroll" button doesn't work
- Error during processing
- Incomplete payroll records

**Possible Causes:**
1. No employees assigned to period
2. Employees missing salary components
3. Statutory rates not configured
4. Invalid period dates
5. Database errors

**Solutions:**
1. **Verify Employees:**
   - Check that employees exist
   - Verify employees are active
   - Ensure employees are assigned to departments (if required)

2. **Check Salary Components:**
   - Go to Employees > [Employee] > Salary
   - Verify salary components are assigned
   - Check effective dates are correct

3. **Verify Statutory Rates:**
   - Go to Admin > Statutory Rates
   - Ensure PAYE, NSSF, NHIF rates are configured
   - Check effective dates match payroll period

4. **Check Period Dates:**
   - Verify start date is before end date
   - Check pay date is after end date
   - Ensure no overlapping periods

5. **Review Error Logs:**
   - Check server logs for detailed errors
   - Look for specific error messages
   - Address underlying issues

### Issue: Zero Tax Amounts in Payroll

**Symptoms:**
- All payroll records show PAYE = 0, NSSF = 0, NHIF = 0
- Tax summary reports show zero totals
- Employees have taxable income but no taxes calculated

**Possible Causes:**
1. Statutory rates not configured
2. Rates are inactive
3. Effective dates don't match payroll period
4. Country mismatch (employee country doesn't match rate country)

**Solutions:**
1. **Check Statutory Rates:**
   - Go to Admin > Statutory Rates
   - Verify PAYE, NSSF, NHIF rates exist
   - Check that rates are active (`isActive = true`)

2. **Verify Effective Dates:**
   - Check rate `effectiveFrom` date
   - Ensure rate is effective for payroll period dates
   - Example: If payroll period is January 2026, rate should have `effectiveFrom <= 2026-01-31`

3. **Check Country Match:**
   - Verify employee country matches rate country
   - Default country is "Kenya"
   - Update employee country if needed

4. **Recalculate Payroll:**
   - After fixing rates, reprocess payroll period
   - Or use tax recalculation feature (if available)

**Prevention:**
- Configure statutory rates before processing first payroll
- Test with one employee first
- Verify tax calculations match expected amounts

### Issue: Incorrect Tax Calculations

**Symptoms:**
- Tax amounts don't match expected calculations
- Different employees with same salary have different taxes
- Taxes seem too high or too low

**Possible Causes:**
1. Wrong statutory rate being used
2. Incorrect rate configuration
3. Taxable income calculation issue
4. Rate effective dates incorrect

**Solutions:**
1. **Review Rate Configuration:**
   - Go to Admin > Statutory Rates
   - Check rate brackets/percentages
   - Verify configuration matches current tax laws

2. **Check Which Rate Is Used:**
   - Review payroll period dates
   - Check which rate is effective for those dates
   - Verify correct rate is being applied

3. **Verify Taxable Income:**
   - Check employee salary components
   - Verify `isTaxable` flags are correct
   - Non-taxable components reduce taxable income

4. **Test Calculation Manually:**
   - Calculate tax manually using rate configuration
   - Compare with system calculation
   - Identify discrepancies

5. **Update Rate if Needed:**
   - If rate is incorrect, update configuration
   - Set new effective date
   - Reprocess affected payrolls

### Issue: Payroll Period Cannot Be Locked

**Symptoms:**
- "Lock Period" button disabled
- Error when trying to lock
- Period remains in "approved" status

**Possible Causes:**
1. Payroll not approved
2. Some payroll records missing
3. Validation errors
4. System restrictions

**Solutions:**
1. **Verify Approval:**
   - Check period status is "approved"
   - Ensure all payrolls are approved
   - Approve period if not already approved

2. **Check Payroll Records:**
   - Verify all employees have payroll records
   - Check for missing or incomplete records
   - Process payroll if records are missing

3. **Review Validation:**
   - Check for validation errors
   - Address any warnings
   - Ensure all required data is present

## Tax Calculation Issues

### Issue: Statutory Rates Not Found

**Symptoms:**
- Warning: "No PAYE/NSSF/NHIF rates found"
- Tax calculations return 0
- Debug logs show rate lookup failures

**Possible Causes:**
1. Rates not created
2. Rates are inactive
3. Country mismatch
4. Effective date issues

**Solutions:**
1. **Create Missing Rates:**
   - Go to Admin > Statutory Rates
   - Create PAYE, NSSF, NHIF rates
   - See [Statutory Rates Guide](./STATUTORY_RATES_GUIDE.md) for configuration

2. **Activate Rates:**
   - Edit rate
   - Set `isActive = true`
   - Save

3. **Check Country:**
   - Verify employee country
   - Ensure rate country matches
   - Default is "Kenya"

4. **Set Effective Dates:**
   - Set `effectiveFrom` date
   - Ensure date is before/on payroll period start
   - Leave `effectiveTo` empty for ongoing rates

### Issue: Wrong Rate Being Used

**Symptoms:**
- Old rate being used instead of new rate
- Tax amounts don't reflect rate changes
- Multiple rates for same period

**Possible Causes:**
1. New rate effective date is in future
2. Old rate still active
3. Rate selection logic issue

**Solutions:**
1. **Check Effective Dates:**
   - Verify new rate `effectiveFrom` date
   - Ensure it's on or before payroll period start
   - Set old rate `effectiveTo` date if needed

2. **Deactivate Old Rate:**
   - Edit old rate
   - Set `isActive = false`
   - Or set `effectiveTo` date

3. **Verify Rate Selection:**
   - System uses most recent rate by `effectiveFrom` date
   - Ensure only one rate is active for period
   - Check for overlapping effective dates

## Salary Component Issues

### Issue: Component Not Appearing in Employee Salary

**Symptoms:**
- Component created but not showing for employee
- Component missing from payroll calculation

**Possible Causes:**
1. Component not assigned to employee
2. Component is inactive
3. Effective date hasn't been reached
4. Effective date has expired

**Solutions:**
1. **Assign Component:**
   - Go to Employees > [Employee] > Salary
   - Click "Add Component"
   - Select component and enter amount
   - Set effective date

2. **Check Component Status:**
   - Go to Salary > Components
   - Verify component `isActive = true`
   - Activate if inactive

3. **Verify Effective Dates:**
   - Check component `effectiveFrom` date
   - Ensure date is on or before current date
   - Check `effectiveTo` date (if set)

4. **Check Date Range:**
   - For payroll, component must be effective during period
   - `effectiveFrom <= periodEnd`
   - `effectiveTo IS NULL OR effectiveTo >= periodStart`

### Issue: Percentage Component Showing 0

**Symptoms:**
- Percentage-based component shows 0 amount
- Component not calculating correctly

**Possible Causes:**
1. Referenced component not assigned to employee
2. Referenced component amount is 0
3. Percentage configuration incorrect
4. Calculation error

**Solutions:**
1. **Assign Referenced Component:**
   - Ensure base component is assigned first
   - Check base component has amount > 0
   - Verify base component is active

2. **Check Percentage Configuration:**
   - Verify `percentageOf` points to correct component
   - Check `percentageValue` is set correctly
   - Example: 10% = 10, not 0.10

3. **Verify Calculation:**
   - Manual calculation: baseAmount × (percentageValue / 100)
   - Compare with system calculation
   - Check for rounding issues

4. **Review Component Order:**
   - Percentage components depend on base components
   - Ensure base component is assigned before percentage component
   - Check effective dates align

### Issue: Wrong Taxable Income Calculation

**Symptoms:**
- Taxable income doesn't match expected
- PAYE calculated on wrong amount
- Non-taxable components included in tax

**Possible Causes:**
1. Component `isTaxable` flag incorrect
2. Non-taxable components marked as taxable
3. Taxable components marked as non-taxable

**Solutions:**
1. **Review Component Tax Flags:**
   - Go to Salary > Components
   - Check `isTaxable` for each component
   - Verify flags match tax treatment

2. **Understand Taxable Income:**
   - Taxable Income = Sum of taxable earnings
   - Non-taxable earnings are excluded
   - Deductions don't affect taxable income (they're subtracted after)

3. **Fix Component Flags:**
   - Edit component
   - Set `isTaxable` correctly
   - Save changes
   - Reprocess payroll if needed

## Employee Management Issues

### Issue: Cannot Create Employee

**Symptoms:**
- Employee creation form fails
- Error messages on submit
- Employee not saved

**Possible Causes:**
1. Required fields missing
2. Invalid data format
3. Duplicate employee number
4. Department doesn't exist
5. Validation errors

**Solutions:**
1. **Check Required Fields:**
   - First Name, Last Name (required)
   - Work Email (if creating user account)
   - Department (if required)
   - Fill in all required fields

2. **Validate Data:**
   - Check email format
   - Verify date formats (YYYY-MM-DD)
   - Check phone number format

3. **Check Employee Number:**
   - Employee numbers must be unique
   - Change employee number if duplicate
   - Or leave empty (system generates)

4. **Verify Department:**
   - Ensure department exists
   - Create department if needed
   - Or leave department empty (if optional)

### Issue: Employee Salary Not Showing

**Symptoms:**
- Employee has no salary components
- Salary page is empty
- Payroll shows 0 gross pay

**Possible Causes:**
1. No salary components assigned
2. Components not effective yet
3. Components expired
4. Components inactive

**Solutions:**
1. **Assign Salary Components:**
   - Go to Employees > [Employee] > Salary
   - Click "Add Component"
   - Select components and set amounts
   - Set effective date

2. **Check Effective Dates:**
   - Verify `effectiveFrom` is on or before current date
   - Check `effectiveTo` (if set) is after current date
   - Update dates if needed

3. **Verify Component Status:**
   - Check components are active
   - Activate if needed
   - Create components if missing

## Expense Management Issues

### Issue: Cannot Submit Expense

**Symptoms:**
- Expense submission fails
- Form validation errors
- Expense not saved

**Possible Causes:**
1. Required fields missing
2. Invalid amount
3. Category doesn't exist
4. Date validation errors

**Solutions:**
1. **Fill Required Fields:**
   - Category (required)
   - Title (required)
   - Amount (required, must be > 0)
   - Expense Date (required)

2. **Check Amount:**
   - Amount must be positive number
   - Check decimal format
   - Verify currency selection

3. **Verify Category:**
   - Ensure category exists
   - Create category if needed
   - Go to Expenses > Categories

### Issue: Expense Not Approving

**Symptoms:**
- Approval button doesn't work
- Expense stuck in "pending"
- Approval workflow not progressing

**Possible Causes:**
1. Insufficient permissions
2. Approval workflow issue
3. Missing approver
4. System error

**Solutions:**
1. **Check Permissions:**
   - Verify you have expense approval permission
   - Check your role has required permissions
   - Contact admin if needed

2. **Review Approval Workflow:**
   - Check if multi-level approval is required
   - Verify previous approvals are complete
   - Check for pending approvals

3. **Check Approver Assignment:**
   - Verify approver exists
   - Check approver is active
   - Assign approver if missing

## System Configuration Issues

### Issue: Settings Not Saving

**Symptoms:**
- System settings changes not persisting
- Settings revert to defaults
- Configuration errors

**Possible Causes:**
1. Insufficient permissions
2. Invalid setting values
3. Validation errors
4. Database errors

**Solutions:**
1. **Check Permissions:**
   - Verify you have settings management permission
   - Check role permissions
   - Request permission if needed

2. **Validate Setting Values:**
   - Check value format matches expected type
   - Verify JSON structure (if JSON setting)
   - Check value ranges (if numeric)

3. **Review Error Messages:**
   - Read validation error messages
   - Address specific errors
   - Correct invalid values

## Best Practices

### Payroll Processing

1. **Before Processing:**
   - Verify statutory rates are configured
   - Check all employees have salary components
   - Ensure period dates are correct
   - Review employee data completeness

2. **During Processing:**
   - Monitor processing progress
   - Check for errors or warnings
   - Review calculated amounts
   - Verify tax calculations

3. **After Processing:**
   - Review payroll summary
   - Check individual payroll records
   - Verify totals match expectations
   - Approve only after thorough review

### Statutory Rates

1. **Configuration:**
   - Set up rates before first payroll
   - Use correct effective dates
   - Test with sample calculations
   - Document rate sources

2. **Maintenance:**
   - Monitor for rate changes
   - Update rates promptly
   - Set effective dates correctly
   - Keep historical rates for audit

### Salary Components

1. **Organization:**
   - Use consistent naming
   - Group by category
   - Set display order
   - Document complex components

2. **Tax Treatment:**
   - Verify tax flags are correct
   - Review with tax advisor
   - Update when tax laws change
   - Document non-taxable components

### Employee Management

1. **Data Quality:**
   - Complete all required fields
   - Keep data updated
   - Verify information accuracy
   - Regular data audits

2. **Salary Assignment:**
   - Assign components promptly
   - Set correct effective dates
   - Review salary history
   - Document salary changes

## Validation Checklist

### Before Processing First Payroll

- [ ] Statutory rates configured (PAYE, NSSF, NHIF)
- [ ] Salary components created
- [ ] Employees added to system
- [ ] Salary components assigned to employees
- [ ] Employee data complete (KRA PIN, NSSF, NHIF numbers)
- [ ] Departments created (if using)
- [ ] Payroll period dates verified
- [ ] Test payroll processed successfully

### Before Each Payroll Processing

- [ ] Statutory rates are active and effective
- [ ] All employees have salary components
- [ ] Employee data is up to date
- [ ] Period dates are correct
- [ ] No overlapping periods
- [ ] Previous period is locked (if applicable)

### After Payroll Processing

- [ ] Review payroll summary
- [ ] Check tax calculations
- [ ] Verify net pay amounts
- [ ] Review individual payroll records
- [ ] Check for warnings or errors
- [ ] Approve payroll
- [ ] Lock period
- [ ] Generate payslips
- [ ] Review tax remittances

### Regular Maintenance

- [ ] Review and update statutory rates
- [ ] Audit salary components
- [ ] Verify employee data accuracy
- [ ] Check system settings
- [ ] Review audit logs
- [ ] Backup data regularly
- [ ] Monitor system performance

## Getting Help

### Self-Service Resources

1. **Documentation:**
   - [Statutory Rates Guide](./STATUTORY_RATES_GUIDE.md)
   - [Salary Components Guide](./SALARY_COMPONENTS_GUIDE.md)
   - [Complete System Guide](./COMPLETE_SYSTEM_GUIDE.md)
   - [Quick Start Guide](./QUICK_START_GUIDE.md)
   - [Configuration Templates](./CONFIGURATION_TEMPLATES.md) - Ready-to-use JSON templates

2. **System Features:**
   - Check audit logs for system activity
   - Review error messages in UI
   - Check browser console for client errors
   - Review server logs for backend errors

### Contacting Support

When contacting support, provide:

1. **Issue Description:**
   - What you were trying to do
   - What happened instead
   - Error messages (if any)

2. **Steps to Reproduce:**
   - Detailed steps to recreate the issue
   - Screenshots if helpful
   - Data involved

3. **System Information:**
   - Browser and version
   - Operating system
   - User role and permissions
   - Tenant/organization name

4. **Error Details:**
   - Full error message
   - When error occurred
   - Any related actions before error

## Prevention Tips

1. **Regular Backups:**
   - Backup data regularly
   - Test backup restoration
   - Keep multiple backup copies

2. **User Training:**
   - Train users on system features
   - Document internal procedures
   - Keep training materials updated

3. **Monitoring:**
   - Monitor system logs regularly
   - Review audit trails
   - Check for unusual activity

4. **Updates:**
   - Keep system updated
   - Review release notes
   - Test updates in staging first

5. **Documentation:**
   - Document custom configurations
   - Keep rate change records
   - Maintain procedure manuals
