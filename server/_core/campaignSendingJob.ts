import { getDb } from "../db";
import { newsletterCampaigns, newsletterSubscribers, newsletterActivity } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Campaign Sending Background Job
 * Runs every minute to check for scheduled campaigns and send them
 */
export async function startCampaignSendingJob() {
  console.log("[Campaign Sending Job] Started");
  
  // Run every minute
  setInterval(async () => {
    try {
      await processPendingCampaigns();
    } catch (error) {
      console.error("[Campaign Sending Job] Error:", error);
    }
  }, 60000); // 60 seconds
}

async function processPendingCampaigns() {
  const now = new Date();
  const db = await getDb();
  if (!db) return;
  
  // Find campaigns that are scheduled and due to be sent
  const pendingCampaigns = await db
    .select()
    .from(newsletterCampaigns)
    .where(
      and(
        eq(newsletterCampaigns.status, "scheduled"),
        // @ts-ignore - scheduledAt comparison
        newsletterCampaigns.scheduledAt <= now
      )
    );

  if (pendingCampaigns.length === 0) {
    return;
  }

  console.log(`[Campaign Sending Job] Found ${pendingCampaigns.length} pending campaigns`);

  for (const campaign of pendingCampaigns) {
    try {
      await sendCampaign(campaign);
    } catch (error) {
      console.error(`[Campaign Sending Job] Failed to send campaign ${campaign.id}:`, error);
      
      // Mark campaign as failed
      await db
        .update(newsletterCampaigns)
        .set({
          status: "failed",
          sentAt: new Date(),
        })
        .where(eq(newsletterCampaigns.id, campaign.id));
    }
  }
}

async function sendCampaign(campaign: any) {
  console.log(`[Campaign Sending Job] Sending campaign ${campaign.id}: ${campaign.name}`);
  const db = await getDb();
  if (!db) return;

  // Update status to sending
  await db
    .update(newsletterCampaigns)
    .set({ status: "sending" })
    .where(eq(newsletterCampaigns.id, campaign.id));

  // Get all active subscribers
  const subscribers = await db
    .select()
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "active"));

  console.log(`[Campaign Sending Job] Sending to ${subscribers.length} subscribers`);

  let sent = 0;
  let failed = 0;

  // Send emails in batches with rate limiting
  const batchSize = 10;
  const delayBetweenBatches = 1000; // 1 second

  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (subscriber: any) => {
        try {
          // Generate tracking pixel URL
          const trackingPixelUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || 'http://localhost:3000'}/api/track/open/${campaign.id}/${subscriber.id}`;
          
          // Add tracking pixel to email content
          const contentWithTracking = `
            ${campaign.content}
            <img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />
          `;

          // Send email
          await sendEmail({
            to: subscriber.email,
            subject: campaign.subject,
            html: contentWithTracking,
          });

          // Record activity
          await db.insert(newsletterActivity).values({
            campaignId: campaign.id,
            subscriberId: subscriber.id,
            activityType: "sent",
            createdAt: new Date(),
          });

          sent++;
        } catch (error) {
          console.error(`[Campaign Sending Job] Failed to send to ${subscriber.email}:`, error);
          failed++;
        }
      })
    );

    // Rate limiting delay between batches
    if (i + batchSize < subscribers.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  console.log(`[Campaign Sending Job] Campaign ${campaign.id} sent: ${sent} successful, ${failed} failed`);

  // Update campaign status
  await db
    .update(newsletterCampaigns)
    .set({
      status: "sent",
      sentAt: new Date(),
      recipientCount: sent,
    })
    .where(eq(newsletterCampaigns.id, campaign.id));
}

/**
 * Track email open
 */
export async function trackEmailOpen(campaignId: number, subscriberId: number) {
  try {
    const db = await getDb();
    if (!db) return;
    // Check if already tracked
    const existing = await db
      .select()
      .from(newsletterActivity)
      .where(
        and(
          eq(newsletterActivity.campaignId, campaignId),
          eq(newsletterActivity.subscriberId, subscriberId),
          eq(newsletterActivity.activityType, "opened")
        )
      )
      .limit(1);

    if (existing.length === 0) {
      await db.insert(newsletterActivity).values({
        campaignId,
        subscriberId,
        activityType: "opened",
        createdAt: new Date(),
      });
      console.log(`[Tracking] Email opened: campaign ${campaignId}, subscriber ${subscriberId}`);
    }
  } catch (error) {
    console.error("[Tracking] Error tracking email open:", error);
  }
}

/**
 * Track link click
 */
export async function trackLinkClick(campaignId: number, subscriberId: number, url: string) {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(newsletterActivity).values({
      campaignId,
      subscriberId,
      activityType: "clicked",
      linkUrl: url,
      createdAt: new Date(),
    });
    console.log(`[Tracking] Link clicked: campaign ${campaignId}, subscriber ${subscriberId}, url ${url}`);
  } catch (error) {
    console.error("[Tracking] Error tracking link click:", error);
  }
}
