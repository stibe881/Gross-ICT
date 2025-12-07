import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { createTicket, getTicketsByUserId, getAllTickets, getTicketById, updateTicket, getUserByEmail, createUser } from './db';
import bcrypt from 'bcrypt';

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

      // Calculate SLA due date based on priority
      const slaHours = {
        urgent: 4,    // 4 hours
        high: 24,     // 1 day
        medium: 72,   // 3 days
        low: 168,     // 7 days
      };
      const slaDueDate = new Date();
      slaDueDate.setHours(slaDueDate.getHours() + slaHours[input.priority]);

      const ticketId = await createTicket({
        userId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        company: input.company || null,
        subject: input.subject,
        message: input.message,
        priority: input.priority,
        category: input.category,
        status: 'open',
        slaDueDate,
        slaBreached: 0,
        escalationLevel: 0,
      });

      return {
        success: true,
        ticketId,
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

  // Update ticket (admin only)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      adminNotes: z.string().optional(),
      assignedTo: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      const updateData: any = { ...updates };
      if (updates.status === 'resolved' || updates.status === 'closed') {
        updateData.resolvedAt = new Date();
      }

      await updateTicket(id, updateData);

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
});
