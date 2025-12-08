import { mysqlTable, int, varchar, timestamp, mysqlEnum, index } from "drizzle-orm/mysql-core";

/**
 * Payment Reminder Log table
 * Tracks all sent payment reminders for analytics and monitoring
 */
export const paymentReminderLog = mysqlTable("paymentReminderLog", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to invoice */
  invoiceId: int("invoiceId").notNull(),
  /** Reference to customer */
  customerId: int("customerId").notNull(),
  /** Reminder type (1st, 2nd, final) */
  reminderType: mysqlEnum("reminderType", ["1st", "2nd", "final"]).notNull(),
  /** Email sent to */
  emailTo: varchar("emailTo", { length: 320 }).notNull(),
  /** Email subject */
  subject: varchar("subject", { length: 500 }).notNull(),
  /** Reminder status */
  status: mysqlEnum("status", ["sent", "failed", "bounced"]).default("sent").notNull(),
  /** Email message ID (from SMTP) */
  messageId: varchar("messageId", { length: 255 }),
  /** Error message if failed */
  errorMessage: varchar("errorMessage", { length: 1000 }),
  /** When the reminder was sent */
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  /** Invoice amount at time of reminder */
  invoiceAmount: varchar("invoiceAmount", { length: 20 }).notNull(),
  /** Days overdue at time of reminder */
  daysOverdue: int("daysOverdue").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  invoiceIdx: index("invoice_idx").on(table.invoiceId),
  customerIdx: index("customer_idx").on(table.customerId),
  reminderTypeIdx: index("reminder_type_idx").on(table.reminderType),
  statusIdx: index("status_idx").on(table.status),
  sentAtIdx: index("sent_at_idx").on(table.sentAt),
}));

export type PaymentReminderLog = typeof paymentReminderLog.$inferSelect;
export type InsertPaymentReminderLog = typeof paymentReminderLog.$inferInsert;
