import { getDb } from "../db";
import {
  newsletterAutomations,
  newsletterAutomationSteps,
  newsletterAutomationExecutions,
  newsletterAutomationStepLogs,
  newsletterSubscribers,
  newsletterSegments,
} from "../../drizzle/schema";
import { eq, and, lt, lte, sql } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Newsletter Workflow Engine
 * Processes automation workflows and sends scheduled emails
 */

interface TriggerContext {
  subscriberId: number;
  triggerType: string;
  triggerData?: any;
}

/**
 * Start a new automation workflow for a subscriber
 */
export async function startAutomationWorkflow(
  automationId: number,
  subscriberId: number,
  triggerData?: any
): Promise<number | null> {
  const db = await getDb();
  if (!db) {
    console.error("[Workflow Engine] Database not available");
    return null;
  }

  try {
    // Check if automation is active
    const [automation] = await db
      .select()
      .from(newsletterAutomations)
      .where(eq(newsletterAutomations.id, automationId));

    if (!automation || automation.status !== "active") {
      console.log(
        `[Workflow Engine] Automation ${automationId} is not active, skipping`
      );
      return null;
    }

    // Check if subscriber is in segment (if specified)
    if (automation.segmentId) {
      const [segment] = await db
        .select()
        .from(newsletterSegments)
        .where(eq(newsletterSegments.id, automation.segmentId));

      if (segment) {
        const criteria = segment.criteria
          ? JSON.parse(segment.criteria as string)
          : {};
        const matchesSegment = await checkSubscriberMatchesSegment(
          subscriberId,
          criteria
        );

        if (!matchesSegment) {
          console.log(
            `[Workflow Engine] Subscriber ${subscriberId} does not match segment ${automation.segmentId}`
          );
          return null;
        }
      }
    }

    // Get first step
    const [firstStep] = await db
      .select()
      .from(newsletterAutomationSteps)
      .where(eq(newsletterAutomationSteps.automationId, automationId))
      .orderBy(newsletterAutomationSteps.stepOrder)
      .limit(1);

    if (!firstStep) {
      console.error(
        `[Workflow Engine] No steps found for automation ${automationId}`
      );
      return null;
    }

    // Calculate next step execution time
    const nextStepAt = calculateNextStepTime(
      firstStep.delayValue,
      firstStep.delayUnit
    );

    // Create execution record
    const [result] = await db.insert(newsletterAutomationExecutions).values({
      automationId,
      subscriberId,
      currentStepId: firstStep.id,
      status: "pending",
      nextStepAt,
    });

    console.log(
      `[Workflow Engine] Started automation ${automationId} for subscriber ${subscriberId}, execution ${result.insertId}`
    );

    return result.insertId;
  } catch (error) {
    console.error("[Workflow Engine] Error starting automation:", error);
    return null;
  }
}

/**
 * Process pending automation executions
 */
export async function processAutomationExecutions(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Workflow Engine] Database not available");
    return;
  }

  try {
    const now = new Date();

    // Get pending executions that are due
    const dueExecutions = await db
      .select()
      .from(newsletterAutomationExecutions)
      .where(
        and(
          eq(newsletterAutomationExecutions.status, "pending"),
          lte(newsletterAutomationExecutions.nextStepAt, now)
        )
      )
      .limit(50); // Process in batches

    console.log(
      `[Workflow Engine] Found ${dueExecutions.length} due executions`
    );

    for (const execution of dueExecutions) {
      await processExecution(execution);
    }
  } catch (error) {
    console.error("[Workflow Engine] Error processing executions:", error);
  }
}

/**
 * Process a single execution
 */
async function processExecution(execution: any): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Update status to in_progress
    await db
      .update(newsletterAutomationExecutions)
      .set({ status: "in_progress" })
      .where(eq(newsletterAutomationExecutions.id, execution.id));

    // Get current step
    const [step] = await db
      .select()
      .from(newsletterAutomationSteps)
      .where(eq(newsletterAutomationSteps.id, execution.currentStepId));

    if (!step) {
      console.error(
        `[Workflow Engine] Step ${execution.currentStepId} not found`
      );
      await db
        .update(newsletterAutomationExecutions)
        .set({ status: "failed" })
        .where(eq(newsletterAutomationExecutions.id, execution.id));
      return;
    }

    // Get subscriber
    const [subscriber] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, execution.subscriberId));

    if (!subscriber || subscriber.status !== "active") {
      console.log(
        `[Workflow Engine] Subscriber ${execution.subscriberId} is not active, skipping`
      );
      await db
        .update(newsletterAutomationExecutions)
        .set({ status: "completed" })
        .where(eq(newsletterAutomationExecutions.id, execution.id));
      return;
    }

    // Send email
    const emailSent = await sendAutomationEmail(subscriber, step);

    // Log step execution
    await db.insert(newsletterAutomationStepLogs).values({
      executionId: execution.id,
      stepId: step.id,
      status: emailSent ? "sent" : "failed",
      sentAt: emailSent ? new Date() : null,
      errorMessage: emailSent ? null : "Failed to send email",
    });

    if (!emailSent) {
      await db
        .update(newsletterAutomationExecutions)
        .set({ status: "failed" })
        .where(eq(newsletterAutomationExecutions.id, execution.id));
      return;
    }

    // Get next step
    const [nextStep] = await db
      .select()
      .from(newsletterAutomationSteps)
      .where(
        and(
          eq(newsletterAutomationSteps.automationId, step.automationId),
          sql`${newsletterAutomationSteps.stepOrder} > ${step.stepOrder}`
        )
      )
      .orderBy(newsletterAutomationSteps.stepOrder)
      .limit(1);

    if (nextStep) {
      // Schedule next step
      const nextStepAt = calculateNextStepTime(
        nextStep.delayValue,
        nextStep.delayUnit
      );

      await db
        .update(newsletterAutomationExecutions)
        .set({
          currentStepId: nextStep.id,
          status: "pending",
          nextStepAt,
        })
        .where(eq(newsletterAutomationExecutions.id, execution.id));

      console.log(
        `[Workflow Engine] Scheduled next step ${nextStep.id} for execution ${execution.id} at ${nextStepAt}`
      );
    } else {
      // No more steps, mark as completed
      await db
        .update(newsletterAutomationExecutions)
        .set({
          status: "completed",
          completedAt: new Date(),
        })
        .where(eq(newsletterAutomationExecutions.id, execution.id));

      console.log(
        `[Workflow Engine] Completed execution ${execution.id} for automation ${step.automationId}`
      );
    }
  } catch (error) {
    console.error(
      `[Workflow Engine] Error processing execution ${execution.id}:`,
      error
    );
    await db
      .update(newsletterAutomationExecutions)
      .set({ status: "failed" })
      .where(eq(newsletterAutomationExecutions.id, execution.id));
  }
}

/**
 * Send automation email to subscriber
 */
async function sendAutomationEmail(
  subscriber: any,
  step: any
): Promise<boolean> {
  try {
    const personalizedContent = personalizeContent(step.htmlContent, subscriber);
    const personalizedSubject = personalizeContent(step.subject, subscriber);

    await sendEmail({
      to: subscriber.email,
      subject: personalizedSubject,
      html: personalizedContent,
    });

    console.log(
      `[Workflow Engine] Sent email to ${subscriber.email} for step ${step.id}`
    );
    return true;
  } catch (error) {
    console.error(
      `[Workflow Engine] Failed to send email to ${subscriber.email}:`,
      error
    );
    return false;
  }
}

/**
 * Personalize email content with subscriber data
 */
function personalizeContent(content: string, subscriber: any): string {
  let personalized = content;

  // Replace placeholders
  personalized = personalized.replace(
    /\{\{firstName\}\}/g,
    subscriber.firstName || ""
  );
  personalized = personalized.replace(
    /\{\{lastName\}\}/g,
    subscriber.lastName || ""
  );
  personalized = personalized.replace(/\{\{email\}\}/g, subscriber.email || "");
  personalized = personalized.replace(
    /\{\{fullName\}\}/g,
    `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim() ||
      subscriber.email
  );

  return personalized;
}

/**
 * Calculate next step execution time based on delay
 */
function calculateNextStepTime(delayValue: number, delayUnit: string): Date {
  const now = new Date();
  let milliseconds = 0;

  switch (delayUnit) {
    case "minutes":
      milliseconds = delayValue * 60 * 1000;
      break;
    case "hours":
      milliseconds = delayValue * 60 * 60 * 1000;
      break;
    case "days":
      milliseconds = delayValue * 24 * 60 * 60 * 1000;
      break;
    default:
      milliseconds = 0;
  }

  return new Date(now.getTime() + milliseconds);
}

/**
 * Check if subscriber matches segment criteria
 */
async function checkSubscriberMatchesSegment(
  subscriberId: number,
  criteria: any
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const [subscriber] = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.id, subscriberId));

    if (!subscriber) return false;

    // Check status
    if (criteria.status && subscriber.status !== criteria.status) {
      return false;
    }

    // Check tags
    if (criteria.tags && criteria.tags.length > 0) {
      const subscriberTags = subscriber.tags
        ? JSON.parse(subscriber.tags as string)
        : [];
      const hasAllTags = criteria.tags.every((tag: string) =>
        subscriberTags.includes(tag)
      );
      if (!hasAllTags) return false;
    }

    // Check date range
    if (criteria.subscribedAfter) {
      const subscribedDate = new Date(subscriber.subscribedAt);
      const afterDate = new Date(criteria.subscribedAfter);
      if (subscribedDate < afterDate) return false;
    }

    if (criteria.subscribedBefore) {
      const subscribedDate = new Date(subscriber.subscribedAt);
      const beforeDate = new Date(criteria.subscribedBefore);
      if (subscribedDate > beforeDate) return false;
    }

    return true;
  } catch (error) {
    console.error("[Workflow Engine] Error checking segment match:", error);
    return false;
  }
}

/**
 * Trigger automation for new subscriber (Welcome email)
 */
export async function triggerWelcomeAutomation(
  subscriberId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Find active welcome automations
    const welcomeAutomations = await db
      .select()
      .from(newsletterAutomations)
      .where(
        and(
          eq(newsletterAutomations.triggerType, "welcome"),
          eq(newsletterAutomations.status, "active")
        )
      );

    for (const automation of welcomeAutomations) {
      await startAutomationWorkflow(automation.id, subscriberId);
    }
  } catch (error) {
    console.error("[Workflow Engine] Error triggering welcome automation:", error);
  }
}

/**
 * Trigger automation for subscriber birthday
 */
export async function triggerBirthdayAutomations(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    // Find active birthday automations
    const birthdayAutomations = await db
      .select()
      .from(newsletterAutomations)
      .where(
        and(
          eq(newsletterAutomations.triggerType, "birthday"),
          eq(newsletterAutomations.status, "active")
        )
      );

    if (birthdayAutomations.length === 0) return;

    // Find subscribers with birthday today
    const subscribers = await db
      .select()
      .from(newsletterSubscribers)
      .where(
        and(
          eq(newsletterSubscribers.status, "active"),
          sql`MONTH(${newsletterSubscribers.dateOfBirth}) = ${month}`,
          sql`DAY(${newsletterSubscribers.dateOfBirth}) = ${day}`
        )
      );

    console.log(
      `[Workflow Engine] Found ${subscribers.length} subscribers with birthday today`
    );

    for (const subscriber of subscribers) {
      for (const automation of birthdayAutomations) {
        await startAutomationWorkflow(automation.id, subscriber.id);
      }
    }
  } catch (error) {
    console.error("[Workflow Engine] Error triggering birthday automations:", error);
  }
}

/**
 * Trigger re-engagement automations for inactive subscribers
 */
export async function triggerReEngagementAutomations(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    // Find active re-engagement automations
    const reEngagementAutomations = await db
      .select()
      .from(newsletterAutomations)
      .where(
        and(
          eq(newsletterAutomations.triggerType, "re_engagement"),
          eq(newsletterAutomations.status, "active")
        )
      );

    if (reEngagementAutomations.length === 0) return;

    // Find inactive subscribers (no activity in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const inactiveSubscribers = await db
      .select()
      .from(newsletterSubscribers)
      .where(
        and(
          eq(newsletterSubscribers.status, "active"),
          lt(newsletterSubscribers.lastActivityAt, thirtyDaysAgo)
        )
      )
      .limit(100); // Process in batches

    console.log(
      `[Workflow Engine] Found ${inactiveSubscribers.length} inactive subscribers`
    );

    for (const subscriber of inactiveSubscribers) {
      for (const automation of reEngagementAutomations) {
        // Check if already in this automation
        const [existing] = await db
          .select()
          .from(newsletterAutomationExecutions)
          .where(
            and(
              eq(newsletterAutomationExecutions.automationId, automation.id),
              eq(newsletterAutomationExecutions.subscriberId, subscriber.id),
              sql`${newsletterAutomationExecutions.status} IN ('pending', 'in_progress')`
            )
          );

        if (!existing) {
          await startAutomationWorkflow(automation.id, subscriber.id);
        }
      }
    }
  } catch (error) {
    console.error(
      "[Workflow Engine] Error triggering re-engagement automations:",
      error
    );
  }
}
