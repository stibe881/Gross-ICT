import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { leads, leadActivities } from "../drizzle/schema_leads";
import { customers } from "../drizzle/schema_accounting";
import { users } from "../drizzle/schema";
import { eq, like, or, desc, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const leadsRouter = router({
    // Get all leads with optional filters
    all: protectedProcedure
        .input(
            z.object({
                search: z.string().optional(),
                status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
                priority: z.enum(["A", "B", "C"]).optional(),
                assignedTo: z.number().optional(),
            }).optional()
        )
        .query(async ({ input, ctx }: any) => {
            if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            const db = await getDb();
            const conditions = [];

            if (input?.search) {
                conditions.push(
                    or(
                        like(leads.firstName, `%${input.search}%`),
                        like(leads.lastName, `%${input.search}%`),
                        like(leads.email, `%${input.search}%`),
                        like(leads.company, `%${input.search}%`)
                    )
                );
            }

            if (input?.status) {
                conditions.push(eq(leads.status, input.status));
            }

            if (input?.priority) {
                conditions.push(eq(leads.priority, input.priority));
            }

            if (input?.assignedTo) {
                conditions.push(eq(leads.assignedTo, input.assignedTo));
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            const result = await db!
                .select({
                    lead: leads,
                    assignedUser: users,
                })
                .from(leads)
                .leftJoin(users, eq(leads.assignedTo, users.id))
                .where(whereClause)
                .orderBy(desc(leads.createdAt));

            return result.map(r => ({
                ...r.lead,
                assignedUser: r.assignedUser,
            }));
        }),

    // Get lead by ID with activities
    byId: protectedProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input, ctx }: any) => {
            if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            const db = await getDb();



            const [leadData] = await db!
                .select({
                    lead: leads,
                    assignedUser: users,
                })
                .from(leads)
                .leftJoin(users, eq(leads.assignedTo, users.id))
                .where(eq(leads.id, input.id))
                .limit(1);

            if (!leadData) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
            }

            // Get activities
            const activities = await db!
                .select({
                    activity: leadActivities,
                    user: users,
                })
                .from(leadActivities)
                .leftJoin(users, eq(leadActivities.userId, users.id))
                .where(eq(leadActivities.leadId, input.id))
                .orderBy(desc(leadActivities.createdAt));

            return {
                ...leadData.lead,
                assignedUser: leadData.assignedUser,
                activities: activities.map(a => ({
                    ...a.activity,
                    user: a.user,
                })),
            };
        }),

    // Create new lead
    create: protectedProcedure
        .input(
            z.object({
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                website: z.string().optional(),
                company: z.string().optional(),
                position: z.string().optional(),
                status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).default("new"),
                priority: z.enum(["A", "B", "C"]).default("B"),
                source: z.enum(["website", "referral", "cold_call", "email", "social_media", "trade_show", "other"]).default("other"),
                estimatedValue: z.string().optional(),
                notes: z.string().optional(),
                assignedTo: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }: any) => {
            if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            const db = await getDb();

            const result = await db!.insert(leads).values({
                firstName: input.firstName || null,
                lastName: input.lastName || null,
                email: input.email || null,
                phone: input.phone || null,
                website: input.website || null,
                company: input.company || null,
                position: input.position || null,
                status: input.status,
                priority: input.priority,
                source: input.source,
                estimatedValue: input.estimatedValue || null,
                notes: input.notes || null,
                assignedTo: input.assignedTo || null,
            });

            // Get the inserted ID from MySQL result
            let leadId: number;
            if (typeof (result as any)[0]?.insertId === 'number') {
                leadId = (result as any)[0].insertId;
            } else if (typeof (result as any).insertId === 'number') {
                leadId = (result as any).insertId;
            } else {
                console.error('[Leads] Invalid insertId from database:', result);
                throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to retrieve lead ID" });
            }

            // Add initial activity
            await db!.insert(leadActivities).values({
                leadId,
                activityType: "note",
                description: "Lead erstellt",
                userId: ctx.user.id,
            });

            return { id: leadId };
        }),

    // Update lead
    update: protectedProcedure
        .input(
            z.object({
                id: z.number(),
                firstName: z.string().optional(),
                lastName: z.string().optional(),
                email: z.string().email().optional().or(z.literal('')),
                phone: z.string().optional(),
                website: z.string().optional(),
                company: z.string().optional(),
                position: z.string().optional(),
                status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]).optional(),
                priority: z.enum(["A", "B", "C"]).optional(),
                source: z.enum(["website", "referral", "cold_call", "email", "social_media", "trade_show", "other"]).optional(),
                estimatedValue: z.string().optional(),
                notes: z.string().optional(),
                assignedTo: z.number().optional(),
            })
        )
        .mutation(async ({ input, ctx }: any) => {
            if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            const db = await getDb();
            const { id, ...updateData } = input;

            // Get old status if status is being updated
            if (input.status) {
                const [oldLead] = await db!.select().from(leads).where(eq(leads.id, id)).limit(1);

                if (oldLead && oldLead.status !== input.status) {
                    // Log status change
                    await db!.insert(leadActivities).values({
                        leadId: id,
                        activityType: "status_change",
                        description: `Status geändert von "${oldLead.status}" zu "${input.status}"`,
                        userId: ctx.user.id,
                    });
                }
            }

            await db!.update(leads).set(updateData).where(eq(leads.id, id));

            return { success: true };
        }),

    // Delete lead
    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }: any) => {
            if (ctx.user.role !== "admin") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete leads" });
            }

            const db = await getDb();
            await db!.delete(leadActivities).where(eq(leadActivities.leadId, input.id));
            await db!.delete(leads).where(eq(leads.id, input.id));

            return { success: true };
        }),

    // Add activity to lead
    addActivity: protectedProcedure
        .input(
            z.object({
                leadId: z.number(),
                activityType: z.enum(["note", "email", "call", "meeting", "status_change", "contacted", "email_sent", "called"]),
                description: z.string().min(1),
            })
        )
        .mutation(async ({ input, ctx }: any) => {
            if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            const db = await getDb();

            await db!.insert(leadActivities).values({
                leadId: input.leadId,
                activityType: input.activityType,
                description: input.description,
                userId: ctx.user.id,
            });

            return { success: true };
        }),

    // Convert lead to customer
    convertToCustomer: protectedProcedure
        .input(z.object({ leadId: z.number() }))
        .mutation(async ({ input, ctx }: any) => {
            if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
                throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
            }

            const db = await getDb();

            // Get lead
            const [lead] = await db!.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);

            if (!lead) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
            }

            if (lead.convertedToCustomerId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Lead already converted" });
            }

            // Create customer
            const customerResult = await db!.insert(customers).values({
                type: lead.company ? "company" : "individual",
                name: lead.company || `${lead.firstName} ${lead.lastName}`,
                contactPerson: lead.company ? `${lead.firstName} ${lead.lastName}` : null,
                email: lead.email,
                phone: lead.phone,
                notes: lead.notes,
            });

            const customerId = Number((customerResult as any).insertId);

            // Update lead
            await db!.update(leads).set({
                status: "won",
                convertedToCustomerId: customerId,
                convertedAt: new Date(),
            }).where(eq(leads.id, input.leadId));

            // Add activity
            await db!.insert(leadActivities).values({
                leadId: input.leadId,
                activityType: "status_change",
                description: `Lead zu Kunde konvertiert (Kunden-ID: ${customerId})`,
                userId: ctx.user.id,
            });

            return { customerId };
        }),

    // Get lead statistics
    stats: protectedProcedure.query(async ({ ctx }: any) => {
        if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
            throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }

        const db = await getDb();

        // Get counts by status
        const statusCounts = await db!
            .select({
                status: leads.status,
                count: sql<number>`COUNT(*)`,
            })
            .from(leads)
            .groupBy(leads.status);

        // Get total estimated value
        const [valueResult] = await db!
            .select({
                total: sql<string>`SUM(${leads.estimatedValue})`,
            })
            .from(leads)
            .where(eq(leads.status, "qualified"));

        // Get conversion rate
        const [totalLeads] = await db!
            .select({
                count: sql<number>`COUNT(*)`,
            })
            .from(leads);

        const [wonLeads] = await db!
            .select({
                count: sql<number>`COUNT(*)`,
            })
            .from(leads)
            .where(eq(leads.status, "won"));

        const conversionRate = totalLeads.count > 0
            ? ((wonLeads.count / totalLeads.count) * 100).toFixed(1)
            : "0.0";

        return {
            statusCounts,
            totalEstimatedValue: valueResult.total || "0.00",
            conversionRate,
        };
    }),
});
