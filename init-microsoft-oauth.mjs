import { initializeMicrosoftOAuthSettings } from "./server/microsoftOAuthService.ts";

// Microsoft OAuth credentials
const MICROSOFT_CLIENT_ID = "fd167257-55cc-4a95-accc-fabd1f111928";
const MICROSOFT_CLIENT_SECRET = "U3h8Q~nQX.0Qwuv3hU6gvuYoPwp-Zt03WsN6QaSS";
const MICROSOFT_TENANT_ID = "158a61ec-c8ba-43e2-8e2f-37356aca89c7";
const REDIRECT_URI = "https://gross-ict.ch/auth/microsoft/callback";

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
