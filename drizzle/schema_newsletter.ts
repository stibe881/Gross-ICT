import { mysqlTable, int, varchar, text, timestamp, boolean } from "drizzle-orm/mysql-core";

/**
 * Newsletter Subscribers
 * Stores all newsletter subscribers with their subscription status
 */
export const newsletterSubscribers = mysqlTable("newsletterSubscribers", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  firstName: varchar("firstName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, unsubscribed, bounced
  tags: text("tags"), // JSON array of tags
  source: varchar("source", { length: 100 }), // website, import, manual
  customFields: text("customFields"), // JSON object for additional data
  subscribedAt: timestamp("subscribedAt").notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribedAt"),
  lastEmailSent: timestamp("lastEmailSent"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

/**
 * Newsletter Templates
 * Pre-designed email templates for campaigns
 */
export const newsletterTemplates = mysqlTable("newsletterTemplates", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  htmlContent: text("htmlContent").notNull(),
  thumbnail: varchar("thumbnail", { length: 500 }),
  category: varchar("category", { length: 100 }), // promotional, newsletter, announcement
  isSystem: boolean("isSystem").notNull().default(false),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

/**
 * Newsletter Segments
 * Subscriber segments for targeted campaigns
 */
export const newsletterSegments = mysqlTable("newsletterSegments", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  criteria: text("criteria").notNull(), // JSON object with filter criteria
  subscriberCount: int("subscriberCount").notNull().default(0),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

/**
 * Newsletter Campaigns
 * Email campaigns sent to subscribers
 */
export const newsletterCampaigns = mysqlTable("newsletterCampaigns", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  subjectB: varchar("subjectB", { length: 500 }), // For A/B testing
  preheader: varchar("preheader", { length: 255 }),
  htmlContent: text("htmlContent").notNull(),
  templateId: int("templateId"),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, scheduled, sending, sent, paused
  recipientType: varchar("recipientType", { length: 20 }).notNull().default("all"), // all, segment, custom
  segmentId: int("segmentId"),
  recipientCount: int("recipientCount").notNull().default(0),
  scheduledAt: timestamp("scheduledAt"),
  sentAt: timestamp("sentAt"),
  abTestEnabled: boolean("abTestEnabled").notNull().default(false),
  abTestSplitPercent: int("abTestSplitPercent").default(50), // Percentage for variant A
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow().onUpdateNow(),
});

/**
 * Newsletter Campaign Statistics
 * Tracking metrics for each campaign
 */
export const newsletterStats = mysqlTable("newsletterStats", {
  id: int("id").primaryKey().autoincrement(),
  campaignId: int("campaignId").notNull(),
  variantType: varchar("variantType", { length: 10 }).default("A"), // A or B for A/B testing
  totalSent: int("totalSent").notNull().default(0),
  totalDelivered: int("totalDelivered").notNull().default(0),
  totalOpened: int("totalOpened").notNull().default(0),
  totalClicked: int("totalClicked").notNull().default(0),
  totalBounced: int("totalBounced").notNull().default(0),
  totalUnsubscribed: int("totalUnsubscribed").notNull().default(0),
  uniqueOpens: int("uniqueOpens").notNull().default(0),
  uniqueClicks: int("uniqueClicks").notNull().default(0),
  openRate: int("openRate").notNull().default(0), // Percentage * 100 (e.g., 2550 = 25.50%)
  clickRate: int("clickRate").notNull().default(0),
  bounceRate: int("bounceRate").notNull().default(0),
  unsubscribeRate: int("unsubscribeRate").notNull().default(0),
  lastUpdated: timestamp("lastUpdated").notNull().defaultNow().onUpdateNow(),
});

/**
 * Newsletter Subscriber Activity
 * Individual subscriber interactions with campaigns
 */
export const newsletterActivity = mysqlTable("newsletterActivity", {
  id: int("id").primaryKey().autoincrement(),
  campaignId: int("campaignId").notNull(),
  subscriberId: int("subscriberId").notNull(),
  variantType: varchar("variantType", { length: 10 }).default("A"),
  activityType: varchar("activityType", { length: 20 }).notNull(), // sent, delivered, opened, clicked, bounced, unsubscribed
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  linkUrl: varchar("linkUrl", { length: 500 }), // For click tracking
  createdAt: timestamp("createdAt").notNull().defaultNow(),
});
