import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, index } from "drizzle-orm/mysql-core";
import { users } from "./schema";
import { customers } from "./schema_accounting";

/**
 * Leads table for customer acquisition (Kundenakquise)
 */
export const leads = mysqlTable("leads", {
    id: int("id").autoincrement().primaryKey(),
    /** First name */
    firstName: varchar("firstName", { length: 100 }).notNull(),
    /** Last name */
    lastName: varchar("lastName", { length: 100 }).notNull(),
    /** Email address */
    email: varchar("email", { length: 320 }).notNull(),
    /** Phone number */
    phone: varchar("phone", { length: 50 }),
    /** Website URL */
    website: varchar("website", { length: 255 }),
    /** Company name */
    company: varchar("company", { length: 255 }),
    /** City/Location */
    city: varchar("city", { length: 100 }),
    /** Position/Title */
    position: varchar("position", { length: 100 }),
    /** Lead status in pipeline */
    status: mysqlEnum("status", ["new", "contacted", "qualified", "proposal", "won", "lost"]).default("new").notNull(),
    /** Priority rating */
    priority: mysqlEnum("priority", ["A", "B", "C"]).default("B").notNull(),
    /** Lead source */
    source: mysqlEnum("source", ["website", "referral", "cold_call", "email", "social_media", "trade_show", "other"]).default("other").notNull(),
    /** Estimated deal value in CHF */
    estimatedValue: decimal("estimatedValue", { precision: 10, scale: 2 }),
    /** Internal notes */
    notes: text("notes"),
    /** Assigned to user */
    assignedTo: int("assignedTo").references(() => users.id, { onDelete: "set null" }),
    /** Converted to customer ID (if won) */
    convertedToCustomerId: int("convertedToCustomerId").references(() => customers.id, { onDelete: "set null" }),
    /** Conversion date */
    convertedAt: timestamp("convertedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
    statusIdx: index("status_idx").on(table.status),
    priorityIdx: index("priority_idx").on(table.priority),
    assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
    emailIdx: index("email_idx").on(table.email),
}));

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

/**
 * Lead activities table for tracking interactions
 */
export const leadActivities = mysqlTable("leadActivities", {
    id: int("id").autoincrement().primaryKey(),
    /** Reference to lead */
    leadId: int("leadId").notNull().references(() => leads.id, { onDelete: "cascade" }),
    /** Activity type */
    activityType: mysqlEnum("activityType", ["note", "email", "call", "meeting", "status_change"]).notNull(),
    /** Activity description */
    description: text("description").notNull(),
    /** User who performed the activity */
    userId: int("userId").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
    leadIdx: index("lead_idx").on(table.leadId),
    activityTypeIdx: index("activity_type_idx").on(table.activityType),
}));

export type LeadActivity = typeof leadActivities.$inferSelect;
export type InsertLeadActivity = typeof leadActivities.$inferInsert;
