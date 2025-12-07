import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { protectedProcedure, router } from './_core/trpc';

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

export const templateRouter = router({
  // Get all templates
  all: adminOrSupportProcedure.query(async () => {
    const { getDb } = await import('./db.js');
    const { responseTemplates } = await import('../drizzle/schema.js');
    
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    return await db.select().from(responseTemplates);
  }),

  // Get templates by category
  byCategory: adminOrSupportProcedure
    .input(z.object({
      category: z.enum(['network', 'security', 'hardware', 'software', 'email', 'other', 'general']),
    }))
    .query(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { responseTemplates } = await import('../drizzle/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      return await db.select().from(responseTemplates).where(eq(responseTemplates.category, input.category));
    }),

  // Create template (admin only)
  create: adminProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      category: z.enum(['network', 'security', 'hardware', 'software', 'email', 'other', 'general']),
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import('./db.js');
      const { responseTemplates } = await import('../drizzle/schema.js');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const result = await db.insert(responseTemplates).values({
        title: input.title,
        content: input.content,
        category: input.category,
        createdBy: ctx.user.id,
      });
      
      return { success: true, id: Number((result as any).insertId) };
    }),

  // Update template (admin only)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      category: z.enum(['network', 'security', 'hardware', 'software', 'email', 'other', 'general']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { responseTemplates } = await import('../drizzle/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      const updateData: any = {};
      if (input.title) updateData.title = input.title;
      if (input.content) updateData.content = input.content;
      if (input.category) updateData.category = input.category;
      
      await db.update(responseTemplates)
        .set(updateData)
        .where(eq(responseTemplates.id, input.id));
      
      return { success: true };
    }),

  // Delete template (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { responseTemplates } = await import('../drizzle/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      await db.delete(responseTemplates).where(eq(responseTemplates.id, input.id));
      
      return { success: true };
    }),
});
