import { getDb } from "../db";
import { emailTemplates } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Email Template Service
 * Handles fetching and rendering email templates with dynamic data
 */

export interface TemplateData {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Fetch an email template by name
 */
export async function getTemplateByName(templateName: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.name, templateName))
    .limit(1);

  if (!template) {
    throw new Error(`Email template "${templateName}" not found`);
  }

  if (!template.isActive) {
    throw new Error(`Email template "${templateName}" is not active`);
  }

  return template;
}

/**
 * Render template by replacing placeholders with actual data
 * Placeholders format: {{variableName}}
 */
export function renderTemplate(templateContent: string, data: TemplateData): string {
  let rendered = templateContent;

  // Replace all placeholders
  Object.keys(data).forEach((key) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    const value = data[key] !== undefined && data[key] !== null ? String(data[key]) : '';
    rendered = rendered.replace(placeholder, value);
  });

  return rendered;
}

/**
 * Get rendered email template ready to send
 */
export async function getRenderedEmail(templateName: string, data: TemplateData) {
  const template = await getTemplateByName(templateName);

  const subject = renderTemplate(template.subject, data);
  const body = renderTemplate(template.body, data);

  return {
    subject,
    body,
    templateId: template.id,
    templateName: template.name,
  };
}

/**
 * Helper function to prepare ticket URL
 */
export function getTicketUrl(ticketId: number): string {
  const baseUrl = process.env.VITE_APP_URL || 'https://gross-ict.manus.space';
  return `${baseUrl}/support-center?ticket=${ticketId}`;
}

/**
 * Helper function to format date for emails
 */
export function formatEmailDate(date: Date): string {
  return new Intl.DateTimeFormat('de-CH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Helper function to format priority for display
 */
export function formatPriority(priority: string): string {
  const priorityMap: Record<string, string> = {
    low: 'Niedrig',
    medium: 'Mittel',
    high: 'Hoch',
    urgent: 'Dringend',
  };
  return priorityMap[priority] || priority;
}

/**
 * Helper function to format status for display
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    resolved: 'Gelöst',
    closed: 'Geschlossen',
  };
  return statusMap[status] || status;
}
