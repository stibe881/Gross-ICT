import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { invoices, recurringInvoices } from '../drizzle/schema_accounting';
import { eq, and, gte, lte, sql } from 'drizzle-orm';

/**
 * Financial Dashboard Router
 * Provides endpoints for financial widgets and analytics
 */

// Admin or Staff procedure (admin, support, accounting)
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'support' && ctx.user.role !== 'accounting') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Staff access required' });
  }
  return next({ ctx });
});

export const financialDashboardRouter = router({
  /**
   * Get cashflow data (income from paid invoices)
   */
  getCashflow: staffProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(6),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      // Get paid invoices grouped by month
      const paidInvoices = await db
        .select({
          month: sql<string>`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`,
          totalIncome: sql<number>`SUM(${invoices.totalAmount})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'paid'),
            gte(invoices.paidDate, monthsAgo)
          )
        )
        .groupBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${invoices.paidDate}, '%Y-%m')`);

      // Calculate total income
      const totalIncome = paidInvoices.reduce((sum, item) => sum + parseFloat(String(item.totalIncome)), 0);

      return {
        months: paidInvoices.map(item => ({
          month: item.month,
          income: parseFloat(String(item.totalIncome)),
          count: item.count,
        })),
        totalIncome,
        averageMonthlyIncome: paidInvoices.length > 0 ? totalIncome / paidInvoices.length : 0,
      };
    }),

  /**
   * Get outstanding invoices (sent but not paid)
   */
  getOutstandingInvoices: staffProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const today = new Date();

      // Get all unpaid invoices
      const unpaidInvoices = await db
        .select()
        .from(invoices)
        .where(
          sql`${invoices.status} IN ('sent', 'overdue')`
        );

      // Categorize by status
      let totalOutstanding = 0;
      let overdueAmount = 0;
      let overdueCount = 0;
      let dueThisMonthAmount = 0;
      let dueThisMonthCount = 0;

      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      for (const invoice of unpaidInvoices) {
        const amount = parseFloat(invoice.totalAmount);
        totalOutstanding += amount;

        const dueDate = new Date(invoice.dueDate);
        
        if (dueDate < today) {
          overdueAmount += amount;
          overdueCount++;
        } else if (dueDate <= endOfMonth) {
          dueThisMonthAmount += amount;
          dueThisMonthCount++;
        }
      }

      return {
        totalOutstanding,
        totalCount: unpaidInvoices.length,
        overdue: {
          amount: overdueAmount,
          count: overdueCount,
        },
        dueThisMonth: {
          amount: dueThisMonthAmount,
          count: dueThisMonthCount,
        },
      };
    }),

  /**
   * Get revenue forecast based on recurring invoices
   */
  getRevenueForecast: staffProcedure
    .input(z.object({
      months: z.number().min(1).max(12).default(3),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Get all active recurring invoices
      const activeRecurring = await db
        .select()
        .from(recurringInvoices)
        .where(eq(recurringInvoices.isActive, true));

      // Calculate monthly recurring revenue
      const monthlyRecurringRevenue = activeRecurring.reduce((sum, invoice) => {
        // Calculate total from items JSON
        const items = JSON.parse(invoice.items);
        const amount = items.reduce((sum: number, item: any) => sum + parseFloat(item.total || 0), 0);
        
        // Convert to monthly amount based on interval
        switch (invoice.interval) {
          case 'monthly':
            return sum + amount;
          case 'quarterly':
            return sum + (amount / 3);
          case 'yearly':
            return sum + (amount / 12);
          default:
            return sum;
        }
      }, 0);

      // Generate forecast for next N months
      const forecast = [];
      const today = new Date();
      
      for (let i = 0; i < input.months; i++) {
        const forecastDate = new Date(today.getFullYear(), today.getMonth() + i + 1, 1);
        forecast.push({
          month: forecastDate.toISOString().substring(0, 7), // YYYY-MM format
          projectedRevenue: monthlyRecurringRevenue,
          recurringInvoiceCount: activeRecurring.length,
        });
      }

      return {
        monthlyRecurringRevenue,
        activeRecurringInvoices: activeRecurring.length,
        forecast,
      };
    }),

  /**
   * Get monthly comparison (current vs previous month)
   */
  getMonthlyComparison: staffProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const today = new Date();
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

      // Current month stats
      const [currentMonthStats] = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END), 0)`,
          totalInvoices: sql<number>`COUNT(*)`,
          paidInvoices: sql<number>`SUM(CASE WHEN ${invoices.status} = 'paid' THEN 1 ELSE 0 END)`,
        })
        .from(invoices)
        .where(gte(invoices.invoiceDate, currentMonthStart));

      // Last month stats
      const [lastMonthStats] = await db
        .select({
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END), 0)`,
          totalInvoices: sql<number>`COUNT(*)`,
          paidInvoices: sql<number>`SUM(CASE WHEN ${invoices.status} = 'paid' THEN 1 ELSE 0 END)`,
        })
        .from(invoices)
        .where(
          and(
            gte(invoices.invoiceDate, lastMonthStart),
            lte(invoices.invoiceDate, lastMonthEnd)
          )
        );

      // Calculate changes
      const revenueChange = lastMonthStats.totalRevenue > 0
        ? ((currentMonthStats.totalRevenue - lastMonthStats.totalRevenue) / lastMonthStats.totalRevenue) * 100
        : 0;

      const invoiceCountChange = lastMonthStats.totalInvoices > 0
        ? ((currentMonthStats.totalInvoices - lastMonthStats.totalInvoices) / lastMonthStats.totalInvoices) * 100
        : 0;

      return {
        currentMonth: {
          revenue: parseFloat(String(currentMonthStats.totalRevenue)),
          invoices: currentMonthStats.totalInvoices,
          paidInvoices: currentMonthStats.paidInvoices,
        },
        lastMonth: {
          revenue: parseFloat(String(lastMonthStats.totalRevenue)),
          invoices: lastMonthStats.totalInvoices,
          paidInvoices: lastMonthStats.paidInvoices,
        },
        changes: {
          revenue: revenueChange,
          invoiceCount: invoiceCountChange,
        },
      };
    }),

  /**
   * Get comprehensive dashboard summary
   */
  getDashboardSummary: staffProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Get all key metrics in parallel
      const [
        totalStats,
        overdueStats,
        thisMonthStats,
        recurringStats,
      ] = await Promise.all([
        // Total revenue and invoices
        db.select({
          totalRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END), 0)`,
          totalInvoices: sql<number>`COUNT(*)`,
        }).from(invoices),

        // Overdue invoices
        db.select({
          overdueAmount: sql<number>`COALESCE(SUM(${invoices.totalAmount}), 0)`,
          overdueCount: sql<number>`COUNT(*)`,
        }).from(invoices).where(
          and(
            sql`${invoices.status} IN ('sent', 'overdue')`,
            sql`${invoices.dueDate} < NOW()`
          )
        ),

        // This month's revenue
        db.select({
          monthRevenue: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.totalAmount} ELSE 0 END), 0)`,
          monthInvoices: sql<number>`COUNT(*)`,
        }).from(invoices).where(
          sql`DATE_FORMAT(${invoices.invoiceDate}, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m')`
        ),

        // Recurring revenue
        db.select({
          count: sql<number>`COUNT(*)`,
        }).from(recurringInvoices).where(eq(recurringInvoices.isActive, true)),
      ]);

      return {
        totalRevenue: parseFloat(String(totalStats[0].totalRevenue)),
        totalInvoices: totalStats[0].totalInvoices,
        overdueAmount: parseFloat(String(overdueStats[0].overdueAmount)),
        overdueCount: overdueStats[0].overdueCount,
        thisMonthRevenue: parseFloat(String(thisMonthStats[0].monthRevenue)),
        thisMonthInvoices: thisMonthStats[0].monthInvoices,
        activeRecurringInvoices: recurringStats[0].count,
      };
    }),
});
