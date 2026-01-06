/**
 * Express Application Setup
 */

import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { apiLimiter, authLimiter } from "./middleware/rateLimiter";
import { config } from "./config";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth";
import departmentRoutes from "./routes/departments";
import employeeRoutes from "./routes/employees";
import roleRoutes from "./routes/roles";
import permissionRoutes from "./routes/permissions";
import userRoleRoutes from "./routes/userRoles";
import employeeBankDetailsRoutes from "./routes/employeeBankDetails";
import employeeDocumentRoutes from "./routes/employeeDocuments";
import salaryComponentRoutes from "./routes/salaryComponents";
import employeeSalaryRoutes from "./routes/employeeSalary";
import payrollPeriodRoutes from "./routes/payrollPeriods";
import payrollRoutes from "./routes/payrolls";
import payslipRoutes from "./routes/payslips";
import expenseCategoryRoutes from "./routes/expenseCategories";
import expenseRoutes from "./routes/expenses";
import expenseApprovalRoutes from "./routes/expenseApprovals";
import expenseDocumentRoutes from "./routes/expenseDocuments";
import loanRoutes from "./routes/loans";
import loanRepaymentRoutes from "./routes/loanRepayments";
import reportRoutes from "./routes/reports";
import systemAdminRoutes from "./routes/systemAdmin";
import auditLogRoutes from "./routes/auditLogs";
import notificationRoutes from "./routes/notifications";
import settingsRoutes from "./routes/settings";
import dataChangeHistoryRoutes from "./routes/dataChangeHistory";

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Trust proxy
  app.set("trust proxy", 1);

  // CORS configuration
  const allowedOrigins = [
    config.frontendUrl,
    "http://localhost:5173",
    "http://localhost:3000",
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          if (process.env.NODE_ENV === "development") {
            return callback(null, true);
          }
        }

        const normalizedOrigin = origin?.replace(/\/$/, "").toLowerCase() || "";
        if (allowedOrigins.some((o) => o.toLowerCase() === normalizedOrigin)) {
          callback(null, true);
        } else {
          if (process.env.NODE_ENV === "production") {
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
          } else {
            callback(null, true);
          }
        }
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
      ],
    })
  );

  // Security middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      crossOriginEmbedderPolicy: false,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Logging middleware
  if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
  } else {
    app.use(morgan("combined"));
  }

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Serve static files from uploads directory
  const uploadsDir = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsDir));

  // Apply general rate limiting
  app.use("/api", (req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    apiLimiter(req, res, next);
  });

  // API routes with specific rate limiters
  app.use("/api/auth", (req, res, next) => {
    if (req.method === "OPTIONS") {
      return next();
    }
    authLimiter(req, res, next);
  });

  // Route handlers
  app.use("/api/auth", authRoutes);
  app.use("/api/departments", departmentRoutes);
  app.use("/api/employees", employeeRoutes);
  app.use("/api/roles", roleRoutes);
  app.use("/api/permissions", permissionRoutes);
  app.use("/api/users", userRoleRoutes);
  app.use("/api/employees", employeeBankDetailsRoutes);
  app.use("/api/employees", employeeDocumentRoutes);
  app.use("/api/salary-components", salaryComponentRoutes);
  app.use("/api/employees/:employeeId/salary", employeeSalaryRoutes);
  app.use("/api/payroll-periods", payrollPeriodRoutes);
  app.use("/api/payroll-periods/:periodId/payrolls", payrollRoutes);
  app.use("/api/payslips", payslipRoutes);
  app.use("/api/expense-categories", expenseCategoryRoutes);
  app.use("/api/expenses", expenseRoutes);
  app.use("/api/expenses/:expenseId/approvals", expenseApprovalRoutes);
  app.use("/api/expenses/:expenseId/documents", expenseDocumentRoutes);
  app.use("/api/loans", loanRoutes);
  app.use("/api/loans/:loanId/repayments", loanRepaymentRoutes);
  app.use("/api/reports", reportRoutes);
  app.use("/api/system-admin", systemAdminRoutes);
  app.use("/api/audit-logs", auditLogRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/settings", settingsRoutes);
  app.use("/api/data-change-history", dataChangeHistoryRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}

export default createApp;

