import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * Email Logs table for tracking all sent emails
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  /** Email template ID (if sent from template) */
  templateId: int("templateId"),
  /** Template name for reference */
  templateName: varchar("templateName", { length: 100 }),
  /** Recipient email address */
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  /** Recipient name (if available) */
  recipientName: varchar("recipientName", { length: 255 }),
  /** Email subject */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Email body (HTML) */
  body: text("body").notNull(),
  /** Delivery status */
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending").notNull(),
  /** Error message (if failed) */
  errorMessage: text("errorMessage"),
  /** Related entity type (ticket, invoice, contract, etc.) */
  entityType: varchar("entityType", { length: 50 }),
  /** Related entity ID */
  entityId: int("entityId"),
  /** User who triggered the email (if applicable) */
  triggeredBy: int("triggeredBy"),
  /** Number of retry attempts */
  retryCount: int("retryCount").default(0).notNull(),
  /** Last retry timestamp */
  lastRetryAt: timestamp("lastRetryAt"),
  /** Email sent timestamp */
  sentAt: timestamp("sentAt"),
  /** Created timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Updated timestamp */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;
