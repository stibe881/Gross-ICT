import { pgTable, serial, integer, varchar, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./schema";

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'accounting', 'crm', 'knowledge-base', 'user-management', 'products', 'templates', 'settings', 'reminders', 'statistics'
  itemLabel: varchar("item_label", { length: 255 }).notNull(),
  itemPath: varchar("item_path", { length: 500 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserItem: unique("unique_user_item").on(table.userId, table.itemType),
}));
