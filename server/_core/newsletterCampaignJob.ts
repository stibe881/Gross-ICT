import { getDb } from "../db";
import { newsletterCampaigns, newsletterSubscribers } from "../../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendEmail } from "./emailService";

/**
 * Newsletter Campaign Sending Background Job
 * Processes scheduled newsletterCampaigns and sends emails in batches
 */

const BATCH_SIZE = 50; // Send emails in batches to avoid overwhelming SMTP server
const RATE_LIMIT_DELAY = 1000; // 1 second delay between batches

interface CampaignStats {
  sent: number;
  failed: number;
  bounced: number;
}

/**
 * Process a single campaign
 */
async function processCampaign(campaignId: number): Promise<CampaignStats> {
  const db = await getDb();
  if (!db) {
    console.error('[Newsletter Job] Database not available');
    return { sent: 0, failed: 0, bounced: 0 };
  }

  const stats: CampaignStats = { sent: 0, failed: 0, bounced: 0 };

  try {
    // Get campaign details
    const [campaign] = await db
      .select()
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.id, campaignId))
      .limit(1);

    if (!campaign) {
      console.error(`[Newsletter Job] Campaign ${campaignId} not found`);
      return stats;
    }

    // Get active newsletterSubscribers
    const activeSubscribers = await db
      .select()
      .from(newsletterSubscribers)
      .where(
eq(newsletterSubscribers.status, 'active')
      );

    console.log(`[Newsletter Job] Processing campaign ${campaignId}: "${campaign.subject}" to ${activeSubscribers.length} newsletterSubscribers`);

    // Send emails in batches
    for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
      const batch = activeSubscribers.slice(i, i + BATCH_SIZE);
      
      await Promise.all(
        batch.map(async (subscriber) => {
          try {
            // Personalize content
            let personalizedContent = campaign.htmlContent;
            const fullName = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(' ') || 'Valued Customer';
            personalizedContent = personalizedContent.replace(/\{name\}/g, fullName);
            personalizedContent = personalizedContent.replace(/\{email\}/g, subscriber.email);
            
            // Add tracking pixel for opens
            const baseUrl = process.env.FRONTEND_URL || 'https://gross-ict.ch';
            const trackingPixelUrl = `${baseUrl}/api/trpc/newsletterTracking.trackOpen?input=${encodeURIComponent(JSON.stringify({ campaignId: campaign.id, subscriberId: subscriber.id }))}`;
            personalizedContent += `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none" alt="" />`;
            
            // Replace links with tracking links
            personalizedContent = personalizedContent.replace(
              /<a([^>]*?)href="([^"]+)"([^>]*?)>/gi,
              (match, before, url, after) => {
                // Skip if it's already a tracking link or unsubscribe link
                if (url.includes('/api/trpc/newsletterTracking') || url.includes('/newsletter/unsubscribe')) {
                  return match;
                }
                const trackingUrl = `${baseUrl}/api/trpc/newsletterTracking.trackClick?input=${encodeURIComponent(JSON.stringify({ campaignId: campaign.id, subscriberId: subscriber.id, linkUrl: url }))}`;
                return `<a${before}href="${trackingUrl}"${after}>`;
              }
            );
            
            // Add unsubscribe link (using email as token for now)
            const unsubscribeLink = `${baseUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}`;
            personalizedContent += `\n\n<hr><p style="font-size: 12px; color: #6b7280; text-align: center;">Sie erhalten diese E-Mail, weil Sie sich für unseren Newsletter angemeldet haben. <a href="${unsubscribeLink}">Abmelden</a></p>`;

            const success = await sendEmail({
              to: subscriber.email,
              subject: campaign.subject,
              html: personalizedContent,
              templateName: 'Newsletter Campaign',
              recipientName: fullName,
              entityType: 'campaign',
              entityId: campaignId,
            });

            if (success) {
              stats.sent++;
            } else {
              stats.failed++;
            }
          } catch (error) {
            console.error(`[Newsletter Job] Failed to send to ${subscriber.email}:`, error);
            stats.failed++;
          }
        })
      );

      // Rate limiting: wait between batches
      if (i + BATCH_SIZE < activeSubscribers.length) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    // Update campaign status and statistics
    await db
      .update(newsletterCampaigns)
      .set({
        status: 'sent',
        sentAt: new Date(),
        recipientCount: stats.sent,
        updatedAt: new Date(),
      })
      .where(eq(newsletterCampaigns.id, campaignId));

    console.log(`[Newsletter Job] Campaign ${campaignId} completed: ${stats.sent} sent, ${stats.failed} failed`);

  } catch (error) {
    console.error(`[Newsletter Job] Error processing campaign ${campaignId}:`, error);
    
    // Mark campaign as failed
    try {
      await db
        .update(newsletterCampaigns)
        .set({
          status: 'failed',
          updatedAt: new Date(),
        })
        .where(eq(newsletterCampaigns.id, campaignId));
    } catch (updateError) {
      console.error('[Newsletter Job] Failed to update campaign status:', updateError);
    }
  }

  return stats;
}

/**
 * Check for scheduled newsletterCampaigns and process them
 */
export async function checkScheduledCampaigns(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error('[Newsletter Job] Database not available');
    return;
  }

  try {
    const now = new Date();

    // Find newsletterCampaigns that are scheduled and due to be sent
    const scheduledCampaigns = await db
      .select()
      .from(newsletterCampaigns)
      .where(
        and(
          eq(newsletterCampaigns.status, 'scheduled'),
          sql`${newsletterCampaigns.scheduledAt} <= ${now.toISOString()}`
        )
      );

    if (scheduledCampaigns.length === 0) {
      return; // No newsletterCampaigns to process
    }

    console.log(`[Newsletter Job] Found ${scheduledCampaigns.length} scheduled newsletterCampaigns to process`);

    // Process each campaign sequentially to avoid overwhelming the system
    for (const campaign of scheduledCampaigns) {
      // Update status to 'sending' to prevent duplicate processing
      await db
        .update(newsletterCampaigns)
        .set({
          status: 'sending',
          updatedAt: new Date(),
        })
        .where(eq(newsletterCampaigns.id, campaign.id));

      await processCampaign(campaign.id);
    }

  } catch (error) {
    console.error('[Newsletter Job] Error checking scheduled newsletterCampaigns:', error);
  }
}

/**
 * Start the newsletter campaign job
 * Runs every 5 minutes to check for scheduled newsletterCampaigns
 */
export function startNewsletterCampaignJob(): NodeJS.Timeout {
  console.log('[Newsletter Job] Starting newsletter campaign background job');
  
  // Run immediately on start
  checkScheduledCampaigns();
  
  // Then run every 5 minutes
  const interval = setInterval(() => {
    checkScheduledCampaigns();
  }, 5 * 60 * 1000); // 5 minutes

  return interval;
}
