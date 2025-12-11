import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  newsletterSubscribers,
  newsletterCampaigns,
  newsletterTemplates,
  newsletterSegments,
  newsletterStats,
  newsletterActivity,
} from "../drizzle/schema";
import { eq, and, like, desc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendEmail } from "./_core/emailService";

/**
 * Newsletter Router
 * Comprehensive newsletter management system
 */

export const newsletterRouter = router({
  // ============ SUBSCRIBERS ============

  /**
   * Get all subscribers with filtering and pagination
   */
  subscribers: router({
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(20),
          status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
          search: z.string().optional(),
          tags: z.array(z.string()).optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        // Check role
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied. Admin or Marketing role required.",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const conditions = [];

        if (input.status) {
          conditions.push(eq(newsletterSubscribers.status, input.status));
        }

        if (input.search) {
          conditions.push(
            sql`(${newsletterSubscribers.email} LIKE ${`%${input.search}%`} OR ${newsletterSubscribers.firstName} LIKE ${`%${input.search}%`} OR ${newsletterSubscribers.lastName} LIKE ${`%${input.search}%`})`
          );
        }

        // Get total count
        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(newsletterSubscribers)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const totalCount = Number(countResult?.count || 0);

        // Get paginated results
        const offset = (input.page - 1) * input.pageSize;
        const subscribers = await db
          .select()
          .from(newsletterSubscribers)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(newsletterSubscribers.subscribedAt))
          .limit(input.pageSize)
          .offset(offset);

        return {
          subscribers,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / input.pageSize),
          },
        };
      }),

    /**
     * Add new subscriber
     */
    create: protectedProcedure
      .input(
        z.object({
          email: z.string().email(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          tags: z.array(z.string()).optional(),
          source: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Check if subscriber already exists
        const [existing] = await db
          .select()
          .from(newsletterSubscribers)
          .where(eq(newsletterSubscribers.email, input.email))
          .limit(1);

        if (existing) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Subscriber already exists",
          });
        }

        const [result] = await db.insert(newsletterSubscribers).values({
          email: input.email,
          firstName: input.firstName || null,
          lastName: input.lastName || null,
          tags: input.tags ? JSON.stringify(input.tags) : null,
          source: input.source || "manual",
          status: "active",
        });

        return { success: true, id: result.insertId };
      }),

    /**
     * Update subscriber
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          tags: z.array(z.string()).optional(),
          status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const updateData: any = {};
        if (input.firstName !== undefined) updateData.firstName = input.firstName;
        if (input.lastName !== undefined) updateData.lastName = input.lastName;
        if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);
        if (input.status !== undefined) {
          updateData.status = input.status;
          if (input.status === "unsubscribed") {
            updateData.unsubscribedAt = new Date();
          }
        }

        await db
          .update(newsletterSubscribers)
          .set(updateData)
          .where(eq(newsletterSubscribers.id, input.id));

        return { success: true };
      }),

    /**
     * Bulk import subscribers from CSV
     */
    bulkImport: protectedProcedure
      .input(
        z.object({
          subscribers: z.array(
            z.object({
              email: z.string().email(),
              firstName: z.string().optional(),
              lastName: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        let imported = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const subscriber of input.subscribers) {
          try {
            // Check if subscriber already exists
            const [existing] = await db
              .select()
              .from(newsletterSubscribers)
              .where(eq(newsletterSubscribers.email, subscriber.email))
              .limit(1);

            if (existing) {
              skipped++;
              continue;
            }

            // Insert new subscriber
            await db.insert(newsletterSubscribers).values({
              email: subscriber.email,
              firstName: subscriber.firstName || null,
              lastName: subscriber.lastName || null,
              source: "csv_import",
              status: "active",
            });

            imported++;
          } catch (error: any) {
            errors.push(`${subscriber.email}: ${error.message}`);
          }
        }

        return {
          success: true,
          imported,
          skipped,
          errors,
          total: input.subscribers.length,
        };
      }),

    /**
     * Delete subscriber
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await db
          .delete(newsletterSubscribers)
          .where(eq(newsletterSubscribers.id, input.id));

        return { success: true };
      }),

    /**
     * Get subscriber statistics
     */
    stats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers);

      const [activeResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.status, "active"));

      const [unsubscribedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.status, "unsubscribed"));

      const [bouncedResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(newsletterSubscribers)
        .where(eq(newsletterSubscribers.status, "bounced"));

      return {
        total: Number(totalResult?.count || 0),
        active: Number(activeResult?.count || 0),
        unsubscribed: Number(unsubscribedResult?.count || 0),
        bounced: Number(bouncedResult?.count || 0),
      };
    }),
  }),

  // ============ CAMPAIGNS ============

  campaigns: router({
    /**
     * Get all campaigns
     */
    list: protectedProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(1).max(100).default(20),
          status: z
            .enum(["draft", "scheduled", "sending", "sent", "paused"])
            .optional(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const conditions = [];
        if (input.status) {
          conditions.push(eq(newsletterCampaigns.status, input.status));
        }

        const [countResult] = await db
          .select({ count: sql<number>`count(*)` })
          .from(newsletterCampaigns)
          .where(conditions.length > 0 ? and(...conditions) : undefined);

        const totalCount = Number(countResult?.count || 0);

        const offset = (input.page - 1) * input.pageSize;
        const campaigns = await db
          .select()
          .from(newsletterCampaigns)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(newsletterCampaigns.createdAt))
          .limit(input.pageSize)
          .offset(offset);

        return {
          campaigns,
          pagination: {
            page: input.page,
            pageSize: input.pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / input.pageSize),
          },
        };
      }),

    /**
     * Create new campaign
     */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          subject: z.string(),
          subjectB: z.string().optional(),
          preheader: z.string().optional(),
          htmlContent: z.string(),
          templateId: z.number().optional(),
          recipientType: z.enum(["all", "segment", "custom"]).default("all"),
          segmentId: z.number().optional(),
          scheduledAt: z.string().optional(),
          abTestEnabled: z.boolean().default(false),
          abTestSplitPercent: z.number().min(10).max(90).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Calculate recipient count
        let recipientCount = 0;
        if (input.recipientType === "all") {
          const [result] = await db
            .select({ count: sql<number>`count(*)` })
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.status, "active"));
          recipientCount = Number(result?.count || 0);
        } else if (input.recipientType === "segment" && input.segmentId) {
          const [segment] = await db
            .select()
            .from(newsletterSegments)
            .where(eq(newsletterSegments.id, input.segmentId))
            .limit(1);
          recipientCount = segment?.subscriberCount || 0;
        }

        const [result] = await db.insert(newsletterCampaigns).values({
          name: input.name,
          subject: input.subject,
          subjectB: input.subjectB || null,
          preheader: input.preheader || null,
          htmlContent: input.htmlContent,
          templateId: input.templateId || null,
          status: "draft",
          recipientType: input.recipientType,
          segmentId: input.segmentId || null,
          recipientCount,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
          abTestEnabled: input.abTestEnabled,
          abTestSplitPercent: input.abTestSplitPercent || 50,
          createdBy: ctx.user.id,
        });

        return { success: true, id: result.insertId };
      }),

    /**
     * Update campaign
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          subject: z.string().optional(),
          subjectB: z.string().optional(),
          preheader: z.string().optional(),
          htmlContent: z.string().optional(),
          status: z
            .enum(["draft", "scheduled", "sending", "sent", "paused"])
            .optional(),
          scheduledAt: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.subject !== undefined) updateData.subject = input.subject;
        if (input.subjectB !== undefined) updateData.subjectB = input.subjectB;
        if (input.preheader !== undefined) updateData.preheader = input.preheader;
        if (input.htmlContent !== undefined)
          updateData.htmlContent = input.htmlContent;
        if (input.status !== undefined) updateData.status = input.status;
        if (input.scheduledAt !== undefined)
          updateData.scheduledAt = new Date(input.scheduledAt);

        await db
          .update(newsletterCampaigns)
          .set(updateData)
          .where(eq(newsletterCampaigns.id, input.id));

        return { success: true };
      }),

    /**
     * Delete campaign
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await db
          .delete(newsletterCampaigns)
          .where(eq(newsletterCampaigns.id, input.id));

        return { success: true };
      }),

    /**
     * Get campaign by ID with stats
     */
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const [campaign] = await db
          .select()
          .from(newsletterCampaigns)
          .where(eq(newsletterCampaigns.id, input.id))
          .limit(1);

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        // Get stats
        const [stats] = await db
          .select()
          .from(newsletterStats)
          .where(eq(newsletterStats.campaignId, input.id))
          .limit(1);

        return {
          campaign,
          stats: stats || null,
        };
      }),

    /**
     * Send test email
     */
    sendTest: protectedProcedure
      .input(
        z.object({
          campaignId: z.number(),
          testEmail: z.string().email(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const [campaign] = await db
          .select()
          .from(newsletterCampaigns)
          .where(eq(newsletterCampaigns.id, input.campaignId))
          .limit(1);

        if (!campaign) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Campaign not found",
          });
        }

        const success = await sendEmail({
          to: input.testEmail,
          subject: `[TEST] ${campaign.subject}`,
          html: campaign.htmlContent,
          entityType: "newsletter_test",
          entityId: campaign.id,
          triggeredBy: ctx.user.id,
        });

        return { success };
      }),
  }),

  // ============ TEMPLATES ============

  templates: router({
    /**
     * Get all templates
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const templates = await db
        .select()
        .from(newsletterTemplates)
        .orderBy(desc(newsletterTemplates.createdAt));

      return templates;
    }),

    /**
     * Create template
     */
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          htmlContent: z.string(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const [result] = await db.insert(newsletterTemplates).values({
          name: input.name,
          description: input.description || null,
          htmlContent: input.htmlContent,
          category: input.category || null,
          isSystem: false,
          createdBy: ctx.user.id,
        });

        return { success: true, id: result.insertId };
      }),

    /**
     * Update template
     */
    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          htmlContent: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const updateData: any = {};
        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined)
          updateData.description = input.description;
        if (input.htmlContent !== undefined)
          updateData.htmlContent = input.htmlContent;
        if (input.category !== undefined) updateData.category = input.category;

        await db
          .update(newsletterTemplates)
          .set(updateData)
          .where(eq(newsletterTemplates.id, input.id));

        return { success: true };
      }),

    /**
     * Delete template
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Access denied",
          });
        }

        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        await db
          .delete(newsletterTemplates)
          .where(eq(newsletterTemplates.id, input.id));

        return { success: true };
      }),
  }),

  // ============ DASHBOARD STATS ============

  // ============ IMPORT/EXPORT ============

  /**
   * Import subscribers from CSV
   */
  importSubscribers: protectedProcedure
    .input(
      z.object({
        subscribers: z.array(
          z.object({
            email: z.string().email(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            tags: z.array(z.string()).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const subscriber of input.subscribers) {
        try {
          // Check if subscriber already exists
          const [existing] = await db
            .select()
            .from(newsletterSubscribers)
            .where(eq(newsletterSubscribers.email, subscriber.email))
            .limit(1);

          if (existing) {
            errors.push(`${subscriber.email}: Already exists`);
            errorCount++;
            continue;
          }

          await db.insert(newsletterSubscribers).values({
            email: subscriber.email,
            firstName: subscriber.firstName || null,
            lastName: subscriber.lastName || null,
            tags: subscriber.tags ? JSON.stringify(subscriber.tags) : null,
            source: "import",
            status: "active",
          });

          successCount++;
        } catch (error) {
          errors.push(`${subscriber.email}: ${error}`);
          errorCount++;
        }
      }

      return {
        success: true,
        successCount,
        errorCount,
        errors,
      };
    }),

  /**
   * Export subscribers to CSV
   */
  exportSubscribers: protectedProcedure
    .input(
      z.object({
        status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const conditions = [];
      if (input.status) {
        conditions.push(eq(newsletterSubscribers.status, input.status));
      }

      const subscribers = await db
        .select()
        .from(newsletterSubscribers)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(newsletterSubscribers.subscribedAt));

      return subscribers;
    }),

  // ============ DASHBOARD STATS ============

  /**
   * Get dashboard overview statistics
   */
  dashboardStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin" && ctx.user.role !== "marketing") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Access denied",
      });
    }

    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    // Total subscribers
    const [subscribersResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.status, "active"));

    // Total campaigns
    const [campaignsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterCampaigns);

    // Sent campaigns
    const [sentResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterCampaigns)
      .where(eq(newsletterCampaigns.status, "sent"));

    // Average open rate
    const [avgOpenRateResult] = await db
      .select({ avg: sql<number>`AVG(openRate)` })
      .from(newsletterStats);

    // Recent campaigns
    const recentCampaigns = await db
      .select()
      .from(newsletterCampaigns)
      .orderBy(desc(newsletterCampaigns.createdAt))
      .limit(5);

    return {
      totalSubscribers: Number(subscribersResult?.count || 0),
      totalCampaigns: Number(campaignsResult?.count || 0),
      sentCampaigns: Number(sentResult?.count || 0),
      avgOpenRate: Number(avgOpenRateResult?.avg || 0) / 100, // Convert back to percentage
      recentCampaigns,
    };
  }),
});
