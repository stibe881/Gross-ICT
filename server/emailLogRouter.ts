import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { emailLogs } from "../drizzle/schema";
import { eq, and, like, desc, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Email Log Router
 * Provides endpoints for viewing and managing email delivery logs
 */

export const emailLogRouter = router({
  /**
   * Get email logs with filtering and pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.enum(["pending", "sent", "failed"]).optional(),
        templateName: z.string().optional(),
        recipientEmail: z.string().optional(),
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        entityType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Build filter conditions
      const conditions = [];

      if (input.status) {
        conditions.push(eq(emailLogs.status, input.status));
      }

      if (input.templateName) {
        conditions.push(like(emailLogs.templateName, `%${input.templateName}%`));
      }

      if (input.recipientEmail) {
        conditions.push(like(emailLogs.recipientEmail, `%${input.recipientEmail}%`));
      }

      if (input.startDate) {
        conditions.push(gte(emailLogs.createdAt, new Date(input.startDate)));
      }

      if (input.endDate) {
        conditions.push(lte(emailLogs.createdAt, new Date(input.endDate)));
      }

      if (input.entityType) {
        conditions.push(eq(emailLogs.entityType, input.entityType));
      }

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(emailLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const totalCount = Number(countResult?.count || 0);

      // Get paginated results
      const offset = (input.page - 1) * input.pageSize;
      const logs = await db
        .select()
        .from(emailLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(emailLogs.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return {
        logs,
        pagination: {
          page: input.page,
          pageSize: input.pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / input.pageSize),
        },
      };
    }),

  /**
   * Get email log statistics
   */
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    // Get overall stats
    const [totalResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs);

    const [sentResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(eq(emailLogs.status, "sent"));

    const [failedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(eq(emailLogs.status, "failed"));

    const [pendingResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(emailLogs)
      .where(eq(emailLogs.status, "pending"));

    const totalCount = Number(totalResult?.count || 0);
    const sentCount = Number(sentResult?.count || 0);
    const failedCount = Number(failedResult?.count || 0);
    const pendingCount = Number(pendingResult?.count || 0);

    const successRate = totalCount > 0 ? (sentCount / totalCount) * 100 : 0;

    // Get stats by template
    const templateStats = await db
      .select({
        templateName: emailLogs.templateName,
        total: sql<number>`count(*)`,
        sent: sql<number>`sum(case when ${emailLogs.status} = 'sent' then 1 else 0 end)`,
        failed: sql<number>`sum(case when ${emailLogs.status} = 'failed' then 1 else 0 end)`,
      })
      .from(emailLogs)
      .where(sql`${emailLogs.templateName} IS NOT NULL`)
      .groupBy(emailLogs.templateName);

    // Get recent failed emails
    const recentFailed = await db
      .select()
      .from(emailLogs)
      .where(eq(emailLogs.status, "failed"))
      .orderBy(desc(emailLogs.createdAt))
      .limit(10);

    return {
      overall: {
        total: totalCount,
        sent: sentCount,
        failed: failedCount,
        pending: pendingCount,
        successRate: Math.round(successRate * 10) / 10,
      },
      byTemplate: templateStats.map((stat) => ({
        templateName: stat.templateName || "Unknown",
        total: Number(stat.total),
        sent: Number(stat.sent),
        failed: Number(stat.failed),
        successRate:
          Number(stat.total) > 0
            ? Math.round((Number(stat.sent) / Number(stat.total)) * 1000) / 10
            : 0,
      })),
      recentFailed,
    };
  }),

  /**
   * Get single email log by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [log] = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.id, input.id))
        .limit(1);

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email log not found",
        });
      }

      return log;
    }),

  /**
   * Retry failed email
   */
  retry: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [log] = await db
        .select()
        .from(emailLogs)
        .where(eq(emailLogs.id, input.id))
        .limit(1);

      if (!log) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Email log not found",
        });
      }

      if (log.status !== "failed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only retry failed emails",
        });
      }

      // Import sendEmail dynamically to avoid circular dependency
      const { sendEmail } = await import("./_core/emailService");

      // Attempt to resend
      const success = await sendEmail({
        to: log.recipientEmail,
        subject: log.subject,
        html: log.body,
        templateId: log.templateId || undefined,
        templateName: log.templateName || undefined,
        recipientName: log.recipientName || undefined,
        entityType: log.entityType || undefined,
        entityId: log.entityId || undefined,
      });

      // Update retry count
      await db
        .update(emailLogs)
        .set({
          retryCount: (log.retryCount || 0) + 1,
          lastRetryAt: new Date(),
        })
        .where(eq(emailLogs.id, input.id));

      return {
        success,
        message: success ? "Email resent successfully" : "Failed to resend email",
      };
    }),

  /**
   * Delete email log (admin only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      await db.delete(emailLogs).where(eq(emailLogs.id, input.id));

      return { success: true };
    }),
});
