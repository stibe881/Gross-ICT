import { mysqlTable, int, varchar, text, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";

/**
 * OAuth providers table for storing external authentication providers (Microsoft, Google, etc.)
 */
export const oauthProviders = mysqlTable("oauthProviders", {
  id: int("id").autoincrement().primaryKey(),
  /** Reference to the user */
  userId: int("userId").notNull(),
  /** Provider name (microsoft, google, github, etc.) */
  provider: varchar("provider", { length: 64 }).notNull(),
  /** Provider user ID (unique identifier from the OAuth provider) */
  providerUserId: varchar("providerUserId", { length: 255 }).notNull(),
  /** Access token from OAuth provider */
  accessToken: text("accessToken"),
  /** Refresh token from OAuth provider */
  refreshToken: text("refreshToken"),
  /** Token expiry timestamp */
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  /** Provider-specific profile data (JSON) */
  profileData: text("profileData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OAuthProvider = typeof oauthProviders.$inferSelect;
export type InsertOAuthProvider = typeof oauthProviders.$inferInsert;

/**
 * OAuth settings table for storing OAuth application credentials
 */
export const oauthSettings = mysqlTable("oauthSettings", {
  id: int("id").autoincrement().primaryKey(),
  /** Provider name (microsoft, google, github, etc.) */
  provider: varchar("provider", { length: 64 }).notNull().unique(),
  /** OAuth client ID */
  clientId: varchar("clientId", { length: 255 }).notNull(),
  /** OAuth client secret (encrypted) */
  clientSecret: text("clientSecret").notNull(),
  /** OAuth tenant ID (for Microsoft) */
  tenantId: varchar("tenantId", { length: 255 }),
  /** OAuth redirect URI */
  redirectUri: varchar("redirectUri", { length: 500 }).notNull(),
  /** OAuth scopes (comma-separated) */
  scopes: text("scopes").notNull(),
  /** Whether this provider is active */
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OAuthSetting = typeof oauthSettings.$inferSelect;
export type InsertOAuthSetting = typeof oauthSettings.$inferInsert;
