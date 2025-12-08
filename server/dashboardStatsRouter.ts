import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { tickets, customers, invoices, kbArticles } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const dashboardStatsRouter = router({
  // Get quick statistics for admin dashboard
  getQuickStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Calculate dates for weekly comparison
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Count open tickets (status: open or in_progress)
    const openTicketsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        sql`${tickets.status} IN ('open', 'in_progress')`
      );
    const openTickets = Number(openTicketsResult[0]?.count || 0);

    // Count open tickets from last week
    const openTicketsLastWeekResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        sql`${tickets.status} IN ('open', 'in_progress') AND ${tickets.createdAt} < ${oneWeekAgo}`
      );
    const openTicketsLastWeek = Number(openTicketsLastWeekResult[0]?.count || 0);

    // Count total customers
    const customersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers);
    const totalCustomers = Number(customersResult[0]?.count || 0);

    // Count customers from last week
    const customersLastWeekResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(
        sql`${customers.createdAt} < ${oneWeekAgo}`
      );
    const customersLastWeek = Number(customersLastWeekResult[0]?.count || 0);

    // Count open invoices (status: draft or sent, not paid)
    const openInvoicesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(
        sql`${invoices.status} IN ('draft', 'sent')`
      );
    const openInvoices = Number(openInvoicesResult[0]?.count || 0);

    // Count open invoices from last week
    const openInvoicesLastWeekResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(
        sql`${invoices.status} IN ('draft', 'sent') AND ${invoices.createdAt} < ${oneWeekAgo}`
      );
    const openInvoicesLastWeek = Number(openInvoicesLastWeekResult[0]?.count || 0);

    // Count KB articles
    const kbArticlesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbArticles);
    const totalKbArticles = Number(kbArticlesResult[0]?.count || 0);

    // Count KB articles from last week
    const kbArticlesLastWeekResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbArticles)
      .where(
        sql`${kbArticles.createdAt} < ${oneWeekAgo}`
      );
    const kbArticlesLastWeek = Number(kbArticlesLastWeekResult[0]?.count || 0);

    return {
      openTickets,
      openTicketsTrend: openTickets - openTicketsLastWeek,
      totalCustomers,
      customersTrend: totalCustomers - customersLastWeek,
      openInvoices,
      openInvoicesTrend: openInvoices - openInvoicesLastWeek,
      totalKbArticles,
      kbArticlesTrend: totalKbArticles - kbArticlesLastWeek,
    };
  }),
});
