import {
  processAutomationExecutions,
  triggerBirthdayAutomations,
  triggerReEngagementAutomations,
} from "./newsletterWorkflowEngine";

/**
 * Newsletter Automation Background Job
 * Runs periodically to process automation workflows
 */

let isRunning = false;

export async function runAutomationJob(): Promise<void> {
  if (isRunning) {
    console.log("[Automation Job] Already running, skipping this cycle");
    return;
  }

  isRunning = true;
  const startTime = Date.now();

  try {
    console.log("[Automation Job] Starting automation processing...");

    // Process pending automation executions
    await processAutomationExecutions();

    // Check for birthday triggers (run once per day)
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() < 5) {
      // Run at 9 AM
      console.log("[Automation Job] Checking birthday automations...");
      await triggerBirthdayAutomations();
    }

    // Check for re-engagement triggers (run once per day)
    if (now.getHours() === 10 && now.getMinutes() < 5) {
      // Run at 10 AM
      console.log("[Automation Job] Checking re-engagement automations...");
      await triggerReEngagementAutomations();
    }

    const duration = Date.now() - startTime;
    console.log(`[Automation Job] Completed in ${duration}ms`);
  } catch (error) {
    console.error("[Automation Job] Error:", error);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the automation job scheduler
 */
export function startAutomationScheduler(): void {
  console.log("[Automation Job] Starting scheduler (runs every 5 minutes)");

  // Run immediately on startup
  runAutomationJob();

  // Then run every 5 minutes
  setInterval(runAutomationJob, 5 * 60 * 1000);
}
