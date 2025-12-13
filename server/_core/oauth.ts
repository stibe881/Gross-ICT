import type { Request, Response } from "express";
import type { Express } from "express";
import { sdk } from "./sdk";
import { signJWT } from "./cookies";
import { db } from "../db";
import { users, oauthProviders } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// Helper function to safely extract query parameters
function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  // Skip OAuth routes if OAuth is disabled
  if (!process.env.OAUTH_SERVER_URL || process.env.OAUTH_SERVER_URL === "disabled") {
    console.log("[OAuth] OAuth routes disabled");
    return;
  }

  // Manus OAuth Callback
  app.get("/api/oauth/callback", handleOAuthCallback);
  
  // Microsoft OAuth Callback - INLINE DEFINITION
  app.get("/api/oauth/microsoft/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    try {
      // Decode state to get returnUrl
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
      const returnUrl = stateData.returnUrl || "/";

      // Get OAuth settings from database
      const settings = await db.query.oauthSettings.findFirst({
        where: (settings, { eq }) => eq(settings.provider, "microsoft"),
      });

      if (!settings) {
        throw new Error("Microsoft OAuth not configured");
      }

      // Exchange code for tokens
      const tokenUrl = `https://login.microsoftonline.com/${settings.tenantId}/oauth2/v2.0/token`;
      const tokenResponse = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: settings.clientId,
          client_secret: settings.clientSecret,
          code,
          redirect_uri: settings.redirectUri,
          grant_type: "authorization_code",
        } ),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
      }

      const tokens = await tokenResponse.json();

      // Get user profile from Microsoft Graph
      const profileResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      } );

      if (!profileResponse.ok) {
        throw new Error(`Failed to fetch user profile: ${profileResponse.statusText}`);
      }

      const profile = await profileResponse.json();

      // Find or create user
      let user = await db.query.users.findFirst({
        where: eq(users.email, profile.mail || profile.userPrincipalName),
      });

      if (!user) {
        // Create new user
        const [newUser] = await db.insert(users).values({
          email: profile.mail || profile.userPrincipalName,
          name: profile.displayName,
          role: "user",
        }).returning();
        user = newUser;
      }

      // Store or update OAuth provider link
      const existingLink = await db.query.oauthProviders.findFirst({
        where: (providers, { and, eq }) =>
          and(
            eq(providers.userId, user.id),
            eq(providers.provider, "microsoft")
          ),
      });

      if (existingLink) {
        await db.update(oauthProviders)
          .set({
            providerUserId: profile.id,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          })
          .where(eq(oauthProviders.id, existingLink.id));
      } else {
        await db.insert(oauthProviders).values({
          userId: user.id,
          provider: "microsoft",
          providerUserId: profile.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        });
      }

      // Create session
      const token = signJWT({ userId: user.id });
      res.cookie("session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      } );

      // Redirect to return URL
      res.redirect(returnUrl);
    } catch (error) {
      console.error("[Microsoft OAuth] Error:", error);
      res.status(500).json({ 
        error: "Authentication failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });
}

// Manus OAuth Callback Handler
async function handleOAuthCallback(req: Request, res: Response) {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");

  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      throw new Error("openId missing from user info");
    }

    let user = await db.query.users.findFirst({
      where: eq(users.openId, userInfo.openId),
    });

    if (!user) {
      const [newUser] = await db.insert(users).values({
        openId: userInfo.openId,
        email: userInfo.email || "",
        name: userInfo.name || "",
        role: userInfo.openId === process.env.OWNER_OPEN_ID ? "admin" : "user",
      }).returning();
      user = newUser;
    }

    const token = signJWT({ userId: user.id });
    res.cookie("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    } );

    const returnUrl = tokenResponse.returnUrl || "/";
    res.redirect(returnUrl);
  } catch (error) {
    console.error("[OAuth] Error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
}

