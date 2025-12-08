import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  role: mysqlEnum("role", ["user", "support", "admin"]).default("user").notNull(),
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
