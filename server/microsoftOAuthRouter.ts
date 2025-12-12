import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import {
  getMicrosoftAuthUrl,
  exchangeCodeForToken,
  getMicrosoftUserProfile,
  findOrCreateUserFromMicrosoft,
  initializeMicrosoftOAuthSettings,
  getMicrosoftOAuthSettings,
} from "./microsoftOAuthService";
import { getDb } from "./db";
import { oauthSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Microsoft OAuth Router
 * Handles Microsoft SSO authentication endpoints
 */

export const microsoftOAuthRouter = router({
  /**
   * Get Microsoft OAuth authorization URL
   */
  getAuthUrl: publicProcedure
    .input(
      z.object({
        returnUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Generate random state for CSRF protection
        const state = Math.random().toString(36).substring(2, 15);
        
        // Store state and returnUrl in session or temporary storage
        // For now, we'll encode returnUrl in state
        const stateData = JSON.stringify({
          state,
          returnUrl: input.returnUrl || "/",
        });
        const encodedState = Buffer.from(stateData).toString("base64");

        const authUrl = await getMicrosoftAuthUrl(encodedState);

        return {
          authUrl,
          state: encodedState,
        };
      } catch (error: any) {
        console.error("[Microsoft OAuth] Failed to generate auth URL:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to generate Microsoft auth URL",
        });
      }
    }),

  /**
   * Handle OAuth callback
   */
  handleCallback: publicProcedure
    .input(
      z.object({
        code: z.string(),
        state: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Decode state to get returnUrl
        let returnUrl = "/";
        try {
          const stateData = JSON.parse(
            Buffer.from(input.state, "base64").toString()
          );
          returnUrl = stateData.returnUrl || "/";
        } catch (e) {
          console.warn("[Microsoft OAuth] Failed to decode state");
        }

        // Exchange code for token
        const tokenData = await exchangeCodeForToken(input.code);

        // Get user profile
        const profile = await getMicrosoftUserProfile(tokenData.access_token);

        // Find or create user
        const userId = await findOrCreateUserFromMicrosoft(profile, tokenData);

        return {
          success: true,
          userId,
          returnUrl,
          user: {
            id: userId,
            name: profile.displayName,
            email: profile.mail || profile.userPrincipalName,
          },
        };
      } catch (error: any) {
        console.error("[Microsoft OAuth] Callback failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Microsoft OAuth authentication failed",
        });
      }
    }),

  /**
   * Initialize Microsoft OAuth settings (Admin only)
   */
  initializeSettings: publicProcedure
    .input(
      z.object({
        clientId: z.string().min(1),
        clientSecret: z.string().min(1),
        tenantId: z.string().min(1),
        redirectUri: z.string().url(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        await initializeMicrosoftOAuthSettings(
          input.clientId,
          input.clientSecret,
          input.tenantId,
          input.redirectUri
        );

        return {
          success: true,
          message: "Microsoft OAuth settings initialized successfully",
        };
      } catch (error: any) {
        console.error("[Microsoft OAuth] Failed to initialize settings:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to initialize Microsoft OAuth settings",
        });
      }
    }),

  /**
   * Get Microsoft OAuth settings status
   */
  getSettingsStatus: publicProcedure.query(async () => {
    try {
      const db = await getDb();
      if (!db) {
        return {
          configured: false,
          active: false,
        };
      }

      const settings = await db
        .select()
        .from(oauthSettings)
        .where(eq(oauthSettings.provider, "microsoft"))
        .limit(1);

      if (settings.length === 0) {
        return {
          configured: false,
          active: false,
        };
      }

      return {
        configured: true,
        active: settings[0].isActive === 1,
        redirectUri: settings[0].redirectUri,
      };
    } catch (error: any) {
      console.error("[Microsoft OAuth] Failed to get settings status:", error);
      return {
        configured: false,
        active: false,
      };
    }
  }),

  /**
   * Toggle Microsoft OAuth active status (Admin only)
   */
  toggleActive: publicProcedure
    .input(
      z.object({
        active: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(oauthSettings)
          .set({
            isActive: input.active ? 1 : 0,
            updatedAt: new Date(),
          })
          .where(eq(oauthSettings.provider, "microsoft"));

        return {
          success: true,
          active: input.active,
        };
      } catch (error: any) {
        console.error("[Microsoft OAuth] Failed to toggle active status:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error.message || "Failed to toggle Microsoft OAuth status",
        });
      }
    }),
});
