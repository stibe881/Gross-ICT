import { mysqlTable, int, varchar, boolean, timestamp, text } from "drizzle-orm/mysql-core";

/**
 * SMTP Settings table for email configuration
 * Stores SMTP server configuration for sending emails
 */
export const smtpSettings = mysqlTable("smtp_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** SMTP server host (e.g., smtp.gmail.com) */
  host: varchar("host", { length: 255 }).notNull(),
  /** SMTP server port (e.g., 587 for TLS, 465 for SSL) */
  port: int("port").notNull().default(587),
  /** Use SSL/TLS encryption */
  secure: boolean("secure").notNull().default(false),
  /** SMTP username/email */
  user: varchar("user", { length: 320 }).notNull(),
  /** SMTP password (encrypted) */
  password: text("password").notNull(),
  /** From email address */
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  /** From name */
  fromName: varchar("fromName", { length: 255 }).notNull().default("Gross ICT"),
  /** Is this configuration active */
  isActive: boolean("isActive").notNull().default(true),
  /** Test connection status */
  lastTestStatus: varchar("lastTestStatus", { length: 50 }),
  /** Last test timestamp */
  lastTestedAt: timestamp("lastTestedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmtpSettings = typeof smtpSettings.$inferSelect;
export type InsertSmtpSettings = typeof smtpSettings.$inferInsert;
