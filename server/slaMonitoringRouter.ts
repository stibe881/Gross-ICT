import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { contracts, customers, tickets, slaPolicies } from "../drizzle/schema";
import { eq, and, gte, lte, sql, isNotNull, desc } from "drizzle-orm";

export const slaMonitoringRouter = router({
  // Get SLA compliance overview
  getCompliance: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all active contracts with SLA
    const activeContracts = await db
      .select({
        contract: contracts,
        customer: customers,
        slaPolicy: slaPolicies,
      })
      .from(contracts)
      .leftJoin(customers, eq(contracts.customerId, customers.id))
      .leftJoin(slaPolicies, eq(contracts.slaId, slaPolicies.id))
      .where(
        and(
          eq(contracts.status, "active"),
          isNotNull(contracts.slaId)
        )
      );

    // Get tickets for these customers in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const customerEmails = activeContracts.map(c => c.customer?.email).filter((email): email is string => email !== null && email !== undefined);
    
    let totalTickets = 0;
    let breachedTickets = 0;
    let avgResponseTime = 0;
    let avgResolutionTime = 0;

    if (customerEmails.length > 0) {
      const allTickets = await db
        .select()
        .from(tickets)
        .where(
          and(
            gte(tickets.createdAt, thirtyDaysAgo)
          )
        );

      const relevantTickets = allTickets.filter(t => 
        t.customerEmail && customerEmails.includes(t.customerEmail)
      );

      totalTickets = relevantTickets.length;
      breachedTickets = relevantTickets.filter(t => t.slaBreached === 1).length;

      // Calculate average response and resolution times
      let totalResponseMinutes = 0;
      let totalResolutionHours = 0;
      let responseCount = 0;
      let resolutionCount = 0;

      relevantTickets.forEach(ticket => {
        // Note: firstResponseAt tracking would need to be added to ticket schema
        // For now, we'll use a simplified calculation
        if (ticket.resolvedAt) {
          const resolutionTime = (ticket.resolvedAt.getTime() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
          totalResolutionHours += resolutionTime;
          resolutionCount++;
        }
      });

      avgResponseTime = responseCount > 0 ? Math.round(totalResponseMinutes / responseCount) : 0;
      avgResolutionTime = resolutionCount > 0 ? Math.round(totalResolutionHours / resolutionCount) : 0;
    }

    const complianceRate = totalTickets > 0 ? ((totalTickets - breachedTickets) / totalTickets) * 100 : 100;

    return {
      totalContracts: activeContracts.length,
      totalTickets,
      breachedTickets,
      complianceRate: Math.round(complianceRate * 10) / 10,
      avgResponseTime,
      avgResolutionTime,
    };
  }),

  // Get SLA performance by contract
  getPerformanceByContract: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const activeContracts = await db
      .select({
        contract: contracts,
        customer: customers,
        slaPolicy: slaPolicies,
      })
      .from(contracts)
      .leftJoin(customers, eq(contracts.customerId, customers.id))
      .leftJoin(slaPolicies, eq(contracts.slaId, slaPolicies.id))
      .where(
        and(
          eq(contracts.status, "active"),
          isNotNull(contracts.slaId)
        )
      )
      .orderBy(desc(contracts.createdAt));

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allTickets = await db
      .select()
      .from(tickets)
      .where(gte(tickets.createdAt, thirtyDaysAgo));

    const performance = activeContracts.map(({ contract, customer, slaPolicy }) => {
      const customerTickets = allTickets.filter(t => t.customerEmail === customer?.email);
      const totalTickets = customerTickets.length;
      const breachedTickets = customerTickets.filter(t => t.slaBreached === 1).length;
      const complianceRate = totalTickets > 0 ? ((totalTickets - breachedTickets) / totalTickets) * 100 : 100;

      return {
        contractId: contract.id,
        contractNumber: contract.contractNumber,
        customerName: customer?.name || "Unknown",
        slaName: slaPolicy?.name || "Unknown",
        slaResponseTime: contract.slaResponseTime,
        slaResolutionTime: contract.slaResolutionTime,
        totalTickets,
        breachedTickets,
        complianceRate: Math.round(complianceRate * 10) / 10,
      };
    });

    return performance;
  }),

  // Get SLA breach alerts (contracts with low compliance)
  getBreachAlerts: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const activeContracts = await db
      .select({
        contract: contracts,
        customer: customers,
        slaPolicy: slaPolicies,
      })
      .from(contracts)
      .leftJoin(customers, eq(contracts.customerId, customers.id))
      .leftJoin(slaPolicies, eq(contracts.slaId, slaPolicies.id))
      .where(
        and(
          eq(contracts.status, "active"),
          isNotNull(contracts.slaId)
        )
      );

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const allTickets = await db
      .select()
      .from(tickets)
      .where(gte(tickets.createdAt, thirtyDaysAgo));

    const alerts = [];

    for (const { contract, customer, slaPolicy } of activeContracts) {
      const customerTickets = allTickets.filter(t => t.customerEmail === customer?.email);
      const totalTickets = customerTickets.length;
      const breachedTickets = customerTickets.filter(t => t.slaBreached === 1).length;
      
      if (totalTickets > 0) {
        const complianceRate = ((totalTickets - breachedTickets) / totalTickets) * 100;
        
        // Alert if compliance is below 80%
        if (complianceRate < 80) {
          alerts.push({
            contractId: contract.id,
            contractNumber: contract.contractNumber,
            customerName: customer?.name || "Unknown",
            slaName: slaPolicy?.name || "Unknown",
            complianceRate: Math.round(complianceRate * 10) / 10,
            breachedTickets,
            totalTickets,
            severity: complianceRate < 50 ? "critical" : complianceRate < 70 ? "high" : "medium",
          });
        }
      }
    }

    return alerts.sort((a, b) => a.complianceRate - b.complianceRate);
  }),
});
