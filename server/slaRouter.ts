import { z } from 'zod';
import { publicProcedure, router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from './db';
import { slaPolicies, slaTracking, tickets, users } from '../drizzle/schema';
import { eq, and, desc, lt, isNull } from 'drizzle-orm';
import { sendSLAWarningEmail, sendSLABreachEmail } from './_core/emailService';

export const slaRouter = router({
  // Get all SLA policies
  list: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view SLA policies',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      return await db.select().from(slaPolicies).orderBy(desc(slaPolicies.createdAt));
    }),

  // Get SLA policy by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view SLA policies',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [policy] = await db.select().from(slaPolicies).where(eq(slaPolicies.id, input.id)).limit(1);
      
      if (!policy) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'SLA policy not found',
        });
      }

      return policy;
    }),

  // Create SLA policy
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      priority: z.enum(['urgent', 'high', 'normal', 'low']).nullable().optional(),
      responseTimeMinutes: z.number().min(1),
      resolutionTimeMinutes: z.number().min(1),
      warningThreshold: z.number().min(1).max(100).default(80),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create SLA policies',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const result = await db.insert(slaPolicies).values({
        name: input.name,
        description: input.description || null,
        priority: input.priority,
        responseTimeMinutes: input.responseTimeMinutes,
        resolutionTimeMinutes: input.resolutionTimeMinutes,
        warningThreshold: input.warningThreshold,
        isActive: input.isActive ? 1 : 0,
      });

      return { success: true, id: Number((result as any).insertId) };
    }),

  // Update SLA policy
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      priority: z.enum(['urgent', 'high', 'normal', 'low']).nullable().optional(),
      responseTimeMinutes: z.number().min(1).optional(),
      resolutionTimeMinutes: z.number().min(1).optional(),
      warningThreshold: z.number().min(1).max(100).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update SLA policies',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.responseTimeMinutes !== undefined) updateData.responseTimeMinutes = input.responseTimeMinutes;
      if (input.resolutionTimeMinutes !== undefined) updateData.resolutionTimeMinutes = input.resolutionTimeMinutes;
      if (input.warningThreshold !== undefined) updateData.warningThreshold = input.warningThreshold;
      if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;

      await db.update(slaPolicies).set(updateData).where(eq(slaPolicies.id, input.id));

      return { success: true };
    }),

  // Delete SLA policy
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete SLA policies',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      await db.delete(slaPolicies).where(eq(slaPolicies.id, input.id));

      return { success: true };
    }),

  // Get SLA tracking for a ticket
  getTicketSla: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [tracking] = await db
        .select()
        .from(slaTracking)
        .where(eq(slaTracking.ticketId, input.ticketId))
        .limit(1);

      if (!tracking) return null;

      // Get associated policy
      const [policy] = await db
        .select()
        .from(slaPolicies)
        .where(eq(slaPolicies.id, tracking.policyId))
        .limit(1);

      return {
        ...tracking,
        policy,
      };
    }),

  // Get all SLA breaches
  getBreaches: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can view SLA breaches',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Get all tracking records with breached status
      const breaches = await db
        .select()
        .from(slaTracking)
        .where(
          and(
            eq(slaTracking.responseStatus, 'breached'),
            eq(slaTracking.resolutionStatus, 'breached')
          )
        )
        .orderBy(desc(slaTracking.createdAt));

      // Get ticket details for each breach
      const breachesWithTickets = await Promise.all(
        breaches.map(async (breach) => {
          const [ticket] = await db
            .select()
            .from(tickets)
            .where(eq(tickets.id, breach.ticketId))
            .limit(1);

          const [policy] = await db
            .select()
            .from(slaPolicies)
            .where(eq(slaPolicies.id, breach.policyId))
            .limit(1);

          return {
            ...breach,
            ticket,
            policy,
          };
        })
      );

      return breachesWithTickets;
    }),

  // Check and update SLA status (called by cron job or manually)
  checkSlaStatus: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can check SLA status',
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const now = new Date();
      
      // Get all active SLA tracking records
      const activeTracking = await db
        .select()
        .from(slaTracking)
        .where(
          and(
            isNull(slaTracking.resolvedAt),
            eq(slaTracking.resolutionStatus, 'pending')
          )
        );

      let warningsCount = 0;
      let breachesCount = 0;

      for (const track of activeTracking) {
        const [policy] = await db
          .select()
          .from(slaPolicies)
          .where(eq(slaPolicies.id, track.policyId))
          .limit(1);

        if (!policy) continue;

        const [ticket] = await db
          .select()
          .from(tickets)
          .where(eq(tickets.id, track.ticketId))
          .limit(1);

        if (!ticket) continue;

        // Check response SLA
        if (!track.firstResponseAt) {
          const responseDeadline = new Date(track.responseDeadline);
          const timeRemaining = responseDeadline.getTime() - now.getTime();
          const totalTime = responseDeadline.getTime() - new Date(track.createdAt).getTime();
          const percentRemaining = (timeRemaining / totalTime) * 100;

          if (timeRemaining <= 0) {
            // Breached
            await db.update(slaTracking).set({
              responseStatus: 'breached',
            }).where(eq(slaTracking.id, track.id));

            if (!track.responseBreachSent) {
              // Send breach email
              try {
                // Get assigned user email
                if (ticket.assignedTo) {
                  const [assignedUser] = await db.select().from(users).where(eq(users.id, ticket.assignedTo)).limit(1);
                  if (assignedUser && assignedUser.email) {
                    // Get all admin emails for CC
                    const admins = await db.select().from(users).where(eq(users.role, 'admin'));
                    const adminEmails = admins.map(a => a.email).filter(Boolean) as string[];
                    
                    await sendSLABreachEmail(
                      track.ticketId,
                      ticket.subject,
                      assignedUser.email,
                      adminEmails,
                      responseDeadline,
                      'response'
                    );
                  }
                }
              } catch (error) {
                console.error('Failed to send SLA breach email:', error);
              }

              await db.update(slaTracking).set({
                responseBreachSent: 1,
              }).where(eq(slaTracking.id, track.id));

              breachesCount++;
            }
          } else if (percentRemaining <= policy.warningThreshold) {
            // Warning
            await db.update(slaTracking).set({
              responseStatus: 'warning',
            }).where(eq(slaTracking.id, track.id));

            if (!track.responseWarningSent) {
              // Send warning email
              try {
                // Get assigned user email
                if (ticket.assignedTo) {
                  const [assignedUser] = await db.select().from(users).where(eq(users.id, ticket.assignedTo)).limit(1);
                  if (assignedUser && assignedUser.email) {
                    await sendSLAWarningEmail(
                      track.ticketId,
                      ticket.subject,
                      assignedUser.email,
                      responseDeadline,
                      'response'
                    );
                  }
                }
              } catch (error) {
                console.error('Failed to send SLA warning email:', error);
              }

              await db.update(slaTracking).set({
                responseWarningSent: 1,
              }).where(eq(slaTracking.id, track.id));

              warningsCount++;
            }
          }
        }

        // Check resolution SLA
        if (!track.resolvedAt && ticket.status !== 'resolved' && ticket.status !== 'closed') {
          const resolutionDeadline = new Date(track.resolutionDeadline);
          const timeRemaining = resolutionDeadline.getTime() - now.getTime();
          const totalTime = resolutionDeadline.getTime() - new Date(track.createdAt).getTime();
          const percentRemaining = (timeRemaining / totalTime) * 100;

          if (timeRemaining <= 0) {
            // Breached
            await db.update(slaTracking).set({
              resolutionStatus: 'breached',
            }).where(eq(slaTracking.id, track.id));

            if (!track.resolutionBreachSent) {
              // Send breach email
              breachesCount++;
              await db.update(slaTracking).set({
                resolutionBreachSent: 1,
              }).where(eq(slaTracking.id, track.id));
            }
          } else if (percentRemaining <= policy.warningThreshold) {
            // Warning
            await db.update(slaTracking).set({
              resolutionStatus: 'warning',
            }).where(eq(slaTracking.id, track.id));

            if (!track.resolutionWarningSent) {
              // Send warning email
              warningsCount++;
              await db.update(slaTracking).set({
                resolutionWarningSent: 1,
              }).where(eq(slaTracking.id, track.id));
            }
          }
        }
      }

      return {
        success: true,
        checked: activeTracking.length,
        warnings: warningsCount,
        breaches: breachesCount,
      };
    }),
});
