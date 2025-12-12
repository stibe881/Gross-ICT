import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, unique, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  password: varchar("password", { length: 255 }), // For local auth (hashed)
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "support", "accounting", "marketing", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tickets table for support ticket system
 */
export const tickets = mysqlTable("tickets", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the user who created the ticket */
  userId: int("userId").notNull(),
  /** Customer name (for non-registered users) */
  customerName: varchar("customerName", { length: 255 }),
  /** Customer email (for non-registered users) */
  customerEmail: varchar("customerEmail", { length: 320 }),
  /** Customer company (optional) */
  company: varchar("company", { length: 255 }),
  /** Ticket subject */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Ticket message/description */
  message: text("message").notNull(),
  /** Ticket status */
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open").notNull(),
  /** Priority level */
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  /** Ticket category */
  category: mysqlEnum("category", ["network", "security", "hardware", "software", "email", "other"]).default("other").notNull(),
  /** Admin notes (internal) */
  adminNotes: text("adminNotes"),
  /** Assigned admin user ID */
  assignedTo: int("assignedTo"),
  /** SLA due date (calculated based on priority) */
  slaDueDate: timestamp("slaDueDate"),
  /** Whether SLA was breached */
  slaBreached: int("slaBreached").default(0).notNull(),
  /** Escalation level (0 = none, 1 = first escalation, 2 = critical) */
  escalationLevel: int("escalationLevel").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = typeof tickets.$inferInsert;
/**
 * Ticket comments table for communication between admin and customers
 */
export const ticketComments = mysqlTable("ticketComments", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the ticket */
  ticketId: int("ticketId").notNull(),
  /** Reference to the user who created the comment */
  userId: int("userId").notNull(),
  /** Comment text */
  message: text("message").notNull(),
  /** Whether this is an internal note (only visible to admins) */
  isInternal: int("isInternal").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = typeof ticketComments.$inferInsert;

/**
 * Mentions table for tracking @mentions in comments
 */
export const mentions = mysqlTable("mentions", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the comment containing the mention */
  commentId: int("commentId").notNull(),
  /** Reference to the ticket */
  ticketId: int("ticketId").notNull(),
  /** User who was mentioned */
  mentionedUserId: int("mentionedUserId").notNull(),
  /** User who created the mention */
  mentionedByUserId: int("mentionedByUserId").notNull(),
  /** Whether the mention has been read */
  isRead: tinyint("isRead").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Mention = typeof mentions.$inferSelect;
export type InsertMention = typeof mentions.$inferInsert;

/**
 * Automation rules table for automatic ticket actions
 */
export const automationRules = mysqlTable("automationRules", {
  id: int("id").autoincrement().primaryKey(),
  /** Rule name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Rule description */
  description: text("description"),
  /** Is rule enabled */
  isEnabled: tinyint("isEnabled").default(1).notNull(),
  /** Trigger type (ticket_created, ticket_updated, status_changed, etc.) */
  triggerType: varchar("triggerType", { length: 50 }).notNull(),
  /** Conditions (JSON) */
  conditions: text("conditions").notNull(),
  /** Actions (JSON) */
  actions: text("actions").notNull(),
  /** Created by user ID */
  createdBy: int("createdBy").notNull(),
  /** Created timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Updated timestamp */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AutomationRule = typeof automationRules.$inferSelect;
export type InsertAutomationRule = typeof automationRules.$inferInsert;

/**
 * Ticket attachments table for file uploads
 */
export const ticketAttachments = mysqlTable("ticketAttachments", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the ticket */
  ticketId: int("ticketId").notNull(),
  /** Reference to the user who uploaded the file */
  userId: int("userId").notNull(),
  /** Original filename */
  filename: varchar("filename", { length: 255 }).notNull(),
  /** File URL (S3 storage) */
  fileUrl: varchar("fileUrl", { length: 1000 }).notNull(),
  /** File size in bytes */
  fileSize: int("fileSize").notNull(),
  /** MIME type */
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type InsertTicketAttachment = typeof ticketAttachments.$inferInsert;

/**
 * Response templates table for quick replies
 */
export const responseTemplates = mysqlTable("responseTemplates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template title/name */
  title: varchar("title", { length: 255 }).notNull(),
  /** Template content */
  content: text("content").notNull(),
  /** Category this template applies to */
  category: mysqlEnum("category", ["network", "security", "hardware", "software", "email", "other", "general"]).default("general").notNull(),
  /** Created by user ID */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseTemplate = typeof responseTemplates.$inferSelect;
export type InsertResponseTemplate = typeof responseTemplates.$inferInsert;

/**
 * Knowledge Base articles table
 */
export const kbArticles = mysqlTable("kbArticles", {
  id: int("id").autoincrement().primaryKey(),
  /** Article title */
  title: varchar("title", { length: 500 }).notNull(),
  /** Article content (markdown supported) */
  content: text("content").notNull(),
  /** Article category */
  category: varchar("category", { length: 100 }).notNull(),
  /** Tags for better searchability (comma-separated) */
  tags: text("tags"),
  /** Visibility: internal (staff only) or public (customers can see) */
  visibility: mysqlEnum("visibility", ["internal", "public"]).default("public").notNull(),
  /** Optional reference to source ticket */
  sourceTicketId: int("sourceTicketId"),
  /** View count */
  viewCount: int("viewCount").default(0).notNull(),
  /** Helpful count (upvotes) */
  helpfulCount: int("helpfulCount").default(0).notNull(),
  /** Not helpful count (downvotes) */
  notHelpfulCount: int("notHelpfulCount").default(0).notNull(),
  /** Author user ID */
  authorId: int("authorId").notNull(),
  /** Created timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Updated timestamp */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type KbArticle = typeof kbArticles.$inferSelect;
export type InsertKbArticle = typeof kbArticles.$inferInsert;

/**
 * User favorites table for quick access to frequently used functions
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemType: varchar("itemType", { length: 50 }).notNull(),
  itemLabel: varchar("itemLabel", { length: 255 }).notNull(),
  itemPath: varchar("itemPath", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  uniqueUserItem: unique("unique_user_item").on(table.userId, table.itemType),
}));

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Activity feed table for tracking all system activities
 */
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  /** Type of activity (ticket_created, ticket_updated, invoice_created, etc.) */
  activityType: varchar("activityType", { length: 50 }).notNull(),
  /** User who performed the action */
  userId: int("userId").notNull(),
  /** User name (denormalized for performance) */
  userName: varchar("userName", { length: 255 }),
  /** Activity title/summary */
  title: varchar("title", { length: 500 }).notNull(),
  /** Activity description */
  description: text("description"),
  /** Related entity type (ticket, invoice, customer, etc.) */
  entityType: varchar("entityType", { length: 50 }),
  /** Related entity ID */
  entityId: int("entityId"),
  /** Activity metadata (JSON) */
  metadata: text("metadata"),
  /** Created timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

/**
 * Saved filter presets for quick access to common searches
 */
export const filterPresets = mysqlTable("filterPresets", {
  id: int("id").autoincrement().primaryKey(),
  /** User who owns this preset */
  userId: int("userId").notNull(),
  /** Preset name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Filter type (tickets, invoices, customers, etc.) */
  filterType: varchar("filterType", { length: 50 }).notNull(),
  /** Filter configuration (JSON) */
  filters: text("filters").notNull(),
  /** Is this a default/favorite preset */
  isDefault: tinyint("isDefault").default(0).notNull(),
  /** Created timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Updated timestamp */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FilterPreset = typeof filterPresets.$inferSelect;
export type InsertFilterPreset = typeof filterPresets.$inferInsert;

/**
 * SLA Policies - Define service level agreements
 */
export const slaPolicies = mysqlTable("slaPolicies", {
  id: int("id").autoincrement().primaryKey(),
  /** Policy name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Policy description */
  description: text("description"),
  /** Priority this policy applies to (urgent, high, normal, low, or null for all) */
  priority: varchar("priority", { length: 50 }),
  /** Response time in minutes (time to first response) */
  responseTimeMinutes: int("responseTimeMinutes").notNull(),
  /** Resolution time in minutes (time to resolve) */
  resolutionTimeMinutes: int("resolutionTimeMinutes").notNull(),
  /** Warning threshold percentage (e.g., 80 = warn at 80% of time) */
  warningThreshold: int("warningThreshold").default(80).notNull(),
  /** Is policy active */
  isActive: tinyint("isActive").default(1).notNull(),
  /** Created timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Updated timestamp */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SlaPolicy = typeof slaPolicies.$inferSelect;
export type InsertSlaPolicy = typeof slaPolicies.$inferInsert;

/**
 * SLA Tracking - Track SLA compliance for tickets
 */
export const slaTracking = mysqlTable("slaTracking", {
  id: int("id").autoincrement().primaryKey(),
  /** Ticket ID */
  ticketId: int("ticketId").notNull(),
  /** SLA Policy ID */
  policyId: int("policyId").notNull(),
  /** Response deadline */
  responseDeadline: timestamp("responseDeadline").notNull(),
  /** Resolution deadline */
  resolutionDeadline: timestamp("resolutionDeadline").notNull(),
  /** First response timestamp */
  firstResponseAt: timestamp("firstResponseAt"),
  /** Resolution timestamp */
  resolvedAt: timestamp("resolvedAt"),
  /** Response SLA status (met, warning, breached) */
  responseStatus: varchar("responseStatus", { length: 50 }).default("pending").notNull(),
  /** Resolution SLA status (met, warning, breached) */
  resolutionStatus: varchar("resolutionStatus", { length: 50 }).default("pending").notNull(),
  /** Warning email sent for response */
  responseWarningSent: tinyint("responseWarningSent").default(0).notNull(),
  /** Breach email sent for response */
  responseBreachSent: tinyint("responseBreachSent").default(0).notNull(),
  /** Warning email sent for resolution */
  resolutionWarningSent: tinyint("resolutionWarningSent").default(0).notNull(),
  /** Breach email sent for resolution */
  resolutionBreachSent: tinyint("resolutionBreachSent").default(0).notNull(),
  /** Created timestamp */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  /** Updated timestamp */
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SlaTracking = typeof slaTracking.$inferSelect;
export type InsertSlaTracking = typeof slaTracking.$inferInsert;

// Export accounting module tables
export * from "./schema_accounting";
// Export reminder log tables
export * from "./schema_reminder_log";
// Export contracts module tables
export * from "./schema_contracts";
// Export contract templates module tables
export * from "./schema_contract_templates";
// Export email templates module tables
export * from "./schema_email_templates";
// Export email logs module tables
export * from "./schema_email_logs";
// Export newsletter module tables
export * from "./schema_newsletter";

/**
 * SMTP settings table for email configuration
 */
export const smtpSettings = mysqlTable("smtpSettings", {
  id: int("id").autoincrement().primaryKey(),
  host: varchar("host", { length: 255 }).notNull(),
  port: int("port").notNull(),
  secure: int("secure").default(1).notNull(), // 1 = SSL/TLS, 0 = no encryption
  user: varchar("user", { length: 320 }).notNull(),
  password: varchar("password", { length: 500 }).notNull(),
  fromEmail: varchar("fromEmail", { length: 320 }).notNull(),
  fromName: varchar("fromName", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SmtpSettings = typeof smtpSettings.$inferSelect;
export type InsertSmtpSettings = typeof smtpSettings.$inferInsert;

// Export OAuth module tables
export * from "./schema_oauth";
