/**
 * Notification Type Registry
 * Defines all notification types and their metadata
 */

import { NotificationPriority, NotificationChannel } from "../models/Notification";

export interface NotificationTypeConfig {
  type: string;
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];
  requiresEmail: boolean;
  requiresPush: boolean;
  requiresSMS: boolean;
  templateName?: string;
  description: string;
}

/**
 * Notification Type Definitions
 */
export const NOTIFICATION_TYPES: Record<string, NotificationTypeConfig> = {
  // Payslip notifications
  PAYSLIP_READY: {
    type: "payslip_ready",
    defaultPriority: "normal",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "payslip_ready",
    description: "Payslip is ready for download",
  },

  // Expense notifications
  EXPENSE_SUBMITTED: {
    type: "expense_submitted",
    defaultPriority: "normal",
    defaultChannels: ["in_app"],
    requiresEmail: false,
    requiresPush: false,
    requiresSMS: false,
    templateName: "expense_submitted",
    description: "Expense has been submitted",
  },

  EXPENSE_APPROVED: {
    type: "expense_approved",
    defaultPriority: "normal",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "expense_approved",
    description: "Expense has been approved",
  },

  EXPENSE_REJECTED: {
    type: "expense_rejected",
    defaultPriority: "high",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "expense_rejected",
    description: "Expense has been rejected",
  },

  EXPENSE_APPROVAL_REQUIRED: {
    type: "expense_approval_required",
    defaultPriority: "high",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: true,
    requiresSMS: false,
    templateName: "expense_approval_required",
    description: "Expense requires approval",
  },

  // Payroll notifications
  PAYROLL_PROCESSED: {
    type: "payroll_processed",
    defaultPriority: "normal",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "payroll_processed",
    description: "Payroll has been processed",
  },

  PAYROLL_PERIOD_CREATED: {
    type: "payroll_period_created",
    defaultPriority: "normal",
    defaultChannels: ["in_app"],
    requiresEmail: false,
    requiresPush: false,
    requiresSMS: false,
    templateName: "payroll_period_created",
    description: "New payroll period created",
  },

  // System notifications
  SYSTEM_ANNOUNCEMENT: {
    type: "system_announcement",
    defaultPriority: "normal",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "system_announcement",
    description: "System announcement",
  },

  PASSWORD_RESET: {
    type: "password_reset",
    defaultPriority: "urgent",
    defaultChannels: ["email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "password_reset",
    description: "Password reset request",
  },

  ACCOUNT_ACTIVATED: {
    type: "account_activated",
    defaultPriority: "normal",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "account_activated",
    description: "Account has been activated",
  },

  // Loan notifications
  LOAN_APPROVED: {
    type: "loan_approved",
    defaultPriority: "normal",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "loan_approved",
    description: "Loan has been approved",
  },

  LOAN_REJECTED: {
    type: "loan_rejected",
    defaultPriority: "high",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: false,
    requiresSMS: false,
    templateName: "loan_rejected",
    description: "Loan has been rejected",
  },

  LOAN_REPAYMENT_DUE: {
    type: "loan_repayment_due",
    defaultPriority: "high",
    defaultChannels: ["in_app", "email"],
    requiresEmail: true,
    requiresPush: true,
    requiresSMS: false,
    templateName: "loan_repayment_due",
    description: "Loan repayment is due",
  },
};

/**
 * Get notification type configuration
 */
export function getNotificationType(type: string): NotificationTypeConfig | null {
  return NOTIFICATION_TYPES[type.toUpperCase()] || null;
}

/**
 * Validate notification type
 */
export function isValidNotificationType(type: string): boolean {
  return type.toUpperCase() in NOTIFICATION_TYPES;
}

/**
 * Get all notification types
 */
export function getAllNotificationTypes(): NotificationTypeConfig[] {
  return Object.values(NOTIFICATION_TYPES);
}

/**
 * Get notification types by category
 */
export function getNotificationTypesByCategory(category: string): NotificationTypeConfig[] {
  return Object.values(NOTIFICATION_TYPES).filter(
    (config) => config.type.startsWith(category.toLowerCase())
  );
}
