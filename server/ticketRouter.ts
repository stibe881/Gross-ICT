import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { createTicket, getTicketsByUserId, getAllTickets, getTicketById, updateTicket, getUserByEmail, createUser } from './db';
import bcrypt from 'bcrypt';

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
});
