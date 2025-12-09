import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Contract templates for reusable contract configurations
 */
export const contractTemplates = mysqlTable("contractTemplates", {
  id: int("id").autoincrement().primaryKey(),
  /** Template name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Template description */
  description: text("description"),
  /** Contract type */
  contractType: mysqlEnum("contractType", ["service", "license", "support", "hosting", "maintenance", "other"]).default("service").notNull(),
  /** Default billing interval */
  defaultBillingInterval: mysqlEnum("defaultBillingInterval", ["monthly", "quarterly", "yearly", "one_time"]).default("monthly").notNull(),
  /** Default contract duration in months */
  defaultDurationMonths: int("defaultDurationMonths").default(12).notNull(),
  /** Default payment terms in days */
  defaultPaymentTermsDays: int("defaultPaymentTermsDays").default(30).notNull(),
  /** Default auto-renew setting */
  defaultAutoRenew: int("defaultAutoRenew").default(0).notNull(),
  /** Default renewal notice period in days */
  defaultRenewalNoticeDays: int("defaultRenewalNoticeDays").default(30).notNull(),
  /** Default terms and conditions */
  defaultTerms: text("defaultTerms"),
  /** Is this template active? */
  isActive: int("isActive").default(1).notNull(),
  /** Created by user ID */
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  nameIdx: index("name_idx").on(table.name),
  isActiveIdx: index("is_active_idx").on(table.isActive),
}));

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = typeof contractTemplates.$inferInsert;

/**
 * Contract template items (predefined line items)
 */
export const contractTemplateItems = mysqlTable("contractTemplateItems", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to template */
  templateId: int("templateId").notNull(),
  /** Item position/order */
  position: int("position").notNull(),
  /** Item description */
  description: text("description").notNull(),
  /** Default quantity */
  defaultQuantity: decimal("defaultQuantity", { precision: 10, scale: 2 }).default("1.00").notNull(),
  /** Default unit */
  defaultUnit: varchar("defaultUnit", { length: 50 }).default("Stück").notNull(),
  /** Default unit price */
  defaultUnitPrice: decimal("defaultUnitPrice", { precision: 10, scale: 2 }).default("0.00").notNull(),
  /** Default VAT rate */
  defaultVatRate: decimal("defaultVatRate", { precision: 5, scale: 2 }).default("8.10").notNull(),
  /** Default discount */
  defaultDiscount: decimal("defaultDiscount", { precision: 5, scale: 2 }).default("0.00").notNull(),
}, (table) => ({
  templateIdx: index("template_idx").on(table.templateId),
}));

export type ContractTemplateItem = typeof contractTemplateItems.$inferSelect;
export type InsertContractTemplateItem = typeof contractTemplateItems.$inferInsert;
