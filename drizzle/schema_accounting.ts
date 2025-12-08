import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Customers table for CRM/VRM
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  /** Customer type: company or individual */
  type: mysqlEnum("type", ["company", "individual"]).default("company").notNull(),
  /** Company name or person name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Customer number (auto-generated or manual) */
  customerNumber: varchar("customerNumber", { length: 50 }).unique(),
  /** Contact person name (for companies) */
  contactPerson: varchar("contactPerson", { length: 255 }),
  /** Email address */
  email: varchar("email", { length: 320 }).notNull(),
  /** Phone number */
  phone: varchar("phone", { length: 50 }),
  /** Street address */
  address: varchar("address", { length: 500 }),
  /** Postal code */
  postalCode: varchar("postalCode", { length: 20 }),
  /** City */
  city: varchar("city", { length: 100 }),
  /** Country */
  country: varchar("country", { length: 100 }).default("Schweiz").notNull(),
  /** Payment terms in days (e.g., 30 for "net 30") */
  paymentTermsDays: int("paymentTermsDays").default(30).notNull(),
  /** Default VAT rate (e.g., 8.1 for Swiss VAT) */
  defaultVatRate: decimal("defaultVatRate", { precision: 5, scale: 2 }).default("8.10").notNull(),
  /** Default discount percentage */
  defaultDiscount: decimal("defaultDiscount", { precision: 5, scale: 2 }).default("0.00").notNull(),
  /** Internal notes */
  notes: text("notes"),
  /** Link to user account (if customer has login) */
  userId: int("userId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  customerNumberIdx: index("customer_number_idx").on(table.customerNumber),
}));

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Invoices table
 */
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  /** Invoice number (e.g., "2025-001") */
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  /** Reference to customer */
  customerId: int("customerId").notNull(),
  /** Invoice date */
  invoiceDate: timestamp("invoiceDate").defaultNow().notNull(),
  /** Due date */
  dueDate: timestamp("dueDate").notNull(),
  /** Invoice status */
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  /** Payment date (when marked as paid) */
  paidDate: timestamp("paidDate"),
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
  /** Internal notes */
  notes: text("notes"),
  /** Footer text (payment terms, etc.) */
  footerText: text("footerText"),
  /** Created by user ID */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  invoiceNumberIdx: index("invoice_number_idx").on(table.invoiceNumber),
  customerIdx: index("customer_idx").on(table.customerId),
  statusIdx: index("status_idx").on(table.status),
  invoiceDateIdx: index("invoice_date_idx").on(table.invoiceDate),
}));

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

/**
 * Invoice line items
 */
export const invoiceItems = mysqlTable("invoiceItems", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to invoice */
  invoiceId: int("invoiceId").notNull(),
  /** Item position/order */
  position: int("position").notNull(),
  /** Item description */
  description: text("description").notNull(),
  /** Quantity */
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00").notNull(),
  /** Unit (e.g., "Stunden", "Stück", "Pauschal") */
  unit: varchar("unit", { length: 50 }).default("Stück").notNull(),
  /** Unit price */
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** VAT rate for this item */
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("8.10").notNull(),
  /** Discount percentage for this item */
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0.00").notNull(),
  /** Total for this line (quantity * unitPrice * (1 - discount/100)) */
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Reference to ticket (if created from ticket) */
  ticketId: int("ticketId"),
}, (table) => ({
  invoiceIdx: index("invoice_idx").on(table.invoiceId),
}));

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = typeof invoiceItems.$inferInsert;

/**
 * Quotes/Offers table
 */
export const quotes = mysqlTable("quotes", {
  id: int("id").autoincrement().primaryKey(),
  /** Quote number (e.g., "OFF-2025-001") */
  quoteNumber: varchar("quoteNumber", { length: 50 }).notNull().unique(),
  /** Reference to customer */
  customerId: int("customerId").notNull(),
  /** Quote date */
  quoteDate: timestamp("quoteDate").defaultNow().notNull(),
  /** Valid until date */
  validUntil: timestamp("validUntil").notNull(),
  /** Quote status */
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft").notNull(),
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
  /** Internal notes */
  notes: text("notes"),
  /** Footer text */
  footerText: text("footerText"),
  /** Reference to invoice (if converted) */
  invoiceId: int("invoiceId"),
  /** Created by user ID */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  quoteNumberIdx: index("quote_number_idx").on(table.quoteNumber),
  customerIdx: index("customer_idx").on(table.customerId),
  statusIdx: index("status_idx").on(table.status),
}));

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = typeof quotes.$inferInsert;

/**
 * Quote line items
 */
export const quoteItems = mysqlTable("quoteItems", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to quote */
  quoteId: int("quoteId").notNull(),
  /** Item position/order */
  position: int("position").notNull(),
  /** Item description */
  description: text("description").notNull(),
  /** Quantity */
  quantity: decimal("quantity", { precision: 10, scale: 2 }).default("1.00").notNull(),
  /** Unit */
  unit: varchar("unit", { length: 50 }).default("Stück").notNull(),
  /** Unit price */
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** VAT rate for this item */
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("8.10").notNull(),
  /** Discount percentage for this item */
  discount: decimal("discount", { precision: 5, scale: 2 }).default("0.00").notNull(),
  /** Total for this line */
  total: decimal("total", { precision: 10, scale: 2 }).default("0.00").notNull(),
}, (table) => ({
  quoteIdx: index("quote_idx").on(table.quoteId),
}));

export type QuoteItem = typeof quoteItems.$inferSelect;
export type InsertQuoteItem = typeof quoteItems.$inferInsert;

/**
 * Accounting settings table
 */
export const accountingSettings = mysqlTable("accountingSettings", {
  id: int("id").autoincrement().primaryKey(),
  /** Company name */
  companyName: varchar("companyName", { length: 255 }).notNull(),
  /** Company address */
  companyAddress: text("companyAddress"),
  /** Company postal code */
  companyPostalCode: varchar("companyPostalCode", { length: 20 }),
  /** Company city */
  companyCity: varchar("companyCity", { length: 100 }),
  /** Company country */
  companyCountry: varchar("companyCountry", { length: 100 }).default("Schweiz").notNull(),
  /** Company phone */
  companyPhone: varchar("companyPhone", { length: 50 }),
  /** Company email */
  companyEmail: varchar("companyEmail", { length: 320 }),
  /** Company website */
  companyWebsite: varchar("companyWebsite", { length: 255 }),
  /** Tax ID / UID */
  taxId: varchar("taxId", { length: 50 }),
  /** IBAN */
  iban: varchar("iban", { length: 34 }),
  /** Bank name */
  bankName: varchar("bankName", { length: 255 }),
  /** Logo URL (S3 path) */
  logoUrl: varchar("logoUrl", { length: 500 }),
  /** Primary color for documents */
  primaryColor: varchar("primaryColor", { length: 7 }).default("#D4AF37").notNull(),
  /** Invoice number prefix */
  invoicePrefix: varchar("invoicePrefix", { length: 20 }).default("").notNull(),
  /** Quote number prefix */
  quotePrefix: varchar("quotePrefix", { length: 20 }).default("OFF-").notNull(),
  /** Default payment terms in days */
  defaultPaymentTerms: int("defaultPaymentTerms").default(30).notNull(),
  /** Default VAT rate */
  defaultVatRate: decimal("defaultVatRate", { precision: 5, scale: 2 }).default("8.10").notNull(),
  /** Footer text for invoices */
  invoiceFooter: text("invoiceFooter"),
  /** Footer text for quotes */
  quoteFooter: text("quoteFooter"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccountingSettings = typeof accountingSettings.$inferSelect;
export type InsertAccountingSettings = typeof accountingSettings.$inferInsert;
