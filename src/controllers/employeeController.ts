/**
 * Employee Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Employee, Department, User, Role, UserRole, EmployeeBankDetails, EmployeeDocument } from "../models";
import { Op } from "sequelize";
import { sequelize } from "../config/database";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import bcrypt from "bcryptjs";
import { trackChange } from "../services/dataChangeHistoryService";
import { getRelativeFilePath, deleteFile } from "../middleware/upload";
import fs from "fs";

/**
 * Get all employees for tenant
 */
export async function getEmployees(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);
    const { search, departmentId, status, page = 1, limit = 30 } = req.query;

    const whereClause: any = { tenantId };
    if (departmentId) whereClause.departmentId = departmentId;
    if (status) whereClause.status = status;

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { middleName: { [Op.iLike]: `%${search}%` } },
        { employeeNumber: { [Op.iLike]: `%${search}%` } },
        { workEmail: { [Op.iLike]: `%${search}%` } },
        { personalEmail: { [Op.iLike]: `%${search}%` } },
        { phonePrimary: { [Op.iLike]: `%${search}%` } },
        { nationalId: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: employees } = await Employee.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
          required: false,
        },
      ],
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      employees,
      total: count,
      page: Number(page),
      totalPages: Math.ceil(count / Number(limit)),
    });
  } catch (error: any) {
    logger.error("Get employees error:", error);
    res.status(500).json({ error: "Failed to get employees" });
  }
}

/**
 * Get single employee
 */
export async function getEmployee(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const tenantId = requireTenantId(req);

    const employee = await Employee.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
          required: false,
        },
      ],
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    res.json({ employee });
  } catch (error: any) {
    logger.error("Get employee error:", error);
    res.status(500).json({ error: "Failed to get employee" });
  }
}

/**
 * Create employee
 */
export async function createEmployee(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const transaction = await sequelize.transaction();
  const uploadedFiles: string[] = [];
  let step = 0;

  try {
    if (!req.user) {
      await transaction.rollback();
      res.status(401).json({ 
        error: "Authentication required",
        step: 0,
        message: "User authentication failed"
      });
      return;
    }

    // Parse request body - handle both JSON and multipart/form-data
    let bodyData: any = {};
    if (req.body && typeof req.body === 'object') {
      // If bankDetails is a string (from form-data), parse it
      if (typeof req.body.bankDetails === 'string') {
        try {
          bodyData.bankDetails = JSON.parse(req.body.bankDetails);
        } catch {
          bodyData.bankDetails = [];
        }
      } else {
        bodyData.bankDetails = req.body.bankDetails || [];
      }
      
      // If documents metadata is a string, parse it
      if (typeof req.body.documentsMetadata === 'string') {
        try {
          bodyData.documentsMetadata = JSON.parse(req.body.documentsMetadata);
        } catch {
          bodyData.documentsMetadata = [];
        }
      } else {
        bodyData.documentsMetadata = req.body.documentsMetadata || [];
      }

      // Copy other fields
      Object.keys(req.body).forEach(key => {
        if (key !== 'bankDetails' && key !== 'documentsMetadata') {
          bodyData[key] = req.body[key];
        }
      });
    }

    const {
      employeeNumber,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      photoUrl,
      personalEmail,
      workEmail,
      email, // Backward compatibility - map to workEmail
      phonePrimary,
      phoneSecondary,
      addressLine1,
      addressLine2,
      city,
      county,
      postalCode,
      country,
      nationalId,
      passportNumber,
      kraPin,
      nssfNumber,
      nhifNumber,
      departmentId,
      jobTitle,
      jobGrade,
      employmentType,
      hireDate,
      probationEndDate,
      contractEndDate,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      // User account creation (always required now)
      roleId,
      userPassword,
      bankDetails = [],
      documentsMetadata = [],
    } = bodyData;

    const tenantId = requireTenantId(req);

    // Validation: User account fields are required
    const finalWorkEmail = workEmail || email;
    if (!finalWorkEmail) {
      await transaction.rollback();
      res.status(400).json({
        error: "Work email is required for user account creation",
        step: 4,
        fieldErrors: { workEmail: "Work email is required" },
        message: "User account creation requires a work email address",
        suggestions: ["Provide a work email address"]
      });
      return;
    }

    if (!roleId) {
      await transaction.rollback();
      res.status(400).json({
        error: "Role is required for user account creation",
        step: 4,
        fieldErrors: { roleId: "Role is required" },
        message: "User account creation requires a role to be selected",
        suggestions: ["Select a role for the user account"]
      });
      return;
    }

    if (!userPassword || userPassword.length < 8) {
      await transaction.rollback();
      res.status(400).json({
        error: "Password must be at least 8 characters",
        step: 4,
        fieldErrors: { userPassword: "Password must be at least 8 characters" },
        message: "User account password must be at least 8 characters long",
        suggestions: ["Provide a password with at least 8 characters"]
      });
      return;
    }

    // Step 1: Generate employee number if not provided
    step = 1;
    let finalEmployeeNumber = employeeNumber;
    if (!finalEmployeeNumber) {
      const count = await Employee.count({
        where: { tenantId },
        transaction,
      });
      finalEmployeeNumber = `EMP${String(count + 1).padStart(6, "0")}`;
    }

    // Check for duplicate employee number
    const existing = await Employee.findOne({
      where: { tenantId, employeeNumber: finalEmployeeNumber },
      transaction,
    });
    if (existing) {
      await transaction.rollback();
      res.status(409).json({
        error: "Employee with this employee number already exists",
        step: 1,
        fieldErrors: { employeeNumber: "Employee number already exists" },
        message: "An employee with this employee number already exists",
        suggestions: ["Use a different employee number or leave blank to auto-generate"]
      });
      return;
    }

    // Verify department if provided
    if (departmentId) {
      const department = await Department.findOne({
        where: { id: departmentId, tenantId },
        transaction,
      });
      if (!department) {
        await transaction.rollback();
        res.status(404).json({ 
          error: "Department not found",
          step: 2,
          fieldErrors: { departmentId: "Department not found" },
          message: "The selected department does not exist",
          suggestions: ["Select a valid department"]
        });
        return;
      }
    }

    // Helper function to convert empty strings to null/undefined
    const toNullIfEmpty = (value: any) => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    };

    // Step 2: Create Employee
    step = 2;
    const employee = await Employee.create(
      {
        tenantId,
        employeeNumber: finalEmployeeNumber,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        middleName: toNullIfEmpty(middleName),
        dateOfBirth: toNullIfEmpty(dateOfBirth),
        gender: toNullIfEmpty(gender),
        maritalStatus: toNullIfEmpty(maritalStatus),
        nationality: toNullIfEmpty(nationality),
        photoUrl: toNullIfEmpty(photoUrl),
        personalEmail: toNullIfEmpty(personalEmail),
        workEmail: toNullIfEmpty(finalWorkEmail),
        phonePrimary: toNullIfEmpty(phonePrimary),
        phoneSecondary: toNullIfEmpty(phoneSecondary),
        addressLine1: toNullIfEmpty(addressLine1),
        addressLine2: toNullIfEmpty(addressLine2),
        city: toNullIfEmpty(city),
        county: toNullIfEmpty(county),
        postalCode: toNullIfEmpty(postalCode),
        country: country || "Kenya",
        nationalId: toNullIfEmpty(nationalId),
        passportNumber: toNullIfEmpty(passportNumber),
        kraPin: toNullIfEmpty(kraPin),
        nssfNumber: toNullIfEmpty(nssfNumber),
        nhifNumber: toNullIfEmpty(nhifNumber),
        departmentId: departmentId ? departmentId : null,
        jobTitle: jobTitle.trim(),
        jobGrade: toNullIfEmpty(jobGrade),
        employmentType: employmentType || "permanent",
        hireDate: hireDate || new Date(),
        probationEndDate: toNullIfEmpty(probationEndDate),
        contractEndDate: toNullIfEmpty(contractEndDate),
        emergencyContactName: toNullIfEmpty(emergencyContactName),
        emergencyContactPhone: toNullIfEmpty(emergencyContactPhone),
        emergencyContactRelationship: toNullIfEmpty(emergencyContactRelationship),
        status: "active",
        createdBy: req.user.id,
      },
      { transaction }
    );

    // Step 3: Upload photo if provided
    step = 3;
    if (req.files && (req.files as any).photo) {
      const photoFile = Array.isArray((req.files as any).photo) 
        ? (req.files as any).photo[0] 
        : (req.files as any).photo;
      
      const relativePath = getRelativeFilePath(photoFile.path);
      uploadedFiles.push(relativePath);
      await employee.update({ photoUrl: relativePath }, { transaction });
    } else if (photoUrl) {
      // Use provided photoUrl if no file uploaded
      await employee.update({ photoUrl }, { transaction });
    }

    // Step 4: Create User Account (always)
    step = 4;
    // Check if user with this email already exists
    const existingUser = await User.findOne({
      where: {
        email: finalWorkEmail,
        tenantId,
      },
      transaction,
    });

    if (existingUser) {
      await transaction.rollback();
      // Clean up uploaded files
      uploadedFiles.forEach(file => {
        try {
          deleteFile(file);
        } catch (err) {
          logger.error(`Failed to delete file ${file}:`, err);
        }
      });
      res.status(409).json({
        error: "User account with this email already exists",
        step: 4,
        fieldErrors: { workEmail: "Email already in use" },
        message: "A user account with this email already exists",
        suggestions: ["Use a different email address"]
      });
      return;
    }

    // Verify role exists and is accessible
    const role = await Role.findOne({
      where: {
        id: roleId,
        [Op.or]: [{ tenantId: null }, { tenantId }],
      },
      transaction,
    });

    if (!role) {
      await transaction.rollback();
      // Clean up uploaded files
      uploadedFiles.forEach(file => {
        try {
          deleteFile(file);
        } catch (err) {
          logger.error(`Failed to delete file ${file}:`, err);
        }
      });
      res.status(404).json({ 
        error: "Role not found",
        step: 4,
        fieldErrors: { roleId: "Role not found" },
        message: "The selected role does not exist",
        suggestions: ["Select a valid role"]
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    // Create user account
    const createdUser = await User.create(
      {
        tenantId,
        email: finalWorkEmail,
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role.name.toLowerCase(), // Legacy field
        isActive: true,
        isEmailVerified: false,
        isSystemAdmin: false,
      },
      { transaction }
    );

    // Link employee to user
    await employee.update({ userId: createdUser.id }, { transaction });

    // Assign role to user
    await UserRole.create(
      {
        userId: createdUser.id,
        roleId: role.id,
        departmentId: departmentId || null,
        assignedBy: req.user.id,
      },
      { transaction }
    );

    // Step 5: Create Bank Details (if provided)
    step = 5;
    if (bankDetails && Array.isArray(bankDetails) && bankDetails.length > 0) {
      for (const bankDetail of bankDetails) {
        if (bankDetail.paymentMethod) {
          await EmployeeBankDetails.create({
            employeeId: employee.id,
            paymentMethod: bankDetail.paymentMethod,
            isPrimary: bankDetail.isPrimary === true,
            bankName: toNullIfEmpty(bankDetail.bankName),
            bankBranch: toNullIfEmpty(bankDetail.bankBranch),
            accountNumber: toNullIfEmpty(bankDetail.accountNumber),
            accountName: toNullIfEmpty(bankDetail.accountName),
            swiftCode: toNullIfEmpty(bankDetail.swiftCode),
            mpesaPhone: toNullIfEmpty(bankDetail.mpesaPhone),
            mpesaName: toNullIfEmpty(bankDetail.mpesaName),
            createdBy: req.user.id,
          }, { transaction });
        }
      }
    }

    // Step 6: Upload and Create Documents (if provided)
    step = 6;
    const documentFiles = req.files && (req.files as any).documents 
      ? (Array.isArray((req.files as any).documents) 
          ? (req.files as any).documents 
          : [(req.files as any).documents])
      : [];

    if (documentFiles.length > 0) {
      if (!Array.isArray(documentsMetadata) || documentsMetadata.length !== documentFiles.length) {
        await transaction.rollback();
        // Clean up uploaded files
        uploadedFiles.forEach(file => {
          try {
            deleteFile(file);
          } catch (err) {
            logger.error(`Failed to delete file ${file}:`, err);
          }
        });
        res.status(400).json({
          error: "Document metadata mismatch",
          step: 6,
          message: "Number of document files does not match document metadata",
          suggestions: ["Ensure each document file has corresponding metadata"]
        });
        return;
      }

      for (let i = 0; i < documentFiles.length; i++) {
        const file = documentFiles[i];
        const metadata = documentsMetadata[i];
        
        if (!metadata || !metadata.documentType || !metadata.documentName) {
          await transaction.rollback();
          // Clean up uploaded files
          uploadedFiles.forEach(f => {
            try {
              deleteFile(f);
            } catch (err) {
              logger.error(`Failed to delete file ${f}:`, err);
            }
          });
          res.status(400).json({
            error: "Document metadata incomplete",
            step: 6,
            fieldErrors: { 
              [`documents[${i}].documentType`]: "Document type is required",
              [`documents[${i}].documentName`]: "Document name is required"
            },
            message: "Each document must have a type and name",
            suggestions: ["Provide document type and name for each uploaded file"]
          });
          return;
        }

        const relativePath = getRelativeFilePath(file.path);
        uploadedFiles.push(relativePath);

        await EmployeeDocument.create({
          employeeId: employee.id,
          documentType: metadata.documentType,
          documentName: metadata.documentName,
          filePath: relativePath,
          fileSize: file.size,
          mimeType: file.mimetype,
          expiryDate: toNullIfEmpty(metadata.expiryDate),
          isVerified: false,
          createdBy: req.user.id,
        }, { transaction });
      }
    }

    // Commit transaction
    await transaction.commit();

    // Fetch created employee with relations
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
          required: false,
        },
      ],
    });

    res.status(201).json({
      employee: createdEmployee,
      user: createdUser.toJSON(),
    });
  } catch (error: any) {
    await transaction.rollback();
    
    // Clean up uploaded files
    uploadedFiles.forEach(file => {
      try {
        deleteFile(file);
      } catch (err) {
        logger.error(`Failed to delete file ${file}:`, err);
      }
    });

    logger.error("Create employee error:", error);
    
    // Extract field errors from Sequelize validation errors
    const fieldErrors: Record<string, string> = {};
    if (error.errors && Array.isArray(error.errors)) {
      error.errors.forEach((err: any) => {
        if (err.path) {
          fieldErrors[err.path] = err.message || "Validation error";
        }
      });
    }

    // Determine error status and message
    let statusCode = 500;
    let errorMessage = "Failed to create employee";
    
    if (error.name === "SequelizeUniqueConstraintError") {
      statusCode = 409;
      errorMessage = "Employee with this employee number already exists";
      fieldErrors.employeeNumber = "Employee number already exists";
    } else if (error.name === "SequelizeValidationError") {
      statusCode = 400;
      errorMessage = "Validation failed";
    } else if (error.name === "SequelizeForeignKeyConstraintError") {
      statusCode = 400;
      errorMessage = "Invalid reference to related entity";
    }

    res.status(statusCode).json({
      error: errorMessage,
      step: step,
      fieldErrors: Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
      message: error.message || errorMessage,
      suggestions: [
        "Check all required fields are filled",
        "Verify email format is correct",
        "Ensure employee number is unique",
        "Check that all references (department, role) are valid"
      ]
    });
  }
}

/**
 * Update employee
 */
export async function updateEmployee(
  req: AuthRequest,
  res: Response
): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      await transaction.rollback();
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const {
      employeeNumber,
      firstName,
      lastName,
      middleName,
      dateOfBirth,
      gender,
      maritalStatus,
      nationality,
      photoUrl,
      personalEmail,
      workEmail,
      email, // Backward compatibility - map to workEmail
      phonePrimary,
      phoneSecondary,
      addressLine1,
      addressLine2,
      city,
      county,
      postalCode,
      country,
      nationalId,
      passportNumber,
      kraPin,
      nssfNumber,
      nhifNumber,
      departmentId,
      jobTitle,
      jobGrade,
      employmentType,
      hireDate,
      probationEndDate,
      contractEndDate,
      terminationDate,
      terminationReason,
      status,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
    } = req.body;
    const tenantId = requireTenantId(req);

    const employee = await Employee.findOne({
      where: { id, tenantId },
      transaction,
    });

    if (!employee) {
      await transaction.rollback();
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    // Check for duplicate employee number if being changed
    if (employeeNumber && employeeNumber !== employee.employeeNumber) {
      const existing = await Employee.findOne({
        where: {
          tenantId,
          employeeNumber,
          id: { [Op.ne]: id },
        },
        transaction,
      });
      if (existing) {
        await transaction.rollback();
        res.status(409).json({
          error: "Employee with this employee number already exists",
        });
        return;
      }
    }

    // Verify department if provided
    if (departmentId) {
      const department = await Department.findOne({
        where: { id: departmentId, tenantId },
        transaction,
      });
      if (!department) {
        await transaction.rollback();
        res.status(404).json({ error: "Department not found" });
        return;
      }
    }

    // Map email to workEmail for backward compatibility
    const finalWorkEmail = workEmail || email;

    // Helper function to convert empty strings to null/undefined
    const toNullIfEmpty = (value: any) => {
      if (value === "" || value === null || value === undefined) return null;
      return value;
    };

    // Build sanitized update data
    const sanitizedData: any = {
      updatedBy: req.user.id,
    };

    // Only include fields that are provided (not undefined)
    if (employeeNumber !== undefined) sanitizedData.employeeNumber = employeeNumber;
    if (firstName !== undefined) sanitizedData.firstName = firstName.trim();
    if (lastName !== undefined) sanitizedData.lastName = lastName.trim();
    if (middleName !== undefined) sanitizedData.middleName = toNullIfEmpty(middleName);
    if (dateOfBirth !== undefined) sanitizedData.dateOfBirth = toNullIfEmpty(dateOfBirth);
    if (gender !== undefined) sanitizedData.gender = toNullIfEmpty(gender);
    if (maritalStatus !== undefined) sanitizedData.maritalStatus = toNullIfEmpty(maritalStatus);
    if (nationality !== undefined) sanitizedData.nationality = toNullIfEmpty(nationality);
    if (photoUrl !== undefined) sanitizedData.photoUrl = toNullIfEmpty(photoUrl);
    if (personalEmail !== undefined) sanitizedData.personalEmail = toNullIfEmpty(personalEmail);
    if (workEmail !== undefined || email !== undefined) sanitizedData.workEmail = toNullIfEmpty(finalWorkEmail);
    if (phonePrimary !== undefined) sanitizedData.phonePrimary = toNullIfEmpty(phonePrimary);
    if (phoneSecondary !== undefined) sanitizedData.phoneSecondary = toNullIfEmpty(phoneSecondary);
    if (addressLine1 !== undefined) sanitizedData.addressLine1 = toNullIfEmpty(addressLine1);
    if (addressLine2 !== undefined) sanitizedData.addressLine2 = toNullIfEmpty(addressLine2);
    if (city !== undefined) sanitizedData.city = toNullIfEmpty(city);
    if (county !== undefined) sanitizedData.county = toNullIfEmpty(county);
    if (postalCode !== undefined) sanitizedData.postalCode = toNullIfEmpty(postalCode);
    if (country !== undefined) sanitizedData.country = country || "Kenya";
    if (nationalId !== undefined) sanitizedData.nationalId = toNullIfEmpty(nationalId);
    if (passportNumber !== undefined) sanitizedData.passportNumber = toNullIfEmpty(passportNumber);
    if (kraPin !== undefined) sanitizedData.kraPin = toNullIfEmpty(kraPin);
    if (nssfNumber !== undefined) sanitizedData.nssfNumber = toNullIfEmpty(nssfNumber);
    if (nhifNumber !== undefined) sanitizedData.nhifNumber = toNullIfEmpty(nhifNumber);
    if (departmentId !== undefined) sanitizedData.departmentId = departmentId ? departmentId : null;
    if (jobTitle !== undefined) sanitizedData.jobTitle = jobTitle.trim();
    if (jobGrade !== undefined) sanitizedData.jobGrade = toNullIfEmpty(jobGrade);
    if (employmentType !== undefined) sanitizedData.employmentType = employmentType;
    if (hireDate !== undefined) sanitizedData.hireDate = hireDate;
    if (probationEndDate !== undefined) sanitizedData.probationEndDate = toNullIfEmpty(probationEndDate);
    if (contractEndDate !== undefined) sanitizedData.contractEndDate = toNullIfEmpty(contractEndDate);
    if (terminationDate !== undefined) sanitizedData.terminationDate = toNullIfEmpty(terminationDate);
    if (terminationReason !== undefined) sanitizedData.terminationReason = toNullIfEmpty(terminationReason);
    if (status !== undefined) sanitizedData.status = status;
    if (emergencyContactName !== undefined) sanitizedData.emergencyContactName = toNullIfEmpty(emergencyContactName);
    if (emergencyContactPhone !== undefined) sanitizedData.emergencyContactPhone = toNullIfEmpty(emergencyContactPhone);
    if (emergencyContactRelationship !== undefined) sanitizedData.emergencyContactRelationship = toNullIfEmpty(emergencyContactRelationship);

    // Track changes for sensitive fields within transaction
    const fieldsToTrack = [
      "status",
      "jobTitle",
      "jobGrade",
      "employmentType",
      "hireDate",
      "terminationDate",
      "departmentId",
    ];

    for (const field of fieldsToTrack) {
      if (sanitizedData[field] !== undefined && employee.get(field) !== sanitizedData[field]) {
        await trackChange(
          {
            tenantId,
            entityType: "Employee",
            entityId: employee.id,
            fieldName: field,
            oldValue: employee.get(field),
            newValue: sanitizedData[field],
            changedBy: req.user.id,
          },
          transaction
        );
      }
    }

    // Update employee within transaction
    await employee.update(sanitizedData, { transaction });

    await transaction.commit();

    // Reload employee with relations after commit
    const updatedEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
          required: false,
        },
      ],
    });

    res.json({ employee: updatedEmployee });
  } catch (error: any) {
    await transaction.rollback();
    logger.error("Update employee error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({
        error: "Employee with this employee number already exists",
      });
      return;
    }
    res.status(500).json({ error: "Failed to update employee" });
  }
}

/**
 * Upload employee photo
 */
export async function uploadEmployeePhoto(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }
    const tenantId = requireTenantId(req);

    const { id } = req.params;

    if (!req.file) {
      res.status(400).json({ error: "Photo file is required" });
      return;
    }

    // Verify employee belongs to tenant
    const employee = await Employee.findOne({
      where: {
        id,
        tenantId,
      },
    });

    if (!employee) {
      // Delete uploaded file if employee not found
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    // Get relative path for storage
    const relativePath = getRelativeFilePath(req.file.path);

    // Delete old photo if it exists
    if (employee.photoUrl) {
      try {
        deleteFile(employee.photoUrl);
      } catch (error) {
        // Log but don't fail if old photo deletion fails
        logger.warn("Failed to delete old employee photo:", error);
      }
    }

    // Update employee with new photo URL
    await employee.update({
      photoUrl: relativePath,
      updatedBy: req.user.id,
    });

    // Reload to get updated data
    await employee.reload();

    res.json({
      message: "Photo uploaded successfully",
      employee,
      photoUrl: relativePath,
    });
  } catch (error: any) {
    // Clean up uploaded file on error
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    logger.error("Upload employee photo error:", error);
    res.status(500).json({ error: "Failed to upload employee photo" });
  }
}

/**
 * Delete employee (soft delete)
 */
export async function deleteEmployee(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { id } = req.params;
    const tenantId = requireTenantId(req);

    const employee = await Employee.findOne({
      where: { id, tenantId },
    });

    if (!employee) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    await employee.destroy();

    res.json({ message: "Employee deleted successfully" });
  } catch (error: any) {
    logger.error("Delete employee error:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
}

