import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from './_core/trpc';

// Admin or Support procedure
const adminOrSupportProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'support') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin or Support access required' });
  }
  return next({ ctx });
});

export const recurringInvoiceRouter = router({
  // Get all recurring invoices
  all: adminOrSupportProcedure
    .query(async () => {
      const { getDb } = await import('./db.js');
      const { recurringInvoices, customers } = await import('../drizzle/schema_accounting.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) return [];
      
      const recurring = await db.select().from(recurringInvoices);
      
      // Fetch customer data for each recurring invoice
      const withCustomers = await Promise.all(
        recurring.map(async (r) => {
          const customer = await db.select().from(customers).where(eq(customers.id, r.customerId)).limit(1);
          return {
            ...r,
            customer: customer[0] || null,
          };
        })
      );
      
      return withCustomers;
    }),

  // Get by ID
  byId: adminOrSupportProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { recurringInvoices, customers } = await import('../drizzle/schema_accounting.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      const recurring = await db.select().from(recurringInvoices).where(eq(recurringInvoices.id, input.id)).limit(1);
      if (!recurring || recurring.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recurring invoice not found' });
      }
      
      const customer = await db.select().from(customers).where(eq(customers.id, recurring[0].customerId)).limit(1);
      
      return {
        ...recurring[0],
        customer: customer[0] || null,
        items: JSON.parse(recurring[0].items),
      };
    }),

  // Create recurring invoice
  create: adminOrSupportProcedure
    .input(z.object({
      customerId: z.number(),
      templateName: z.string(),
      interval: z.enum(['monthly', 'quarterly', 'yearly']),
      nextRunDate: z.string(),
      notes: z.string().optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.string(),
        unit: z.string(),
        unitPrice: z.string(),
        vatRate: z.string(),
        discount: z.string(),
      })),
      discount: z.string().optional(),
      taxRate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { recurringInvoices } = await import('../drizzle/schema_accounting.js');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      const [result] = await db.insert(recurringInvoices).values({
        customerId: input.customerId,
        templateName: input.templateName,
        interval: input.interval,
        nextRunDate: new Date(input.nextRunDate),
        notes: input.notes || null,
        items: JSON.stringify(input.items),
        discount: input.discount || '0',
        taxRate: input.taxRate || '8.1',
        isActive: true,
      });
      
      return { success: true, id: Number(result.insertId) };
    }),

  // Update recurring invoice
  update: adminOrSupportProcedure
    .input(z.object({
      id: z.number(),
      templateName: z.string().optional(),
      interval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
      nextRunDate: z.string().optional(),
      notes: z.string().optional(),
      items: z.array(z.object({
        description: z.string(),
        quantity: z.string(),
        unit: z.string(),
        unitPrice: z.string(),
        vatRate: z.string(),
        discount: z.string(),
      })).optional(),
      discount: z.string().optional(),
      taxRate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { recurringInvoices } = await import('../drizzle/schema_accounting.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      const updateData: any = {};
      if (input.templateName) updateData.templateName = input.templateName;
      if (input.interval) updateData.interval = input.interval;
      if (input.nextRunDate) updateData.nextRunDate = new Date(input.nextRunDate);
      if (input.notes !== undefined) updateData.notes = input.notes;
      if (input.items) updateData.items = JSON.stringify(input.items);
      if (input.discount !== undefined) updateData.discount = input.discount;
      if (input.taxRate !== undefined) updateData.taxRate = input.taxRate;
      
      await db.update(recurringInvoices)
        .set(updateData)
        .where(eq(recurringInvoices.id, input.id));
      
      return { success: true };
    }),

  // Toggle active status
  toggleActive: adminOrSupportProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { recurringInvoices } = await import('../drizzle/schema_accounting.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      await db.update(recurringInvoices)
        .set({ isActive: input.isActive })
        .where(eq(recurringInvoices.id, input.id));
      
      return { success: true };
    }),

  // Delete recurring invoice
  delete: adminOrSupportProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { recurringInvoices } = await import('../drizzle/schema_accounting.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      await db.delete(recurringInvoices).where(eq(recurringInvoices.id, input.id));
      
      return { success: true };
    }),
});
