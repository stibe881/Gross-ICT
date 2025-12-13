import {
  mysqlTable,
  varchar,
  text,
  int,
  timestamp,
  boolean,
  decimal,
  mysqlEnum,
  index,
  unique,
  date,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

// Users table
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  openId: varchar("openId", { length: 255 }).unique(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["admin", "user", "support", "accounting"]).default("user"),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Tickets table
export const tickets = mysqlTable("tickets", {
  id: int("id").primaryKey().autoincrement(),
  ticketNumber: varchar("ticketNumber", { length: 50 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  description: text("description").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved", "closed"]).default("open"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
  category: mysqlEnum("category", ["network", "security", "hardware", "software", "email", "other"]).default("other"),
  customerName: varchar("customerName", { length: 255 }).notNull(),
  customerEmail: varchar("customerEmail", { length: 255 }).notNull(),
  customerCompany: varchar("customerCompany", { length: 255 }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  assignedTo: int("assignedTo").references(() => users.id, { onDelete: "set null" }),
  slaDeadline: timestamp("slaDeadline"),
  escalationLevel: int("escalationLevel").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  priorityIdx: index("priority_idx").on(table.priority),
  customerEmailIdx: index("customer_email_idx").on(table.customerEmail),
  assignedToIdx: index("assigned_to_idx").on(table.assignedTo),
}));

// Ticket Comments table
export const ticketComments = mysqlTable("ticketComments", {
  id: int("id").primaryKey().autoincrement(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  comment: text("comment").notNull(),
  isInternal: boolean("isInternal").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  ticketIdIdx: index("ticket_id_idx").on(table.ticketId),
}));

// Ticket Attachments table
export const ticketAttachments = mysqlTable("ticketAttachments", {
  id: int("id").primaryKey().autoincrement(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  commentId: int("commentId").references(() => ticketComments.id, { onDelete: "cascade" }),
  filename: varchar("filename", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 100 }),
  uploadedBy: int("uploadedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Customers table
export const customers = mysqlTable("customers", {
  id: int("id").primaryKey().autoincrement(),
  customerNumber: varchar("customerNumber", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  address: text("address"),
  type: mysqlEnum("type", ["individual", "company"]).default("individual"),
  language: mysqlEnum("language", ["de", "en", "fr"]).default("de"),
  currency: mysqlEnum("currency", ["CHF", "EUR", "USD", "GBP"]).default("CHF"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  companyIdx: index("company_idx").on(table.company),
}));

// Invoices table
export const invoices = mysqlTable("invoices", {
  id: int("id").primaryKey().autoincrement(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id, { onDelete: "restrict" }),
  status: mysqlEnum("status", ["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  issueDate: date("issueDate").notNull(),
  dueDate: date("dueDate").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  customerIdIdx: index("customer_id_idx").on(table.customerId),
  statusIdx: index("status_idx").on(table.status),
  dueDateIdx: index("due_date_idx").on(table.dueDate),
}));

// Invoice Line Items table
export const invoiceLineItems = mysqlTable("invoiceLineItems", {
  id: int("id").primaryKey().autoincrement(),
  invoiceId: int("invoiceId").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("Stk."),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("0.00"),
});

// Quotes table
export const quotes = mysqlTable("quotes", {
  id: int("id").primaryKey().autoincrement(),
  quoteNumber: varchar("quoteNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id, { onDelete: "restrict" }),
  status: mysqlEnum("status", ["draft", "sent", "accepted", "rejected", "expired"]).default("draft"),
  issueDate: date("issueDate").notNull(),
  validUntil: date("validUntil").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  customerIdIdx: index("customer_id_idx").on(table.customerId),
  statusIdx: index("status_idx").on(table.status),
}));

// Quote Line Items table
export const quoteLineItems = mysqlTable("quoteLineItems", {
  id: int("id").primaryKey().autoincrement(),
  quoteId: int("quoteId").notNull().references(() => quotes.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("Stk."),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("0.00"),
});

// Products table
export const products = mysqlTable("products", {
  id: int("id").primaryKey().autoincrement(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("Stk."),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("8.10"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  skuIdx: index("sku_idx").on(table.sku),
  categoryIdx: index("category_idx").on(table.category),
}));

// Recurring Invoices table
export const recurringInvoices = mysqlTable("recurringInvoices", {
  id: int("id").primaryKey().autoincrement(),
  customerId: int("customerId").notNull().references(() => customers.id, { onDelete: "restrict" }),
  templateName: varchar("templateName", { length: 255 }).notNull(),
  frequency: mysqlEnum("frequency", ["weekly", "monthly", "quarterly", "yearly"]).notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  nextRunDate: date("nextRunDate").notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Recurring Invoice Line Items table
export const recurringInvoiceLineItems = mysqlTable("recurringInvoiceLineItems", {
  id: int("id").primaryKey().autoincrement(),
  recurringInvoiceId: int("recurringInvoiceId").notNull().references(() => recurringInvoices.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("Stk."),
  vatRate: decimal("vatRate", { precision: 5, scale: 2 }).default("0.00"),
});

// Payment Reminder Log table
export const paymentReminderLog = mysqlTable("paymentReminderLog", {
  id: int("id").primaryKey().autoincrement(),
  invoiceId: int("invoiceId").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  customerId: int("customerId").notNull().references(() => customers.id, { onDelete: "cascade" }),
  reminderType: mysqlEnum("reminderType", ["first", "second", "final"]).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "bounced"]).default("sent"),
  sentAt: timestamp("sentAt").defaultNow(),
  emailMessageId: varchar("emailMessageId", { length: 255 }),
  errorMessage: text("errorMessage"),
  daysOverdue: int("daysOverdue").notNull(),
}, (table) => ({
  invoiceIdIdx: index("invoice_id_idx").on(table.invoiceId),
  statusIdx: index("status_idx").on(table.status),
  sentAtIdx: index("sent_at_idx").on(table.sentAt),
}));

// Knowledge Base Articles table
export const knowledgeBaseArticles = mysqlTable("knowledgeBaseArticles", {
  id: int("id").primaryKey().autoincrement(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 100 }),
  tags: text("tags"),
  visibility: mysqlEnum("visibility", ["public", "internal"]).default("public"),
  views: int("views").default(0),
  helpful: int("helpful").default(0),
  notHelpful: int("notHelpful").default(0),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  categoryIdx: index("category_idx").on(table.category),
  visibilityIdx: index("visibility_idx").on(table.visibility),
}));

// Response Templates table
export const responseTemplates = mysqlTable("responseTemplates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }),
  content: text("content").notNull(),
  isActive: boolean("isActive").default(true),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// SLA Policies table
export const slaPolicies = mysqlTable("slaPolicies", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).notNull(),
  responseTimeMinutes: int("responseTimeMinutes").notNull(),
  resolutionTimeMinutes: int("resolutionTimeMinutes").notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  priorityIdx: index("priority_idx").on(table.priority),
}));

// Mentions table
export const mentions = mysqlTable("mentions", {
  id: int("id").primaryKey().autoincrement(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  commentId: int("commentId").notNull().references(() => ticketComments.id, { onDelete: "cascade" }),
  mentionedUserId: int("mentionedUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  mentionedBy: int("mentionedBy").notNull().references(() => users.id, { onDelete: "cascade" }),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  mentionedUserIdx: index("mentioned_user_idx").on(table.mentionedUserId),
  isReadIdx: index("is_read_idx").on(table.isRead),
}));

// Automation Rules table
export const automationRules = mysqlTable("automationRules", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: mysqlEnum("trigger", ["ticket_created", "ticket_updated", "status_changed", "priority_changed"]).notNull(),
  conditions: text("conditions").notNull(),
  actions: text("actions").notNull(),
  isActive: boolean("isActive").default(true),
  createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Automation Execution Log table
export const automationExecutionLog = mysqlTable("automationExecutionLog", {
  id: int("id").primaryKey().autoincrement(),
  ruleId: int("ruleId").notNull().references(() => automationRules.id, { onDelete: "cascade" }),
  ticketId: int("ticketId").references(() => tickets.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["success", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  executedAt: timestamp("executedAt").defaultNow(),
}, (table) => ({
  ruleIdIdx: index("rule_id_idx").on(table.ruleId),
  executedAtIdx: index("executed_at_idx").on(table.executedAt),
}));

// SMTP Settings table
export const smtpSettings = mysqlTable("smtpSettings", {
  id: int("id").primaryKey().autoincrement(),
  host: varchar("host", { length: 255 }).notNull(),
  port: int("port").notNull(),
  secure: boolean("secure").default(false),
  username: varchar("username", { length: 255 }).notNull(),
  password: varchar("password", { length: 255 }).notNull(),
  fromEmail: varchar("fromEmail", { length: 255 }).notNull(),
  fromName: varchar("fromName", { length: 255 }).notNull(),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Email Templates table
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  category: varchar("category", { length: 100 }),
  placeholders: text("placeholders"),
  isActive: boolean("isActive").default(true),
  isSystem: boolean("isSystem").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Email Logs table
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").primaryKey().autoincrement(),
  templateId: int("templateId").references(() => emailTemplates.id, { onDelete: "set null" }),
  templateName: varchar("templateName", { length: 100 }),
  recipientEmail: varchar("recipientEmail", { length: 320 }).notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "failed"]).default("pending"),
  errorMessage: text("errorMessage"),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  triggeredBy: int("triggeredBy"),
  retryCount: int("retryCount").default(0),
  lastRetryAt: timestamp("lastRetryAt"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  recipientIdx: index("recipient_idx").on(table.recipientEmail),
  sentAtIdx: index("sent_at_idx").on(table.sentAt),
}));

// Newsletter Subscribers table
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  status: mysqlEnum("status", ["active", "unsubscribed", "bounced"]).default("active"),
  dateOfBirth: date("dateOfBirth"),
  lastActivityAt: timestamp("lastActivityAt"),
  subscribedAt: timestamp("subscribedAt").defaultNow(),
  unsubscribedAt: timestamp("unsubscribedAt"),
}, (table) => ({
  emailIdx: index("email_idx").on(table.email),
  statusIdx: index("status_idx").on(table.status),
}));

// Newsletter Segments table (MOVED BEFORE newsletterCampaigns)
export const newsletterSegments = mysqlTable("newsletterSegments", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  criteria: text("criteria").notNull(),
  subscriberCount: int("subscriberCount").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Newsletter Campaigns table
export const newsletterCampaigns = mysqlTable("newsletterCampaigns", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(),
  segmentId: int("segmentId").references(() => newsletterSegments.id, { onDelete: "set null" }),
  status: mysqlEnum("status", ["draft", "scheduled", "sending", "sent", "failed"]).default("draft"),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  sentCount: int("sentCount").default(0),
  failedCount: int("failedCount").default(0),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  statusIdx: index("status_idx").on(table.status),
  scheduledAtIdx: index("scheduled_at_idx").on(table.scheduledAt),
}));

// Newsletter Templates table
export const newsletterTemplates = mysqlTable("newsletterTemplates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  htmlContent: text("htmlContent").notNull(),
  category: varchar("category", { length: 100 }),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Newsletter Statistics table
export const newsletterStatistics = mysqlTable("newsletterStatistics", {
  id: int("id").primaryKey().autoincrement(),
  campaignId: int("campaignId").notNull().references(() => newsletterCampaigns.id, { onDelete: "cascade" }),
  subscriberId: int("subscriberId").notNull().references(() => newsletterSubscribers.id, { onDelete: "cascade" }),
  sent: boolean("sent").default(false),
  delivered: boolean("delivered").default(false),
  opened: boolean("opened").default(false),
  clicked: boolean("clicked").default(false),
  bounced: boolean("bounced").default(false),
  unsubscribed: boolean("unsubscribed").default(false),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  bouncedAt: timestamp("bouncedAt"),
  unsubscribedAt: timestamp("unsubscribedAt"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  campaignIdIdx: index("campaign_id_idx").on(table.campaignId),
  subscriberIdIdx: index("subscriber_id_idx").on(table.subscriberId),
}));

// Newsletter Automations table
export const newsletterAutomations = mysqlTable("newsletterAutomations", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  trigger: mysqlEnum("trigger", ["welcome", "birthday", "re_engagement", "custom"]).notNull(),
  segmentId: int("segmentId").references(() => newsletterSegments.id, { onDelete: "set null" }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Newsletter Automation Steps table
export const newsletterAutomationSteps = mysqlTable("newsletterAutomationSteps", {
  id: int("id").primaryKey().autoincrement(),
  automationId: int("automationId").notNull().references(() => newsletterAutomations.id, { onDelete: "cascade" }),
  stepOrder: int("stepOrder").notNull(),
  delayValue: int("delayValue").notNull(),
  delayUnit: mysqlEnum("delayUnit", ["minutes", "hours", "days"]).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Newsletter Automation Executions table
export const newsletterAutomationExecutions = mysqlTable("newsletterAutomationExecutions", {
  id: int("id").primaryKey().autoincrement(),
  automationId: int("automationId").notNull().references(() => newsletterAutomations.id, { onDelete: "cascade" }),
  subscriberId: int("subscriberId").notNull().references(() => newsletterSubscribers.id, { onDelete: "cascade" }),
  currentStep: int("currentStep").default(0),
  status: mysqlEnum("status", ["active", "completed", "cancelled"]).default("active"),
  nextExecutionAt: timestamp("nextExecutionAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  automationIdIdx: index("automation_id_idx").on(table.automationId),
  subscriberIdIdx: index("subscriber_id_idx").on(table.subscriberId),
  nextExecutionAtIdx: index("next_execution_at_idx").on(table.nextExecutionAt),
}));

// Newsletter Automation Step Logs table
export const newsletterAutomationStepLogs = mysqlTable("newsletterAutomationStepLogs", {
  id: int("id").primaryKey().autoincrement(),
  executionId: int("executionId").notNull().references(() => newsletterAutomationExecutions.id, { onDelete: "cascade" }),
  stepId: int("stepId").notNull().references(() => newsletterAutomationSteps.id, { onDelete: "cascade" }),
  status: mysqlEnum("status", ["sent", "failed"]).notNull(),
  errorMessage: text("errorMessage"),
  executedAt: timestamp("executedAt").defaultNow(),
});

// Contracts table
export const contracts = mysqlTable("contracts", {
  id: int("id").primaryKey().autoincrement(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
  customerId: int("customerId").notNull().references(() => customers.id, { onDelete: "restrict" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "active", "expired", "terminated"]).default("draft"),
  startDate: date("startDate").notNull(),
  endDate: date("endDate"),
  renewalType: mysqlEnum("renewalType", ["none", "auto", "manual"]).default("none"),
  billingCycle: mysqlEnum("billingCycle", ["monthly", "quarterly", "yearly"]).default("monthly"),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  slaResponseMinutes: int("slaResponseMinutes"),
  slaResolutionMinutes: int("slaResolutionMinutes"),
  terms: text("terms"),
  notes: text("notes"),
  signedByCustomer: boolean("signedByCustomer").default(false),
  signedByCompany: boolean("signedByCompany").default(false),
  customerSignatureUrl: varchar("customerSignatureUrl", { length: 500 }),
  companySignatureUrl: varchar("companySignatureUrl", { length: 500 }),
  customerSignedAt: timestamp("customerSignedAt"),
  companySignedAt: timestamp("companySignedAt"),
  pdfUrl: varchar("pdfUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  customerIdIdx: index("customer_id_idx").on(table.customerId),
  statusIdx: index("status_idx").on(table.status),
  endDateIdx: index("end_date_idx").on(table.endDate),
}));

// Contract Line Items table
export const contractLineItems = mysqlTable("contractLineItems", {
  id: int("id").primaryKey().autoincrement(),
  contractId: int("contractId").notNull().references(() => contracts.id, { onDelete: "cascade" }),
  description: varchar("description", { length: 500 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }).default("Stk."),
});

// Contract Templates table
export const contractTemplates = mysqlTable("contractTemplates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  terms: text("terms").notNull(),
  defaultDurationMonths: int("defaultDurationMonths"),
  defaultBillingCycle: mysqlEnum("defaultBillingCycle", ["monthly", "quarterly", "yearly"]).default("monthly"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Dashboard Preferences table
export const dashboardPreferences = mysqlTable("dashboardPreferences", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  layout: text("layout").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// OAuth Settings Table
export const oauthSettings = mysqlTable("oauthSettings", {
  id: int("id").primaryKey().autoincrement(),
  provider: varchar("provider", { length: 50 }).notNull(),
  clientId: varchar("clientId", { length: 255 }).notNull(),
  clientSecret: varchar("clientSecret", { length: 255 }).notNull(),
  tenantId: varchar("tenantId", { length: 255 }),
  redirectUri: varchar("redirectUri", { length: 500 }).notNull(),
  scopes: text("scopes"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// OAuth Providers Table (user-provider links)
export const oauthProviders = mysqlTable("oauthProviders", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { length: 50 }).notNull(),
  providerUserId: varchar("providerUserId", { length: 255 }).notNull(),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  tickets: many(tickets),
  comments: many(ticketComments),
  mentions: many(mentions),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  user: one(users, {
    fields: [tickets.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
  }),
  comments: many(ticketComments),
  attachments: many(ticketAttachments),
}));

export const ticketCommentsRelations = relations(ticketComments, ({ one, many }) => ({
  ticket: one(tickets, {
    fields: [ticketComments.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketComments.userId],
    references: [users.id],
  }),
  attachments: many(ticketAttachments),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  invoices: many(invoices),
  quotes: many(quotes),
  recurringInvoices: many(recurringInvoices),
  contracts: many(contracts),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  customer: one(customers, {
    fields: [invoices.customerId],
    references: [customers.id],
  }),
  lineItems: many(invoiceLineItems),
}));

export const quotesRelations = relations(quotes, ({ one, many }) => ({
  customer: one(customers, {
    fields: [quotes.customerId],
    references: [customers.id],
  }),
  lineItems: many(quoteLineItems),
}));

export const contractsRelations = relations(contracts, ({ one, many }) => ({
  customer: one(customers, {
    fields: [contracts.customerId],
    references: [customers.id],
  }),
  lineItems: many(contractLineItems),
}));

// === Backward-compatible Alias ===
export const kbArticles = knowledgeBaseArticles;

// === Re-exports from split schema files ===
export {
  invoiceItems,
  quoteItems,
  accountingSettings,
} from "./schema_accounting";

export {
  contractItems,
  contractAttachments
} from "./schema_contracts";

export {
  contractTemplateItems
} from "./schema_contract_templates";

// === Missing tables (defined inline to fix imports) ===

// Favorites table
export const favorites = mysqlTable("favorites", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemType: varchar("itemType", { length: 50 }).notNull(),
  itemLabel: varchar("itemLabel", { length: 255 }).notNull(),
  itemPath: varchar("itemPath", { length: 500 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  uniqueUserItem: unique("unique_user_item").on(table.userId, table.itemType),
}));

// Filter Presets table
export const filterPresets = mysqlTable("filterPresets", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  filters: text("filters").notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
});

// Activities table
export const activities = mysqlTable("activities", {
  id: int("id").primaryKey().autoincrement(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  entityType: varchar("entityType", { length: 100 }).notNull(),
  entityId: int("entityId"),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow(),
}, (table) => ({
  entityTypeIdx: index("entity_type_idx").on(table.entityType),
  userIdx: index("user_idx").on(table.userId),
}));

// SLA Tracking table
export const slaTracking = mysqlTable("slaTracking", {
  id: int("id").primaryKey().autoincrement(),
  ticketId: int("ticketId").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  slaPolicyId: int("slaPolicyId").references(() => slaPolicies.id, { onDelete: "set null" }),
  responseDeadline: timestamp("responseDeadline"),
  resolutionDeadline: timestamp("resolutionDeadline"),
  respondedAt: timestamp("respondedAt"),
  resolvedAt: timestamp("resolvedAt"),
  isBreached: boolean("isBreached").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow(),
}, (table) => ({
  ticketIdx: index("ticket_idx").on(table.ticketId),
}));

// === Re-exports from schema_newsletter.ts ===
export {
  newsletterActivity,
  newsletterStats,
} from "./schema_newsletter";
