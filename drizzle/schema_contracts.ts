import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Contracts table for customer contracts
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  /** Contract number (e.g., "VTR-2025-001") */
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
  /** Reference to customer */
  customerId: int("customerId").notNull(),
  /** Contract title/name */
  title: varchar("title", { length: 255 }).notNull(),
  /** Contract description */
  description: text("description"),
  /** Contract type */
  contractType: mysqlEnum("contractType", ["service", "license", "support", "hosting", "maintenance", "other"]).default("service").notNull(),
  /** Contract status */
  status: mysqlEnum("status", ["draft", "active", "expired", "cancelled", "renewed"]).default("draft").notNull(),
  /** Contract start date */
  startDate: timestamp("startDate").notNull(),
  /** Contract end date */
  endDate: timestamp("endDate").notNull(),
  /** Billing interval for recurring charges */
  billingInterval: mysqlEnum("billingInterval", ["monthly", "quarterly", "yearly", "one_time"]).default("monthly").notNull(),
  /** Next billing date (for recurring contracts) */
  nextBillingDate: timestamp("nextBillingDate"),
  /** Last billing date */
  lastBillingDate: timestamp("lastBillingDate"),
  /** Subtotal (before VAT and discount) */
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Total discount amount */
  discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Total VAT amount */
  vatAmount: decimal("vatAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Total amount (subtotal - discount + VAT) */
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Currency */
  currency: varchar("currency", { length: 3 }).default("CHF").notNull(),
  /** Auto-renew flag */
  autoRenew: int("autoRenew").default(0).notNull(),
  /** Renewal notice period in days */
  renewalNoticeDays: int("renewalNoticeDays").default(30).notNull(),
  /** Payment terms in days */
  paymentTermsDays: int("paymentTermsDays").default(30).notNull(),
  /** Internal notes */
  notes: text("notes"),
  /** Terms and conditions */
  terms: text("terms"),
  /** Reference to recurring invoice (if auto-billing is set up) */
  recurringInvoiceId: int("recurringInvoiceId"),
  /** Created by user ID */
  createdBy: int("createdBy").notNull(),
  /** Signed date (when customer accepted) */
  signedDate: timestamp("signedDate"),
  /** Cancelled date */
  cancelledDate: timestamp("cancelledDate"),
  /** Cancellation reason */
  cancellationReason: text("cancellationReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  contractNumberIdx: index("contract_number_idx").on(table.contractNumber),
  customerIdx: index("customer_idx").on(table.customerId),
  statusIdx: index("status_idx").on(table.status),
  startDateIdx: index("start_date_idx").on(table.startDate),
  endDateIdx: index("end_date_idx").on(table.endDate),
}));

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Contract line items
 */
export const contractItems = mysqlTable("contractItems", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to contract */
  contractId: int("contractId").notNull(),
  /** Item position/order */
  position: int("position").notNull(),
  /** Item description */
  description: text("description").notNull(),
  /** Quantity */
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00").notNull(),
  /** Unit (e.g., "Stunden", "Stück", "Monat") */
  unit: varchar("unit", { length: 50 }).default("Stück").notNull(),
  /** Unit price */
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** VAT rate for this item */
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("8.10").notNull(),
  /** Discount percentage for this item */
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0.00").notNull(),
  /** Total for this line (quantity * unitPrice * (1 - discount/100)) */
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00").notNull(),
}, (table) => ({
  contractIdx: index("contract_idx").on(table.contractId),
}));

export type ContractItem = typeof contractItems.$inferSelect;
export type InsertContractItem = typeof contractItems.$inferInsert;

/**
 * Contract attachments (signed documents, etc.)
 */
export const contractAttachments = mysqlTable("contractAttachments", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to contract */
  contractId: int("contractId").notNull(),
  /** File name */
  fileName: varchar("fileName", { length: 255 }).notNull(),
  /** File path in S3 */
  filePath: varchar("filePath", { length: 500 }).notNull(),
  /** File URL */
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  /** File size in bytes */
  fileSize: int("fileSize").notNull(),
  /** MIME type */
  mimeType: varchar("mimeType", { length: 100 }).notNull(),
  /** Uploaded by user ID */
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  contractIdx: index("contract_idx").on(table.contractId),
}));

export type ContractAttachment = typeof contractAttachments.$inferSelect;
export type InsertContractAttachment = typeof contractAttachments.$inferInsert;
