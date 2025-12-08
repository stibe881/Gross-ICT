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

    // Count open tickets (status: open or in_progress)
    const openTicketsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(tickets)
      .where(
        sql`${tickets.status} IN ('open', 'in_progress')`
      );
    const openTickets = Number(openTicketsResult[0]?.count || 0);

    // Count total customers
    const customersResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers);
    const totalCustomers = Number(customersResult[0]?.count || 0);

    // Count open invoices (status: draft or sent, not paid)
    const openInvoicesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(invoices)
      .where(
        sql`${invoices.status} IN ('draft', 'sent')`
      );
    const openInvoices = Number(openInvoicesResult[0]?.count || 0);

    // Count KB articles
    const kbArticlesResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(kbArticles);
    const totalKbArticles = Number(kbArticlesResult[0]?.count || 0);

    return {
      openTickets,
      totalCustomers,
      openInvoices,
      totalKbArticles,
    };
  }),
});
