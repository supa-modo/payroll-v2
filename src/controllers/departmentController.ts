/**
 * Department Controller
 */

import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { Department, Employee } from "../models";
import { Op, Sequelize } from "sequelize";
import logger from "../utils/logger";
import { requireTenantId } from "../utils/tenant";

/**
 * Get all departments for tenant
 */
export async function getDepartments(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);
    const { search } = req.query;

    // Build where clause for search
    let whereClause: any = { tenantId };
    
    // If search is provided, search by department name, code, or manager name
    if (search && typeof search === "string") {
      const searchPattern = `%${search}%`;
      
      // First, find departments matching name or code
      const departmentsByNameOrCode = await Department.findAll({
        where: {
          tenantId,
          [Op.or]: [
            { name: { [Op.iLike]: searchPattern } },
            { code: { [Op.iLike]: searchPattern } },
          ],
        },
        attributes: ["id"],
        raw: true,
      });
      
      const departmentIdsByNameOrCode = departmentsByNameOrCode.map((d: any) => d.id);
      
      // Find managers matching the search term
      const managers = await Employee.findAll({
        where: {
          tenantId,
          [Op.or]: [
            { firstName: { [Op.iLike]: searchPattern } },
            { lastName: { [Op.iLike]: searchPattern } },
          ],
        },
        attributes: ["id"],
        raw: true,
      });
      
      const managerIds = managers.map((m: any) => m.id);
      
      // Find departments with matching managers
      const departmentsByManager = await Department.findAll({
        where: {
          tenantId,
          managerId: { [Op.in]: managerIds },
        },
        attributes: ["id"],
        raw: true,
      });
      
      const departmentIdsByManager = departmentsByManager.map((d: any) => d.id);
      
      // Combine all matching department IDs
      const allMatchingIds = [...new Set([...departmentIdsByNameOrCode, ...departmentIdsByManager])];
      
      if (allMatchingIds.length > 0) {
        whereClause.id = { [Op.in]: allMatchingIds };
      } else {
        // No matches found, return empty result
        whereClause.id = { [Op.in]: [] };
      }
    }

    // Optimize: Get departments with manager and parent, but get employee count separately
    const departments = await Department.findAll({
      where: whereClause,
      include: [
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "jobTitle", "photoUrl"],
          required: false,
        },
        {
          model: Department,
          as: "parentDepartment",
          attributes: ["id", "name", "code"],
          required: false,
        },
      ],
      order: [["name", "ASC"]],
    });

    // Get employee counts for each department in a single optimized query
    const departmentIds = departments.map((d) => d.id);
    if (departmentIds.length > 0) {
      const employeeCounts = await Employee.findAll({
        where: {
          departmentId: { [Op.in]: departmentIds },
          tenantId,
        },
        attributes: [
          "departmentId",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        group: ["departmentId"],
        raw: true,
      });

      // Attach employee counts to departments
      const countMap = new Map(
        employeeCounts.map((ec: any) => [ec.departmentId, parseInt(ec.count, 10)])
      );
      departments.forEach((dept) => {
        (dept as any).employeeCount = countMap.get(dept.id) || 0;
      });
    } else {
      // Set count to 0 for all departments if no IDs
      departments.forEach((dept) => {
        (dept as any).employeeCount = 0;
      });
    }

    res.json({ departments });
  } catch (error: any) {
    logger.error("Get departments error:", error);
    res.status(500).json({ error: "Failed to get departments" });
  }
}

/**
 * Get single department
 */
export async function getDepartment(
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

    const department = await Department.findOne({
      where: { id, tenantId },
      include: [
        {
          model: Employee,
          as: "employees",
          attributes: ["id", "firstName", "lastName", "jobTitle"],
          required: false,
        },
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "jobTitle", "photoUrl"],
          required: false,
        },
        {
          model: Department,
          as: "parentDepartment",
          attributes: ["id", "name", "code"],
          required: false,
        },
      ],
    });

    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    res.json({ department });
  } catch (error: any) {
    logger.error("Get department error:", error);
    res.status(500).json({ error: "Failed to get department" });
  }
}

/**
 * Create department
 */
export async function createDepartment(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const tenantId = requireTenantId(req);

    const { name, code, description, managerId, parentDepartmentId, isActive } = req.body;

    // Check for duplicate name within tenant
    const existingName = await Department.findOne({
      where: { tenantId, name },
    });
    if (existingName) {
      res.status(409).json({ error: "Department with this name already exists" });
      return;
    }

    // Check for duplicate code within tenant if provided
    if (code) {
      const existingCode = await Department.findOne({
        where: { tenantId, code },
      });
      if (existingCode) {
        res.status(409).json({ error: "Department with this code already exists" });
        return;
      }
    }

    // Verify manager if provided
    if (managerId) {
      const manager = await Employee.findOne({
        where: { id: managerId, tenantId },
      });
      if (!manager) {
        res.status(404).json({ error: "Manager (Employee) not found" });
        return;
      }
    }

    // Verify parent department if provided
    if (parentDepartmentId) {
      const parent = await Department.findOne({
        where: { id: parentDepartmentId, tenantId },
      });
      if (!parent) {
        res.status(404).json({ error: "Parent department not found" });
        return;
      }
    }

    const department = await Department.create({
      tenantId,
      name,
      code: code || null,
      description,
      managerId: managerId || null,
      parentDepartmentId: parentDepartmentId || null,
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id,
    });

    const createdDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "jobTitle", "photoUrl"],
          required: false,
        },
        {
          model: Department,
          as: "parentDepartment",
          attributes: ["id", "name", "code"],
          required: false,
        },
        {
          model: Employee,
          as: "employees",
          attributes: ["id"],
          required: false,
        },
      ],
    });

    res.status(201).json({ department: createdDepartment });
  } catch (error: any) {
    logger.error("Create department error:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({ error: "Department with this name already exists" });
      return;
    }
    res.status(500).json({ error: "Failed to create department" });
  }
}

/**
 * Update department
 */
export async function updateDepartment(
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
    const { name, code, description, managerId, parentDepartmentId, isActive } = req.body;

    const department = await Department.findOne({
      where: { id, tenantId },
    });

    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    // Check for duplicate name if name is being changed
    if (name && name !== department.name) {
      const existingName = await Department.findOne({
        where: {
          tenantId,
          name,
          id: { [Op.ne]: id },
        },
      });
      if (existingName) {
        res.status(409).json({ error: "Department with this name already exists" });
        return;
      }
    }

    // Check for duplicate code if code is being changed
    if (code && code !== department.code) {
      const existingCode = await Department.findOne({
        where: {
          tenantId,
          code,
          id: { [Op.ne]: id },
        },
      });
      if (existingCode) {
        res.status(409).json({ error: "Department with this code already exists" });
        return;
      }
    }

    // Prevent circular parent dependency
    if (parentDepartmentId === id) {
      res.status(400).json({ error: "Cannot set department as its own parent" });
      return;
    }

    // Verify manager if provided
    if (managerId) {
      const manager = await Employee.findOne({
        where: { id: managerId, tenantId },
      });
      if (!manager) {
        res.status(404).json({ error: "Manager (Employee) not found" });
        return;
      }
    }

    // Verify parent department if provided
    if (parentDepartmentId) {
      const parent = await Department.findOne({
        where: { id: parentDepartmentId, tenantId },
      });
      if (!parent) {
        res.status(404).json({ error: "Parent department not found" });
        return;
      }
    }

    await department.update({
      name: name || department.name,
      code: code !== undefined ? (code || null) : department.code,
      description: description !== undefined ? description : department.description,
      managerId: managerId !== undefined ? (managerId || null) : department.managerId,
      parentDepartmentId:
        parentDepartmentId !== undefined
          ? parentDepartmentId || null
          : department.parentDepartmentId,
      isActive: isActive !== undefined ? isActive : department.isActive,
      updatedBy: req.user.id,
    });

    const updatedDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: Employee,
          as: "manager",
          attributes: ["id", "firstName", "lastName", "employeeNumber", "jobTitle", "photoUrl"],
          required: false,
        },
        {
          model: Department,
          as: "parentDepartment",
          attributes: ["id", "name", "code"],
          required: false,
        },
        {
          model: Employee,
          as: "employees",
          attributes: ["id"],
          required: false,
        },
      ],
    });

    res.json({ department: updatedDepartment });
  } catch (error: any) {
    logger.error("Update department error:", error);
    res.status(500).json({ error: "Failed to update department" });
  }
}

/**
 * Delete department
 */
export async function deleteDepartment(
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

    const department = await Department.findOne({
      where: { id, tenantId },
      include: [
        { model: Employee, as: "employees" },
        { model: Department, as: "subDepartments" },
      ],
    });

    if (!department) {
      res.status(404).json({ error: "Department not found" });
      return;
    }

    // Check if department has employees
    const employeeCount = await Employee.count({
      where: { departmentId: id, tenantId },
    });
    if (employeeCount > 0) {
      res.status(400).json({
        error: `Cannot delete department because it has ${employeeCount} employees assigned. Reassign them first.`,
      });
      return;
    }

    // Check if department has sub-departments
    const subDeptCount = await Department.count({
      where: { parentDepartmentId: id, tenantId },
    });
    if (subDeptCount > 0) {
      res.status(400).json({
        error: `Cannot delete department because it has ${subDeptCount} sub-departments. Move or delete them first.`,
      });
      return;
    }

    await department.destroy();

    res.json({ message: "Department deleted successfully" });
  } catch (error: any) {
    logger.error("Delete department error:", error);
    res.status(500).json({ error: "Failed to delete department" });
  }
}

