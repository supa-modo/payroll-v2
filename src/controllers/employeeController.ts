/**
 * Employee Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Employee, Department, User, Role, UserRole } from "../models";
import { Op } from "sequelize";
import { sequelize } from "../config/database";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";
import bcrypt from "bcryptjs";
import { trackChange } from "../services/dataChangeHistoryService";

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
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
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
      // New fields for user account creation
      createUserAccount,
      roleId,
      userPassword,
    } = req.body;

    const tenantId = requireTenantId(req);

    // Generate employee number if not provided
    let finalEmployeeNumber = employeeNumber;
    if (!finalEmployeeNumber) {
      // Generate based on tenant and count
      const count = await Employee.count({
        where: { tenantId },
      });
      finalEmployeeNumber = `EMP${String(count + 1).padStart(6, "0")}`;
    }

    // Check for duplicate employee number within tenant
    const existing = await Employee.findOne({
      where: { tenantId, employeeNumber: finalEmployeeNumber },
    });
    if (existing) {
      res.status(409).json({
        error: "Employee with this employee number already exists",
      });
      return;
    }

    // Verify department if provided
    if (departmentId) {
      const department = await Department.findOne({
        where: { id: departmentId, tenantId },
      });
      if (!department) {
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

    const transaction = await sequelize.transaction();

    try {
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

      // Create user account if requested
      let createdUser = null;
      if (createUserAccount && finalWorkEmail && userPassword && roleId) {
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
          res.status(409).json({
            error: "User account with this email already exists",
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
          res.status(404).json({ error: "Role not found" });
          return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(userPassword, 10);

        // Create user account
        createdUser = await User.create(
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
      }

      await transaction.commit();

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
        user: createdUser ? createdUser.toJSON() : null,
      });
    } catch (error: any) {
      await transaction.rollback();
      throw error;
    }
  } catch (error: any) {
    logger.error("Create employee error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({
        error: "Employee with this employee number already exists",
      });
      return;
    }
    res.status(500).json({ error: "Failed to create employee" });
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

