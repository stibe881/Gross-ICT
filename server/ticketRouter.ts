import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { createTicket, getTicketsByUserId, getAllTickets, getTicketById, updateTicket, getUserByEmail, createUser, getDb } from './db';
import { customers, contracts } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { sendEmail } from './_core/emailService';
import { getRenderedEmail, getTicketUrl, formatPriority, formatStatus } from './_core/emailTemplateService';

// Admin or Support procedure
const adminOrSupportProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'support') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin or Support access required' });
  }
  return next({ ctx });
});

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const ticketRouter = router({
  // Create ticket (public - can be used by non-authenticated users)
  create: publicProcedure
    .input(z.object({
      customerName: z.string().min(1),
      customerEmail: z.string().email(),
      company: z.string().optional(),
      subject: z.string().min(1),
      message: z.string().min(10),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
      category: z.enum(['network', 'security', 'hardware', 'software', 'email', 'other']).default('other'),
      createAccount: z.boolean().optional(),
      password: z.string().min(6).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      let userId = ctx.user?.id;

      // If user is not authenticated, create a temporary user ID or handle guest tickets
      if (!userId) {
        // Check if user exists by email
        let user = await getUserByEmail(input.customerEmail);

        // If createAccount is true and user doesn't exist, create account
        if (input.createAccount && !user && input.password) {
          const hashedPassword = await bcrypt.hash(input.password, 10);
          await createUser({
            email: input.customerEmail,
            password: hashedPassword,
            name: input.customerName,
            role: 'user',
            loginMethod: 'local',
            openId: `local-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          });

          user = await getUserByEmail(input.customerEmail);
        }

        // If user exists or was just created, use their ID
        if (user) {
          userId = user.id;
        } else {
          // Create a guest user for this ticket
          const guestOpenId = `guest-${Date.now()}-${Math.random().toString(36).substring(7)}`;
          await createUser({
            email: input.customerEmail,
            name: input.customerName,
            role: 'user',
            loginMethod: 'guest',
            openId: guestOpenId,
          });

          const guestUser = await getUserByEmail(input.customerEmail);
          if (guestUser) {
            userId = guestUser.id;
          } else {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Failed to create user for ticket',
            });
          }
        }
      }

      // Check if customer has an active contract with SLA
      const db = await getDb();
      let finalPriority = input.priority;
      let slaResponseTime = null;
      let slaResolutionTime = null;

      if (db) {
        // Find customer by email
        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.email, input.customerEmail))
          .limit(1);

        if (customer) {
          // Find active contract with SLA for this customer
          const [activeContract] = await db
            .select()
            .from(contracts)
            .where(
              and(
                eq(contracts.customerId, customer.id),
                eq(contracts.status, 'active')
              )
            )
            .orderBy(desc(contracts.createdAt))
            .limit(1);

          if (activeContract && activeContract.slaId) {
            // Use SLA from contract
            slaResponseTime = activeContract.slaResponseTime;
            slaResolutionTime = activeContract.slaResolutionTime;

            // Auto-upgrade priority based on SLA response time
            if (slaResponseTime && slaResponseTime <= 15) {
              finalPriority = 'urgent';
            } else if (slaResponseTime && slaResponseTime <= 60) {
              finalPriority = 'high';
            } else if (slaResponseTime && slaResponseTime <= 240) {
              finalPriority = 'medium';
            }
          }
        }
      }

      // Calculate SLA due date based on priority
      const slaHours = {
        urgent: 4,    // 4 hours
        high: 24,     // 1 day
        medium: 72,   // 3 days
        low: 168,     // 7 days
      };
      const slaDueDate = new Date();
      slaDueDate.setHours(slaDueDate.getHours() + slaHours[finalPriority]);

      const ticketResult = await createTicket({
        userId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        company: input.company || null,
        subject: input.subject,
        message: input.message,
        priority: finalPriority,
        category: input.category,
        status: 'open',
        slaDueDate,
        slaBreached: 0,
        escalationLevel: 0,
      });

      // Send ticket created email notification
      try {
        const emailData = {
          customerName: input.customerName,
          ticketId: ticketResult.id.toString(),
          ticketSubject: input.subject,
          ticketPriority: formatPriority(finalPriority),
          ticketStatus: formatStatus('open'),
          ticketUrl: getTicketUrl(ticketResult.accessToken), // Use token for URL
        };

        const { subject, body } = await getRenderedEmail('ticket_created', emailData);
        await sendEmail({
          to: input.customerEmail,
          subject,
          html: body,
        });
      } catch (emailError) {
        console.error('Failed to send ticket created email:', emailError);
        // Don't fail the ticket creation if email fails
      }

      return {
        success: true,
        ticketId: ticketResult.id,
        accountCreated: input.createAccount && input.password ? true : false,
      };
    }),

  // Get user's own tickets
  myTickets: protectedProcedure.query(async ({ ctx }) => {
    return await getTicketsByUserId(ctx.user.id);
  }),

  // Get all tickets (admin only)
  all: adminProcedure.query(async () => {
    return await getAllTickets();
  }),

  // Get ticket by ID (admin or support)
  byId: adminOrSupportProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const ticket = await getTicketById(input.id);
      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
      }
      return ticket;
    }),

  // Get filtered tickets (admin only)
  filtered: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      category: z.enum(['network', 'security', 'hardware', 'software', 'email', 'other']).optional(),
    }))
    .query(async ({ input }) => {
      let tickets = await getAllTickets();

      // Apply search filter
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        tickets = tickets.filter(t =>
          t.subject.toLowerCase().includes(searchLower) ||
          t.message.toLowerCase().includes(searchLower) ||
          t.customerName?.toLowerCase().includes(searchLower) ||
          t.customerEmail?.toLowerCase().includes(searchLower) ||
          t.company?.toLowerCase().includes(searchLower)
        );
      }

      // Apply status filter
      if (input.status) {
        tickets = tickets.filter(t => t.status === input.status);
      }

      // Apply priority filter
      if (input.priority) {
        tickets = tickets.filter(t => t.priority === input.priority);
      }

      // Apply category filter
      if (input.category) {
        tickets = tickets.filter(t => t.category === input.category);
      }

      return tickets;
    }),

  // Get single ticket
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const ticket = await getTicketById(input.id);

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
      }

      // Users can only see their own tickets, admins can see all
      if (ctx.user.role !== 'admin' && ticket.userId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      return ticket;
    }),

  // Update ticket (admin/support only)
  update: adminOrSupportProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      adminNotes: z.string().optional(),
      assignedTo: z.number().optional(),
      sendNotification: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, sendNotification, ...updates } = input;

      const updateData: any = { ...updates };
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updateData.resolvedAt = new Date();
      }

      await updateTicket(id, updateData);

      // Send email notification if requested and status changed
      if (sendNotification && updates.status) {
        try {
          const ticket = await getTicketById(id);
          if (ticket && ticket.customerEmail) {
            const statusMessages: Record<string, string> = {
              in_progress: 'Ihr Ticket wird nun bearbeitet. Wir werden uns baldmöglichst bei Ihnen melden.',
              resolved: 'Ihr Ticket wurde gelöst. Falls Sie weitere Fragen haben, können Sie das Ticket jederzeit wieder öffnen.',
              closed: 'Ihr Ticket wurde geschlossen. Vielen Dank für Ihre Geduld.',
            };

            const emailData = {
              customerName: ticket.customerName || 'Kunde',
              ticketId: ticket.id.toString(),
              ticketStatus: formatStatus(updates.status),
              assignedTo: updates.assignedTo ? 'Support-Team' : 'Nicht zugewiesen',
              lastMessage: statusMessages[updates.status] || 'Der Status Ihres Tickets wurde aktualisiert.',
              ticketUrl: getTicketUrl(ticket.id),
            };

            const { subject, body } = await getRenderedEmail('ticket_status_changed', emailData);
            await sendEmail({
              to: ticket.customerEmail,
              subject,
              html: body,
            });

            console.log(`[Ticket] Status change notification email sent for ticket #${id}`);
          }
        } catch (error) {
          console.error(`[Ticket] Failed to send status change notification email for ticket #${id}:`, error);
          // Don't fail the mutation if email fails
        }
      }

      // Send ticket assigned email if assignedTo changed
      if (updates.assignedTo) {
        try {
          const ticket = await getTicketById(id);
          const db = await getDb();
          if (ticket && db) {
            // Get assigned user details
            const { users } = await import('../drizzle/schema');
            const [assignedUser] = await db
              .select()
              .from(users)
              .where(eq(users.id, updates.assignedTo))
              .limit(1);

            if (assignedUser && assignedUser.email) {
              const emailData = {
                assignedTo: assignedUser.name || assignedUser.email,
                ticketId: ticket.id.toString(),
                customerName: ticket.customerName || 'Unbekannt',
                ticketSubject: ticket.subject || 'Kein Betreff',
                ticketPriority: formatPriority(ticket.priority || 'medium'),
                ticketCategory: ticket.category || 'other',
                createdAt: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('de-CH') : '',
                ticketDescription: ticket.message || '',
                ticketUrl: getTicketUrl(ticket.id),
              };

              const { subject, body } = await getRenderedEmail('ticket_assigned', emailData);
              await sendEmail({
                to: assignedUser.email,
                subject,
                html: body,
              });

              console.log(`[Ticket] Assignment notification email sent for ticket #${id}`);
            }
          }
        } catch (error) {
          console.error(`[Ticket] Failed to send assignment notification email for ticket #${id}:`, error);
          // Don't fail the mutation if email fails
        }
      }

      return {
        success: true,
      };
    }),

  // Get ticket statistics (admin only)
  stats: adminProcedure.query(async () => {
    const allTickets = await getAllTickets();

    return {
      total: allTickets.length,
      open: allTickets.filter(t => t.status === 'open').length,
      inProgress: allTickets.filter(t => t.status === 'in_progress').length,
      resolved: allTickets.filter(t => t.status === 'resolved').length,
      closed: allTickets.filter(t => t.status === 'closed').length,
      byPriority: {
        low: allTickets.filter(t => t.priority === 'low').length,
        medium: allTickets.filter(t => t.priority === 'medium').length,
        high: allTickets.filter(t => t.priority === 'high').length,
        urgent: allTickets.filter(t => t.priority === 'urgent').length,
      },
      byCategory: {
        network: allTickets.filter(t => t.category === 'network').length,
        security: allTickets.filter(t => t.category === 'security').length,
        hardware: allTickets.filter(t => t.category === 'hardware').length,
        software: allTickets.filter(t => t.category === 'software').length,
        email: allTickets.filter(t => t.category === 'email').length,
        other: allTickets.filter(t => t.category === 'other').length,
      },
    };
  }),

  // Assign ticket to support staff (admin only)
  assign: adminProcedure
    .input(z.object({
      ticketId: z.number(),
      assignedTo: z.number().nullable(),
    }))
    .mutation(async ({ input }) => {
      await updateTicket(input.ticketId, { assignedTo: input.assignedTo });
      return { success: true };
    }),

  // Get support staff list (admin only)
  supportStaff: adminOrSupportProcedure
    .query(async () => {
      const { getDb } = await import('./db.js');
      const { users } = await import('../drizzle/schema.js');
      const { eq, or } = await import('drizzle-orm');

      const db = await getDb();
      if (!db) return [];

      return await db.select().from(users).where(
        or(
          eq(users.role, 'admin'),
          eq(users.role, 'support')
        )
      );
    }),

  // Get detailed statistics with time-series data (admin/support)
  detailedStats: adminOrSupportProcedure
    .query(async () => {
      const allTickets = await getAllTickets();
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Calculate average resolution time
      const resolvedTickets = allTickets.filter(t => t.status === 'resolved' && t.resolvedAt);
      const avgResolutionTime = resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
          const created = new Date(t.createdAt).getTime();
          const resolved = new Date(t.resolvedAt!).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedTickets.length
        : 0;

      // Tickets by category over last 30 days
      const ticketsByDay: Record<string, Record<string, number>> = {};
      for (let i = 0; i < 30; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        ticketsByDay[dateStr] = {
          network: 0,
          security: 0,
          hardware: 0,
          software: 0,
          email: 0,
          other: 0,
        };
      }

      allTickets.forEach(ticket => {
        const ticketDate = new Date(ticket.createdAt).toISOString().split('T')[0];
        if (ticketsByDay[ticketDate]) {
          ticketsByDay[ticketDate][ticket.category]++;
        }
      });

      return {
        avgResolutionTimeMs: avgResolutionTime,
        avgResolutionTimeHours: avgResolutionTime / (1000 * 60 * 60),
        ticketsLast7Days: allTickets.filter(t => new Date(t.createdAt) >= last7Days).length,
        ticketsLast30Days: allTickets.filter(t => new Date(t.createdAt) >= last30Days).length,
        ticketsByDay: Object.entries(ticketsByDay)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, counts]) => ({ date, ...counts })),
      };
    }),

  // Check and update SLA status for all open tickets (admin/support)
  checkSLA: adminOrSupportProcedure
    .mutation(async () => {
      const { getDb } = await import('./db.js');
      const { tickets } = await import('../drizzle/schema.js');
      const { eq, and, or } = await import('drizzle-orm');

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const now = new Date();
      const openTickets = await db.select().from(tickets).where(
        or(
          eq(tickets.status, 'open'),
          eq(tickets.status, 'in_progress')
        )
      );

      let breached = 0;
      let escalated = 0;

      for (const ticket of openTickets) {
        if (!ticket.slaDueDate) continue;

        const dueDate = new Date(ticket.slaDueDate);
        const hoursOverdue = (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60);

        if (hoursOverdue > 0) {
          // SLA breached
          let newEscalationLevel = ticket.escalationLevel || 0;

          if (hoursOverdue > 48) {
            // Critical escalation after 48 hours overdue
            newEscalationLevel = 2;
            escalated++;
          } else if (hoursOverdue > 24) {
            // First escalation after 24 hours overdue
            newEscalationLevel = Math.max(1, newEscalationLevel);
            escalated++;
          }

          await db.update(tickets)
            .set({
              slaBreached: 1,
              escalationLevel: newEscalationLevel,
            })
            .where(eq(tickets.id, ticket.id));

          breached++;
        }
      }

      return {
        success: true,
        checked: openTickets.length,
        breached,
        escalated,
      };
    }),

  // Get overdue tickets (admin/support)
  overdue: adminOrSupportProcedure
    .query(async () => {
      const { getDb } = await import('./db.js');
      const { tickets } = await import('../drizzle/schema.js');
      const { or, eq } = await import('drizzle-orm');

      const db = await getDb();
      if (!db) return [];

      const openTickets = await db.select().from(tickets).where(
        or(
          eq(tickets.status, 'open'),
          eq(tickets.status, 'in_progress')
        )
      );

      const now = new Date();
      return openTickets.filter(ticket => {
        if (!ticket.slaDueDate) return false;
        return new Date(ticket.slaDueDate) < now;
      });
    }),

  // Bulk delete tickets
  bulkDelete: adminOrSupportProcedure
    .input(z.object({
      ticketIds: z.array(z.number()),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { tickets } = await import('../drizzle/schema.js');
      const { inArray } = await import('drizzle-orm');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.delete(tickets).where(inArray(tickets.id, input.ticketIds));
      return { success: true, count: input.ticketIds.length };
    }),

  // Bulk update status
  bulkUpdateStatus: adminOrSupportProcedure
    .input(z.object({
      ticketIds: z.array(z.number()),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { tickets } = await import('../drizzle/schema.js');
      const { inArray } = await import('drizzle-orm');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.update(tickets)
        .set({ status: input.status })
        .where(inArray(tickets.id, input.ticketIds));
      return { success: true, count: input.ticketIds.length };
    }),

  // Bulk assign tickets
  bulkAssign: adminOrSupportProcedure
    .input(z.object({
      ticketIds: z.array(z.number()),
      assignedTo: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { tickets } = await import('../drizzle/schema.js');
      const { inArray } = await import('drizzle-orm');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.update(tickets)
        .set({ assignedTo: input.assignedTo })
        .where(inArray(tickets.id, input.ticketIds));
      return { success: true, count: input.ticketIds.length };
    }),

  // Bulk update priority
  bulkUpdatePriority: adminOrSupportProcedure
    .input(z.object({
      ticketIds: z.array(z.number()),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { tickets } = await import('../drizzle/schema.js');
      const { inArray } = await import('drizzle-orm');

      const db = await getDb();
      if (!db) throw new Error('Database not available');

      await db.update(tickets)
        .set({ priority: input.priority })
        .where(inArray(tickets.id, input.ticketIds));
      return { success: true, count: input.ticketIds.length };
    }),

  // Public ticket lookup (requires email verification)
  publicLookup: publicProcedure
    .input(z.object({
      ticketId: z.number(),
      email: z.string().email(),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { tickets, ticketComments, users } = await import('../drizzle/schema.js');

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Find the ticket
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket nicht gefunden' });
      }

      // Verify email matches
      if (ticket.customerEmail?.toLowerCase() !== input.email.toLowerCase()) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'E-Mail-Adresse stimmt nicht überein' });
      }

      // Get comments for this ticket (public ones only or all if customer)
      const comments = await db
        .select({
          id: ticketComments.id,
          content: ticketComments.comment,
          isInternal: ticketComments.isInternal,
          createdAt: ticketComments.createdAt,
          userName: users.name,
        })
        .from(ticketComments)
        .leftJoin(users, eq(ticketComments.userId, users.id))
        .where(
          and(
            eq(ticketComments.ticketId, input.ticketId),
            eq(ticketComments.isInternal, false) // Only show non-internal comments
          )
        )
        .orderBy(desc(ticketComments.createdAt));

      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        comments: comments.map(c => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: c.userName || 'Support',
        })),
      };
    }),

  // Public ticket lookup by token (no email required)
  publicByToken: publicProcedure
    .input(z.object({
      token: z.string().min(1),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { tickets, ticketComments, users } = await import('../drizzle/schema.js');

      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Find the ticket by access token
      const [ticket] = await db
        .select()
        .from(tickets)
        .where(eq(tickets.accessToken, input.token))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket nicht gefunden' });
      }

      // Get non-internal comments for this ticket
      const comments = await db
        .select({
          id: ticketComments.id,
          content: ticketComments.comment,
          isInternal: ticketComments.isInternal,
          createdAt: ticketComments.createdAt,
          userName: users.name,
        })
        .from(ticketComments)
        .leftJoin(users, eq(ticketComments.userId, users.id))
        .where(
          and(
            eq(ticketComments.ticketId, ticket.id),
            eq(ticketComments.isInternal, false)
          )
        )
        .orderBy(desc(ticketComments.createdAt));

      return {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        customerName: ticket.customerName,
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        comments: comments.map(c => ({
          id: c.id,
          content: c.content,
          createdAt: c.createdAt,
          author: c.userName || 'Support',
        })),
      };
    }),
});
