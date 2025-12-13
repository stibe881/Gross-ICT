/**
 * Microsoft Graph Email Service
 * Sends emails using Microsoft Graph API with OAuth tokens
 */

import { getDb } from "../db";
import { oauthProviders, oauthSettings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

interface GraphEmailMessage {
    subject: string;
    body: {
        contentType: "HTML" | "Text";
        content: string;
    };
    toRecipients: Array<{ emailAddress: { address: string; name?: string } }>;
    ccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
    bccRecipients?: Array<{ emailAddress: { address: string; name?: string } }>;
}

interface SendMailRequest {
    message: GraphEmailMessage;
    saveToSentItems: boolean;
}

/**
 * Refresh the OAuth access token using the refresh token
 */
async function refreshAccessToken(userId: number): Promise<string | null> {
    try {
        const db = await getDb();
        if (!db) return null;

        // Get OAuth provider for user
        const [provider] = await db
            .select()
            .from(oauthProviders)
            .where(
                and(
                    eq(oauthProviders.userId, userId),
                    eq(oauthProviders.provider, "microsoft")
                )
            )
            .limit(1);

        if (!provider?.refreshToken) {
            console.error("[Graph Email] No refresh token found for user");
            return null;
        }

        // Get OAuth settings
        const [settings] = await db
            .select()
            .from(oauthSettings)
            .where(eq(oauthSettings.provider, "microsoft"))
            .limit(1);

        if (!settings) {
            console.error("[Graph Email] No Microsoft OAuth settings found");
            return null;
        }

        // Refresh the token
        const tokenUrl = `https://login.microsoftonline.com/${settings.tenantId}/oauth2/v2.0/token`;
        const response = await fetch(tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: settings.clientId,
                client_secret: settings.clientSecret,
                refresh_token: provider.refreshToken,
                grant_type: "refresh_token",
                scope: "openid profile email Mail.Send offline_access",
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[Graph Email] Token refresh failed:", error);
            return null;
        }

        const tokens = await response.json();

        // Update stored tokens
        await db
            .update(oauthProviders)
            .set({
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || provider.refreshToken,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            })
            .where(eq(oauthProviders.id, provider.id));

        console.log("[Graph Email] Token refreshed successfully");
        return tokens.access_token;
    } catch (error) {
        console.error("[Graph Email] Error refreshing token:", error);
        return null;
    }
}

/**
 * Get a valid access token for the user
 */
async function getAccessToken(userId: number): Promise<string | null> {
    try {
        const db = await getDb();
        if (!db) return null;

        const [provider] = await db
            .select()
            .from(oauthProviders)
            .where(
                and(
                    eq(oauthProviders.userId, userId),
                    eq(oauthProviders.provider, "microsoft")
                )
            )
            .limit(1);

        if (!provider) {
            console.error("[Graph Email] No Microsoft OAuth provider found for user");
            return null;
        }

        // Check if token is expired (with 5 min buffer)
        const now = new Date();
        const expiresAt = provider.expiresAt ? new Date(provider.expiresAt) : null;
        const isExpired = !expiresAt || expiresAt.getTime() - 5 * 60 * 1000 < now.getTime();

        if (isExpired) {
            console.log("[Graph Email] Token expired, refreshing...");
            return refreshAccessToken(userId);
        }

        return provider.accessToken;
    } catch (error) {
        console.error("[Graph Email] Error getting access token:", error);
        return null;
    }
}

export interface GraphEmailOptions {
    userId: number; // User ID to send email as
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
    cc?: string | string[];
    bcc?: string | string[];
}

/**
 * Send an email using Microsoft Graph API
 */
export async function sendEmailViaGraph(options: GraphEmailOptions): Promise<boolean> {
    console.log("[Graph Email] Attempting to send email via Microsoft Graph:", {
        to: options.to,
        subject: options.subject,
    });

    try {
        const accessToken = await getAccessToken(options.userId);
        if (!accessToken) {
            console.error("[Graph Email] No access token available");
            return false;
        }

        // Convert recipients to Graph format
        const toArray = Array.isArray(options.to) ? options.to : [options.to];
        const toRecipients = toArray.map((email) => ({
            emailAddress: { address: email },
        }));

        const message: GraphEmailMessage = {
            subject: options.subject,
            body: {
                contentType: "HTML",
                content: options.html,
            },
            toRecipients,
        };

        // Add CC recipients if provided
        if (options.cc) {
            const ccArray = Array.isArray(options.cc) ? options.cc : [options.cc];
            message.ccRecipients = ccArray.map((email) => ({
                emailAddress: { address: email },
            }));
        }

        // Add BCC recipients if provided
        if (options.bcc) {
            const bccArray = Array.isArray(options.bcc) ? options.bcc : [options.bcc];
            message.bccRecipients = bccArray.map((email) => ({
                emailAddress: { address: email },
            }));
        }

        const requestBody: SendMailRequest = {
            message,
            saveToSentItems: true,
        };

        // Send email via Graph API
        const response = await fetch(`${GRAPH_API_BASE}/me/sendMail`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[Graph Email] ❌ Failed to send email:", response.status, error);

            // If unauthorized, try refreshing token and retry once
            if (response.status === 401) {
                console.log("[Graph Email] Token might be invalid, refreshing and retrying...");
                const newToken = await refreshAccessToken(options.userId);
                if (newToken) {
                    const retryResponse = await fetch(`${GRAPH_API_BASE}/me/sendMail`, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${newToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(requestBody),
                    });

                    if (retryResponse.ok) {
                        console.log("[Graph Email] ✅ Email sent successfully on retry!");
                        return true;
                    }
                }
            }

            return false;
        }

        console.log("[Graph Email] ✅ Email sent successfully!");
        return true;
    } catch (error) {
        console.error("[Graph Email] ❌ Error sending email:", error);
        return false;
    }
}

/**
 * Check if Microsoft Graph email is available for a user
 */
export async function isGraphEmailAvailable(userId: number): Promise<boolean> {
    try {
        const db = await getDb();
        if (!db) return false;

        const [provider] = await db
            .select()
            .from(oauthProviders)
            .where(
                and(
                    eq(oauthProviders.userId, userId),
                    eq(oauthProviders.provider, "microsoft")
                )
            )
            .limit(1);

        return !!(provider?.accessToken && provider?.refreshToken);
    } catch {
        return false;
    }
}
