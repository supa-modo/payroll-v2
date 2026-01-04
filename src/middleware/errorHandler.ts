/**
 * Error Handler Middleware
 */

import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error("Error:", err);

  // Default error
  let status = 500;
  let message = "Internal server error";

  // Handle specific error types
  if (err.name === "ValidationError") {
    status = 400;
    message = err.message;
  } else if (err.name === "UnauthorizedError") {
    status = 401;
    message = "Unauthorized";
  } else if (err.message) {
    message = err.message;
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

export function notFoundHandler(
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  res.status(404).json({ error: "Route not found" });
}

