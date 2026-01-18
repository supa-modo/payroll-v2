/**
 * Notification Template Service
 * Handles rendering of notification templates using Handlebars
 */

import Handlebars from "handlebars";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import logger from "../utils/logger";

const TEMPLATES_DIR = join(process.cwd(), "src", "templates");

/**
 * Template context interface
 */
export interface TemplateContext {
  title: string;
  message: string;
  actionUrl?: string;
  firstName?: string;
  lastName?: string;
  userName?: string;
  [key: string]: any;
}

/**
 * Load template from file system
 */
function loadTemplate(templatePath: string): string | null {
  try {
    if (existsSync(templatePath)) {
      return readFileSync(templatePath, "utf-8");
    }
    return null;
  } catch (error) {
    logger.error(`Error loading template from ${templatePath}:`, error);
    return null;
  }
}

/**
 * Register Handlebars helpers
 */
function registerHelpers(): void {
  // Format date helper
  Handlebars.registerHelper("formatDate", (date: Date | string, format?: string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    if (!d || isNaN(d.getTime())) return "";
    
    if (format === "short") {
      return d.toLocaleDateString();
    }
    return d.toLocaleString();
  });

  // Format currency helper
  Handlebars.registerHelper("formatCurrency", (amount: number, currency: string = "KES") => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency,
    }).format(amount);
  });

  // Conditional helper
  Handlebars.registerHelper("ifEquals", function (this: any, arg1: any, arg2: any, options: any) {
    return arg1 === arg2 ? options.fn(this) : options.inverse(this);
  });

  // Truncate helper
  Handlebars.registerHelper("truncate", (str: string, len: number) => {
    if (!str || str.length <= len) return str;
    return str.substring(0, len) + "...";
  });
}

// Register helpers on module load
registerHelpers();

/**
 * Render email template
 */
export function renderEmailTemplate(
  templateName: string,
  context: TemplateContext
): { html: string; text: string } {
  const htmlTemplatePath = join(TEMPLATES_DIR, "email", `${templateName}.html.hbs`);
  const textTemplatePath = join(TEMPLATES_DIR, "email", `${templateName}.text.hbs`);

  let html = "";
  let text = "";

  // Try to load HTML template
  const htmlTemplate = loadTemplate(htmlTemplatePath);
  if (htmlTemplate) {
    const compiled = Handlebars.compile(htmlTemplate);
    html = compiled(context);
  } else {
    // Fallback to simple HTML
    html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${context.title}</title>
        </head>
        <body>
          <h1>${context.title}</h1>
          <p>${context.message}</p>
          ${context.actionUrl ? `<a href="${context.actionUrl}">View Details</a>` : ""}
        </body>
      </html>
    `;
  }

  // Try to load text template
  const textTemplate = loadTemplate(textTemplatePath);
  if (textTemplate) {
    const compiled = Handlebars.compile(textTemplate);
    text = compiled(context);
  } else {
    // Fallback to simple text
    text = `${context.title}\n\n${context.message}\n\n${
      context.actionUrl ? `View Details: ${context.actionUrl}` : ""
    }`;
  }

  return { html, text };
}

/**
 * Render in-app notification template
 */
export function renderInAppTemplate(
  templateName: string,
  context: TemplateContext
): { title: string; message: string } {
  const templatePath = join(TEMPLATES_DIR, "inapp", `${templateName}.hbs`);

  const template = loadTemplate(templatePath);
  if (template) {
    const compiled = Handlebars.compile(template);
    const rendered = compiled(context);
    
    // Parse JSON if template returns JSON
    try {
      const parsed = JSON.parse(rendered);
      return {
        title: parsed.title || context.title,
        message: parsed.message || context.message,
      };
    } catch {
      // If not JSON, assume it's just the message
      return {
        title: context.title,
        message: rendered,
      };
    }
  }

  // Fallback to context values
  return {
    title: context.title,
    message: context.message,
  };
}

/**
 * Get default template context
 */
export function getDefaultTemplateContext(
  baseContext: TemplateContext,
  user?: { firstName?: string; lastName?: string; email?: string }
): TemplateContext {
  return {
    ...baseContext,
    firstName: user?.firstName || "User",
    lastName: user?.lastName || "",
    userName: user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email || "User",
  };
}
