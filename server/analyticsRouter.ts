import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { invoices, customers } from "../drizzle/schema";
import { sql, and, gte, lte, eq } from "drizzle-orm";

export const analyticsRouter = router({
  // Get revenue data grouped by month
  getRevenueByMonth: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(6),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      const results = await db
        .select({
          month: sql<string>`DATE_FORMAT(${invoices.invoiceDate}, '%Y-%m')`,
          amount: sql<number>`CAST(SUM(${invoices.totalAmount}) AS DECIMAL(10,2))`,
        })
        .from(invoices)
        .where(
          and(
            sql`${invoices.invoiceDate} >= ${monthsAgo.toISOString()}`,
            eq(invoices.status, "paid")
          )
        )
        .groupBy(sql`DATE_FORMAT(${invoices.invoiceDate}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${invoices.invoiceDate}, '%Y-%m')`);

      // Format month names
      const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
      
      return results.map((r) => {
        const [year, month] = r.month.split("-");
        const monthIndex = parseInt(month) - 1;
        return {
          month: `${monthNames[monthIndex]} ${year.slice(2)}`,
          fullDate: r.month,
          amount: parseFloat(r.amount as any) || 0,
        };
      });
    }),

  // Get customer growth data grouped by month
  getCustomerGrowthByMonth: protectedProcedure
    .input(
      z.object({
        months: z.number().min(1).max(24).default(6),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - input.months);

      const results = await db
        .select({
          month: sql<string>`DATE_FORMAT(${customers.createdAt}, '%Y-%m')`,
          count: sql<number>`COUNT(*)`,
        })
        .from(customers)
        .where(sql`${customers.createdAt} >= ${monthsAgo.toISOString()}`)
        .groupBy(sql`DATE_FORMAT(${customers.createdAt}, '%Y-%m')`)
        .orderBy(sql`DATE_FORMAT(${customers.createdAt}, '%Y-%m')`);

      // Format month names
      const monthNames = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];
      
      return results.map((r) => {
        const [year, month] = r.month.split("-");
        const monthIndex = parseInt(month) - 1;
        return {
          month: `${monthNames[monthIndex]} ${year.slice(2)}`,
          fullDate: r.month,
          count: r.count,
        };
      });
    }),

  // Get detailed invoices for a specific month
  getInvoicesByMonth: protectedProcedure
    .input(
      z.object({
        month: z.string(), // Format: YYYY-MM
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db
        .select()
        .from(invoices)
        .where(
          sql`strftime('%Y-%m', ${invoices.invoiceDate}) = ${input.month}`
        )
        .orderBy(invoices.invoiceDate);

      return results;
    }),

  // Get detailed customers for a specific month
  getCustomersByMonth: protectedProcedure
    .input(
      z.object({
        month: z.string(), // Format: YYYY-MM
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const results = await db
        .select()
        .from(customers)
        .where(
          sql`strftime('%Y-%m', ${customers.createdAt}) = ${input.month}`
        )
        .orderBy(customers.createdAt);

      return results;
    }),
});
