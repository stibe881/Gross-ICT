import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { paymentReminderLog, invoices, customers } from '../drizzle/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';

/**
 * Reminder Log Router
 * Provides endpoints for viewing and analyzing payment reminder history
 */

// Staff procedure (admin, support, accounting)
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'support' && ctx.user.role !== 'accounting') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
});

export const reminderLogRouter = router({
  /**
   * Get all reminder logs with pagination and filtering
   */
  list: staffProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      status: z.enum(['sent', 'failed', 'bounced']).optional(),
      reminderType: z.enum(['1st', '2nd', 'final']).optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const { page, pageSize, status, reminderType, startDate, endDate } = input;
      const offset = (page - 1) * pageSize;

      // Build where conditions
      const conditions = [];
      if (status) conditions.push(eq(paymentReminderLog.status, status));
      if (reminderType) conditions.push(eq(paymentReminderLog.reminderType, reminderType));
      if (startDate) conditions.push(gte(paymentReminderLog.sentAt, new Date(startDate)));
      if (endDate) conditions.push(gte(paymentReminderLog.sentAt, new Date(endDate)));

      // Get logs with customer and invoice details
      const logs = await db
        .select({
          id: paymentReminderLog.id,
          invoiceNumber: invoices.invoiceNumber,
          customerName: customers.name,
          customerEmail: customers.email,
          reminderType: paymentReminderLog.reminderType,
          status: paymentReminderLog.status,
          invoiceAmount: paymentReminderLog.invoiceAmount,
          daysOverdue: paymentReminderLog.daysOverdue,
          sentAt: paymentReminderLog.sentAt,
          errorMessage: paymentReminderLog.errorMessage,
        })
        .from(paymentReminderLog)
        .leftJoin(invoices, eq(paymentReminderLog.invoiceId, invoices.id))
        .leftJoin(customers, eq(paymentReminderLog.customerId, customers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(paymentReminderLog.sentAt))
        .limit(pageSize)
        .offset(offset);

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(paymentReminderLog)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      return {
        logs,
        total: countResult.count,
        page,
        pageSize,
        totalPages: Math.ceil(countResult.count / pageSize),
      };
    }),

  /**
   * Get reminder statistics
   */
  getStatistics: staffProcedure
    .input(z.object({
      days: z.number().min(1).max(365).default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - input.days);

      // Get overall statistics
      const [stats] = await db
        .select({
          totalSent: sql<number>`COUNT(*)`,
          totalFailed: sql<number>`SUM(CASE WHEN ${paymentReminderLog.status} = 'failed' THEN 1 ELSE 0 END)`,
          totalBounced: sql<number>`SUM(CASE WHEN ${paymentReminderLog.status} = 'bounced' THEN 1 ELSE 0 END)`,
          total1st: sql<number>`SUM(CASE WHEN ${paymentReminderLog.reminderType} = '1st' THEN 1 ELSE 0 END)`,
          total2nd: sql<number>`SUM(CASE WHEN ${paymentReminderLog.reminderType} = '2nd' THEN 1 ELSE 0 END)`,
          totalFinal: sql<number>`SUM(CASE WHEN ${paymentReminderLog.reminderType} = 'final' THEN 1 ELSE 0 END)`,
        })
        .from(paymentReminderLog)
        .where(gte(paymentReminderLog.sentAt, daysAgo));

      // Get daily statistics
      const dailyStats = await db
        .select({
          date: sql<string>`DATE(${paymentReminderLog.sentAt})`,
          count: sql<number>`COUNT(*)`,
          sent: sql<number>`SUM(CASE WHEN ${paymentReminderLog.status} = 'sent' THEN 1 ELSE 0 END)`,
          failed: sql<number>`SUM(CASE WHEN ${paymentReminderLog.status} = 'failed' THEN 1 ELSE 0 END)`,
        })
        .from(paymentReminderLog)
        .where(gte(paymentReminderLog.sentAt, daysAgo))
        .groupBy(sql`DATE(${paymentReminderLog.sentAt})`)
        .orderBy(sql`DATE(${paymentReminderLog.sentAt})`);

      // Calculate success rate
      const successRate = stats.totalSent > 0
        ? ((stats.totalSent - stats.totalFailed - stats.totalBounced) / stats.totalSent) * 100
        : 0;

      return {
        totalSent: stats.totalSent,
        totalFailed: stats.totalFailed,
        totalBounced: stats.totalBounced,
        successRate: parseFloat(successRate.toFixed(2)),
        byType: {
          first: stats.total1st,
          second: stats.total2nd,
          final: stats.totalFinal,
        },
        dailyStats,
      };
    }),

  /**
   * Get reminder logs for a specific invoice
   */
  byInvoice: staffProcedure
    .input(z.object({
      invoiceId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const logs = await db
        .select()
        .from(paymentReminderLog)
        .where(eq(paymentReminderLog.invoiceId, input.invoiceId))
        .orderBy(desc(paymentReminderLog.sentAt));

      return logs;
    }),

  /**
   * Get reminder logs for a specific customer
   */
  byCustomer: staffProcedure
    .input(z.object({
      customerId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const logs = await db
        .select({
          id: paymentReminderLog.id,
          invoiceNumber: invoices.invoiceNumber,
          reminderType: paymentReminderLog.reminderType,
          status: paymentReminderLog.status,
          invoiceAmount: paymentReminderLog.invoiceAmount,
          daysOverdue: paymentReminderLog.daysOverdue,
          sentAt: paymentReminderLog.sentAt,
          errorMessage: paymentReminderLog.errorMessage,
        })
        .from(paymentReminderLog)
        .leftJoin(invoices, eq(paymentReminderLog.invoiceId, invoices.id))
        .where(eq(paymentReminderLog.customerId, input.customerId))
        .orderBy(desc(paymentReminderLog.sentAt));

      return logs;
    }),
});
