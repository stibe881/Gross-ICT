import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean } from "drizzle-orm/mysql-core";

/**
 * Email Templates table for customizable notification emails
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template name/identifier (e.g., "ticket_created", "sla_warning") */
  name: varchar("name", { length: 100 }).notNull().unique(),
  /** Human-readable template title */
  title: varchar("title", { length: 255 }).notNull(),
  /** Template description */
  description: text("description"),
  /** Email subject line (supports placeholders) */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Email body content (HTML, supports placeholders) */
  body: text("body").notNull(),
  /** Template category */
  category: mysqlEnum("category", [
    "ticket",
    "sla",
    "invoice",
    "customer",
    "akquise",
    "system",
    "custom"
  ]).default("custom").notNull(),
  /** Whether this template is active */
  isActive: boolean("isActive").default(true).notNull(),
  /** Whether this is a system template (cannot be deleted) */
  isSystem: boolean("isSystem").default(false).notNull(),
  /** Available placeholders for this template (JSON array) */
  placeholders: text("placeholders"),
  /** User who created the template */
  createdBy: int("createdBy"),
  /** User who last updated the template */
  updatedBy: int("updatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
