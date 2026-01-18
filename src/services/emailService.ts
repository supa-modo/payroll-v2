/**
 * Email Service
 * Handles email sending with template rendering and delivery tracking
 */

import nodemailer from "nodemailer";
import { Notification } from "../models";
import { renderEmailTemplate, getDefaultTemplateContext } from "./notificationTemplates";
import { getNotificationType } from "./notificationTypes";
import { User } from "../models";
import logger from "../utils/logger";
import { getSMTPConfig } from "./notificationConfigService";

/**
 * Create nodemailer transporter (uses settings service with env var fallback)
 */
async function createTransporter() {
  const smtpConfig = await getSMTPConfig();
  
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: smtpConfig.user && smtpConfig.pass ? {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    } : undefined,
  });
}

/**
 * Send email notification
 */
export async function sendEmail(notification: Notification): Promise<void> {
  try {
    // Get user
    const user = await User.findByPk(notification.userId);
    if (!user || !user.email) {
      throw new Error(`User ${notification.userId} not found or has no email`);
    }

    // Get notification type config
    const typeConfig = getNotificationType(notification.type);
    const templateName = typeConfig?.templateName || "default";

    // Prepare template context
    const baseContext = {
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl || undefined,
      ...(notification.metadata || {}),
    };

    const context = getDefaultTemplateContext(baseContext, {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });

    // Render templates
    const { html, text } = renderEmailTemplate(templateName, context);

    // Get SMTP config
    const smtpConfig = await getSMTPConfig();

    // Create transporter
    const transporter = await createTransporter();

    // Send email
    const mailOptions = {
      from: smtpConfig.from || smtpConfig.user,
      to: user.email,
      subject: notification.title,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent to ${user.email} for notification ${notification.id}:`, {
      messageId: info.messageId,
    });

    // Mark as delivered
    await notification.markAsDelivered();
  } catch (error: any) {
    logger.error(`Error sending email for notification ${notification.id}:`, error);
    
    // Mark as failed
    await notification.markAsFailed(error.message);
    
    throw error;
  }
}

/**
 * Send email with custom template
 */
export async function sendCustomEmail(
  to: string,
  subject: string,
  templateName: string,
  context: { title: string; message: string; [key: string]: any }
): Promise<void> {
  try {
    // Render templates
    const { html, text } = renderEmailTemplate(templateName, context);

    // Get SMTP config
    const smtpConfig = await getSMTPConfig();

    // Create transporter
    const transporter = await createTransporter();

    // Send email
    const mailOptions = {
      from: smtpConfig.from || smtpConfig.user,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info(`Custom email sent to ${to}:`, {
      messageId: info.messageId,
      subject,
    });
  } catch (error: any) {
    logger.error(`Error sending custom email to ${to}:`, error);
    throw error;
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = await createTransporter();
    await transporter.verify();
    logger.info("✅ Email configuration is valid");
    return true;
  } catch (error) {
    logger.error("❌ Email configuration is invalid:", error);
    return false;
  }
}

export default {
  sendEmail,
  sendCustomEmail,
  verifyEmailConfig,
};
