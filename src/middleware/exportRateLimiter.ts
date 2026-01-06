/**
 * Rate Limiter for Export Endpoints
 * More restrictive than general API limiter due to resource-intensive nature
 */

import rateLimit from "express-rate-limit";

export const exportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 export requests per windowMs (increased from 10)
  message: "Too many export requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

