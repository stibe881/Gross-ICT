import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { contracts } from "../drizzle/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export const contractDashboardRouter = router({
  // Get expiring contracts (within next 90 days)
  getExpiringContracts: protectedProcedure
    .input(z.object({ days: z.number().default(90) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + input.days);

      const results = await db
        .select()
        .from(contracts)
        .where(
        and(
          eq(contracts.status, "active"),
          sql`${contracts.endDate} >= ${today.toISOString().split("T")[0]}`,
          sql`${contracts.endDate} <= ${futureDate.toISOString().split("T")[0]}`
        )
        )
        .orderBy(contracts.endDate);

      return results;
    }),

  // Get contract statistics
  getStatistics: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Total active contracts
    const [activeResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(eq(contracts.status, "active"));

    // Total contract value (active contracts)
    const [valueResult] = await db
      .select({ total: sql<string>`sum(${contracts.totalAmount})` })
      .from(contracts)
      .where(eq(contracts.status, "active"));

    // Expiring soon (next 30 days)
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(next30Days.getDate() + 30);

    const [expiringSoonResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(
        and(
          eq(contracts.status, "active"),
          sql`${contracts.endDate} >= ${today.toISOString().split("T")[0]}`,
          sql`${contracts.endDate} <= ${next30Days.toISOString().split("T")[0]}`
        )
      );

    // Contracts by status
    const statusDistribution = await db
      .select({
        status: contracts.status,
        count: sql<number>`count(*)`,
      })
      .from(contracts)
      .groupBy(contracts.status);

    return {
      activeContracts: activeResult?.count || 0,
      totalValue: valueResult?.total || "0",
      expiringSoon: expiringSoonResult?.count || 0,
      statusDistribution,
    };
  }),

  // Get revenue forecast (next 12 months from active contracts)
  getRevenueForecast: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const activeContracts = await db
      .select()
      .from(contracts)
      .where(eq(contracts.status, "active"));

    // Calculate monthly revenue forecast
    const forecast: { month: string; revenue: number }[] = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const month = new Date(today);
      month.setMonth(month.getMonth() + i);
      const monthKey = month.toISOString().slice(0, 7); // YYYY-MM

      let monthRevenue = 0;

      for (const contract of activeContracts) {
        const contractEnd = new Date(contract.endDate);
        if (contractEnd >= month) {
          // Contract is still active in this month
          const amount = parseFloat(contract.totalAmount);

          // Calculate monthly amount based on billing interval
          let monthlyAmount = 0;
          switch (contract.billingInterval) {
            case "monthly":
              monthlyAmount = amount;
              break;
            case "quarterly":
              monthlyAmount = amount / 3;
              break;
            case "yearly":
              monthlyAmount = amount / 12;
              break;
            case "one_time":
              // Only count if start date is in this month
              const contractStart = new Date(contract.startDate);
              if (
                contractStart.getFullYear() === month.getFullYear() &&
                contractStart.getMonth() === month.getMonth()
              ) {
                monthlyAmount = amount;
              }
              break;
          }

          monthRevenue += monthlyAmount;
        }
      }

      forecast.push({
        month: monthKey,
        revenue: Math.round(monthRevenue * 100) / 100,
      });
    }

    return forecast;
  }),

  // Get renewal rate analytics
  getRenewalRate: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get contracts that expired in the last 12 months
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const expiredContracts = await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.status, "expired"),
          sql`${contracts.endDate} >= ${oneYearAgo.toISOString().split("T")[0]}`
        )
      );

    // Get renewed contracts (those with renewedFromId set)
    const renewedContracts = await db
      .select()
      .from(contracts)
      .where(
        and(
          eq(contracts.status, "renewed"),
          sql`${contracts.endDate} >= ${oneYearAgo.toISOString().split("T")[0]}`
        )
      );

    const totalExpired = expiredContracts.length;
    const totalRenewed = renewedContracts.length;
    const renewalRate =
      totalExpired + totalRenewed > 0
        ? (totalRenewed / (totalExpired + totalRenewed)) * 100
        : 0;

    return {
      totalExpired,
      totalRenewed,
      renewalRate: Math.round(renewalRate * 10) / 10,
    };
  }),
});
