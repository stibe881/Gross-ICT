import { initializeMicrosoftOAuthSettings } from "./server/microsoftOAuthService.ts";

// Microsoft OAuth credentials
// IMPORTANT: Replace these with your actual values from Azure AD App Registration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID || "YOUR_CLIENT_ID_HERE";
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET || "YOUR_CLIENT_SECRET_HERE";
const MICROSOFT_TENANT_ID = process.env.MICROSOFT_TENANT_ID || "YOUR_TENANT_ID_HERE";
const REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI || "https://your-domain.com/auth/microsoft/callback";

async function init() {
  try {
    console.log("[Init] Initializing Microsoft OAuth settings...");
    
    await initializeMicrosoftOAuthSettings(
      MICROSOFT_CLIENT_ID,
      MICROSOFT_CLIENT_SECRET,
      MICROSOFT_TENANT_ID,
      REDIRECT_URI
    );
    
    console.log("[Init] ✅ Microsoft OAuth settings initialized successfully!");
    console.log("[Init] Users can now log in with Microsoft accounts.");
    process.exit(0);
  } catch (error) {
    console.error("[Init] ❌ Failed to initialize Microsoft OAuth settings:", error);
    process.exit(1);
  }
}

init();
