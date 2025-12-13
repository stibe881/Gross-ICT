import axios from "axios";
import { getDb } from "./db";
import { oauthSettings, oauthProviders, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Microsoft OAuth Service
 * Handles Microsoft SSO authentication flow
 */

interface MicrosoftTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface MicrosoftUserProfile {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  jobTitle?: string;
  mobilePhone?: string;
  officeLocation?: string;
}

/**
 * Get Microsoft OAuth settings from database
 */
export async function getMicrosoftOAuthSettings() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const settings = await db
    .select()
    .from(oauthSettings)
    .where(eq(oauthSettings.provider, "microsoft"))
    .limit(1);

  if (settings.length === 0) {
    throw new Error("Microsoft OAuth settings not configured");
  }

  const config = settings[0];

  if (!config.isActive) {
    throw new Error("Microsoft OAuth is not active");
  }

  return config;
}

/**
 * Generate Microsoft OAuth authorization URL
 */
export async function getMicrosoftAuthUrl(state: string): Promise<string> {
  const settings = await getMicrosoftOAuthSettings();

  const params = new URLSearchParams({
    client_id: settings.clientId,
    response_type: "code",
    redirect_uri: settings.redirectUri,
    response_mode: "query",
    scope: settings.scopes,
    state: state,
    prompt: "select_account", // Always show account picker
  });

  const tenantId = settings.tenantId || "common";
  const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?${params.toString()}`;

  return authUrl;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<MicrosoftTokenResponse> {
  const settings = await getMicrosoftOAuthSettings();
  const tenantId = settings.tenantId || "common";

  const params = new URLSearchParams({
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    code: code,
    redirect_uri: settings.redirectUri,
    grant_type: "authorization_code",
  });

  try {
    const response = await axios.post<MicrosoftTokenResponse>(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Microsoft OAuth] Token exchange failed:", error.response?.data || error.message);
    throw new Error("Failed to exchange authorization code for token");
  }
}

/**
 * Get user profile from Microsoft Graph API
 */
export async function getMicrosoftUserProfile(accessToken: string): Promise<MicrosoftUserProfile> {
  try {
    const response = await axios.get<MicrosoftUserProfile>(
      "https://graph.microsoft.com/v1.0/me",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Microsoft OAuth] Failed to get user profile:", error.response?.data || error.message);
    throw new Error("Failed to get Microsoft user profile");
  }
}

/**
 * Refresh Microsoft access token
 */
export async function refreshMicrosoftToken(refreshToken: string): Promise<MicrosoftTokenResponse> {
  const settings = await getMicrosoftOAuthSettings();
  const tenantId = settings.tenantId || "common";

  const params = new URLSearchParams({
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  try {
    const response = await axios.post<MicrosoftTokenResponse>(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error("[Microsoft OAuth] Token refresh failed:", error.response?.data || error.message);
    throw new Error("Failed to refresh Microsoft access token");
  }
}

/**
 * Find or create user from Microsoft profile
 */
export async function findOrCreateUserFromMicrosoft(
  profile: MicrosoftUserProfile,
  tokenData: MicrosoftTokenResponse
): Promise<number> {
  // Check if OAuth provider already exists
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingProvider = await db
    .select()
    .from(oauthProviders)
    .where(eq(oauthProviders.providerUserId, profile.id))
    .limit(1);

  if (existingProvider.length > 0) {
    // Update existing OAuth provider with new tokens
    const provider = existingProvider[0];
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await db
      .update(oauthProviders)
      .set({
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || provider.refreshToken,
        tokenExpiresAt: expiresAt,
        profileData: JSON.stringify(profile),
        updatedAt: new Date(),
      })
      .where(eq(oauthProviders.id, provider.id));

    // Update user's last sign-in
    await db
      .update(users)
      .set({
        lastSignedIn: new Date(),
      })
      .where(eq(users.id, provider.userId));

    return provider.userId;
  }

  // Check if user exists with same email
  const email = profile.mail || profile.userPrincipalName;
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId: number;

  if (existingUser.length > 0) {
    // Link Microsoft account to existing user
    userId = existingUser[0].id;

    // Update user info
    await db
      .update(users)
      .set({
        name: profile.displayName || existingUser[0].name,
        loginMethod: "microsoft",
        lastSignedIn: new Date(),
      })
      .where(eq(users.id, userId));
  } else {
    // Create new user
    const newUser = await db.insert(users).values({
      openId: `microsoft:${profile.id}`,
      name: profile.displayName,
      email: email,
      loginMethod: "microsoft",
      role: "user",
      lastSignedIn: new Date(),
    });

    userId = Number((newUser as any).insertId);
  }

  // Create OAuth provider entry
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

  await db.insert(oauthProviders).values({
    userId: userId,
    provider: "microsoft",
    providerUserId: profile.id,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token || null,
    tokenExpiresAt: expiresAt,
    profileData: JSON.stringify(profile),
  });

  return userId;
}

/**
 * Initialize Microsoft OAuth settings in database
 */
export async function initializeMicrosoftOAuthSettings(
  clientId: string,
  clientSecret: string,
  tenantId: string,
  redirectUri: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingSettings = await db
    .select()
    .from(oauthSettings)
    .where(eq(oauthSettings.provider, "microsoft"))
    .limit(1);

  const scopes = "openid profile email User.Read Mail.Send offline_access";

  if (existingSettings.length > 0) {
    // Update existing settings
    await db
      .update(oauthSettings)
      .set({
        clientId,
        clientSecret,
        tenantId,
        redirectUri,
        scopes,
        isActive: 1,
        updatedAt: new Date(),
      })
      .where(eq(oauthSettings.provider, "microsoft"));
  } else {
    // Create new settings
    await db.insert(oauthSettings).values({
      provider: "microsoft",
      clientId,
      clientSecret,
      tenantId,
      redirectUri,
      scopes,
      isActive: 1,
    });
  }

  console.log("[Microsoft OAuth] Settings initialized successfully");
}
