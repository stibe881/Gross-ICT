import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  newsletterActivity,
  newsletterStats,
  newsletterCampaigns,
  newsletterSubscribers,
} from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Newsletter Tracking Router
 * Handles email open and click tracking
 */

export const newsletterTrackingRouter = router({
  /**
   * Track email open (pixel tracking)
   * Returns a 1x1 transparent GIF
   */
  trackOpen: publicProcedure
    .input(
      z.object({
        campaignId: z.number(),
        subscriberId: z.number(),
        token: z.string().optional(), // Security token to prevent spam
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Verify campaign and subscriber exist
        const [campaign] = await db
          .select()
          .from(newsletterCampaigns)
          .where(eq(newsletterCampaigns.id, input.campaignId))
          .limit(1);

        const [subscriber] = await db
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.id, input.subscriberId))
          .limit(1);

        if (!campaign || !subscriber) {
          return { success: false };
        }

        // Check if already tracked (unique opens)
        const [existingOpen] = await db
          .select()
          .from(newsletterActivity)
          .where(
            and(
              eq(newsletterActivity.campaignId, input.campaignId),
              eq(newsletterActivity.subscriberId, input.subscriberId),
              eq(newsletterActivity.activityType, "opened")
            )
          )
          .limit(1);

        const isUniqueOpen = !existingOpen;

        // Log activity
        await db.insert(newsletterActivity).values({
          campaignId: input.campaignId,
          subscriberId: input.subscriberId,
          activityType: "opened",
        });

        // Update statistics
        const [stats] = await db
          .select()
          .from(newsletterStats)
          .where(eq(newsletterStats.campaignId, input.campaignId))
          .limit(1);

        if (stats) {
          const totalOpened = stats.totalOpened + 1;
          const uniqueOpens = isUniqueOpen ? stats.uniqueOpens + 1 : stats.uniqueOpens;
          const openRate = Math.round((uniqueOpens / stats.totalSent) * 10000); // Percentage * 100

          await db
            .update(newsletterStats)
            .set({
              totalOpened,
              uniqueOpens,
              openRate,
              lastUpdated: new Date(),
            })
            .where(eq(newsletterStats.id, stats.id));
        } else {
          // Create stats if they don't exist
          await db.insert(newsletterStats).values({
            campaignId: input.campaignId,
            totalSent: 1,
            totalOpened: 1,
            uniqueOpens: 1,
            openRate: 10000, // 100%
          });
        }

        return { success: true };
      } catch (error) {
        console.error("[Newsletter Tracking] Error tracking open:", error);
        return { success: false };
      }
    }),

  /**
   * Track link click
   * Logs the click and returns the original URL for redirect
   */
  trackClick: publicProcedure
    .input(
      z.object({
        campaignId: z.number(),
        subscriberId: z.number(),
        linkUrl: z.string(),
        token: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Verify campaign and subscriber exist
        const [campaign] = await db
          .select()
          .from(newsletterCampaigns)
          .where(eq(newsletterCampaigns.id, input.campaignId))
          .limit(1);

        const [subscriber] = await db
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.id, input.subscriberId))
          .limit(1);

        if (!campaign || !subscriber) {
          return { success: false, redirectUrl: input.linkUrl };
        }

        // Check if already tracked (unique clicks)
        const [existingClick] = await db
          .select()
          .from(newsletterActivity)
          .where(
            and(
              eq(newsletterActivity.campaignId, input.campaignId),
              eq(newsletterActivity.subscriberId, input.subscriberId),
              eq(newsletterActivity.activityType, "clicked"),
              eq(newsletterActivity.linkUrl, input.linkUrl)
            )
          )
          .limit(1);

        const isUniqueClick = !existingClick;

        // Log activity
        await db.insert(newsletterActivity).values({
          campaignId: input.campaignId,
          subscriberId: input.subscriberId,
          activityType: "clicked",
          linkUrl: input.linkUrl,
        });

        // Update statistics
        const [stats] = await db
          .select()
          .from(newsletterStats)
          .where(eq(newsletterStats.campaignId, input.campaignId))
          .limit(1);

        if (stats) {
          const totalClicked = stats.totalClicked + 1;
          const uniqueClicks = isUniqueClick ? stats.uniqueClicks + 1 : stats.uniqueClicks;
          const clickRate = Math.round((uniqueClicks / stats.totalSent) * 10000);

          await db
            .update(newsletterStats)
            .set({
              totalClicked,
              uniqueClicks,
              clickRate,
              lastUpdated: new Date(),
            })
            .where(eq(newsletterStats.id, stats.id));
        } else {
          // Create stats if they don't exist
          await db.insert(newsletterStats).values({
            campaignId: input.campaignId,
            totalSent: 1,
            totalClicked: 1,
            uniqueClicks: 1,
            clickRate: 10000,
          });
        }

        return { success: true, redirectUrl: input.linkUrl };
      } catch (error) {
        console.error("[Newsletter Tracking] Error tracking click:", error);
        return { success: false, redirectUrl: input.linkUrl };
      }
    }),

  /**
   * Track bounce
   * Called when an email bounces
   */
  trackBounce: publicProcedure
    .input(
      z.object({
        campaignId: z.number(),
        subscriberId: z.number(),
        bounceType: z.enum(["hard", "soft"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      try {
        // Log activity
        await db.insert(newsletterActivity).values({
          campaignId: input.campaignId,
          subscriberId: input.subscriberId,
          activityType: "bounced",
        });

        // Update statistics
        const [stats] = await db
          .select()
          .from(newsletterStats)
          .where(eq(newsletterStats.campaignId, input.campaignId))
          .limit(1);

        if (stats) {
          const totalBounced = stats.totalBounced + 1;
          const bounceRate = Math.round((totalBounced / stats.totalSent) * 10000);

          await db
            .update(newsletterStats)
            .set({
              totalBounced,
              bounceRate,
              lastUpdated: new Date(),
            })
            .where(eq(newsletterStats.id, stats.id));
        }

        // If hard bounce, mark subscriber as bounced
        if (input.bounceType === "hard") {
          await db
            .update(newsletterSubscribers)
            .set({
              status: "bounced",
              updatedAt: new Date(),
            })
            .where(eq(newsletterSubscribers.id, input.subscriberId));
        }

        return { success: true };
      } catch (error) {
        console.error("[Newsletter Tracking] Error tracking bounce:", error);
        return { success: false };
      }
    }),

  /**
   * Get campaign statistics
   */
  getCampaignStats: publicProcedure
    .input(z.object({ campaignId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [stats] = await db
        .select()
        .from(newsletterStats)
        .where(eq(newsletterStats.campaignId, input.campaignId))
        .limit(1);

      if (!stats) {
        return null;
      }

      return {
        ...stats,
        openRate: stats.openRate / 100, // Convert back to percentage
        clickRate: stats.clickRate / 100,
        bounceRate: stats.bounceRate / 100,
        unsubscribeRate: stats.unsubscribeRate / 100,
      };
    }),
});
