import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const automationRouter = router({
  // Get all automation rules
  all: adminProcedure.query(async () => {
    const { getDb } = await import('./db.js');
    const { automationRules } = await import('../drizzle/schema.js');
    
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    
    return await db.select().from(automationRules);
  }),

  // Get rule by ID
  byId: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { automationRules } = await import('../drizzle/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [rule] = await db.select().from(automationRules).where(eq(automationRules.id, input.id));
      if (!rule) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Rule not found' });
      }
      
      return rule;
    }),

  // Create new rule
  create: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      triggerType: z.string(),
      conditions: z.string(), // JSON string
      actions: z.string(), // JSON string
    }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import('./db.js');
      const { automationRules } = await import('../drizzle/schema.js');
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const [result] = await db.insert(automationRules).values({
        name: input.name,
        description: input.description || null,
        triggerType: input.triggerType,
        conditions: input.conditions,
        actions: input.actions,
        createdBy: ctx.user!.id,
        isEnabled: 1,
      });
      
      return { success: true, id: result.insertId };
    }),

  // Update rule
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      triggerType: z.string().optional(),
      conditions: z.string().optional(),
      actions: z.string().optional(),
      isEnabled: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { automationRules } = await import('../drizzle/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      const { id, ...updates } = input;
      await db.update(automationRules)
        .set(updates)
        .where(eq(automationRules.id, id));
      
      return { success: true };
    }),

  // Delete rule
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { automationRules } = await import('../drizzle/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.delete(automationRules).where(eq(automationRules.id, input.id));
      
      return { success: true };
    }),

  // Toggle rule enabled/disabled
  toggle: adminProcedure
    .input(z.object({ id: z.number(), isEnabled: z.number() }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { automationRules } = await import('../drizzle/schema.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      await db.update(automationRules)
        .set({ isEnabled: input.isEnabled })
        .where(eq(automationRules.id, input.id));
      
      return { success: true };
    }),

  // Execute rules for a trigger
  execute: protectedProcedure
    .input(z.object({
      triggerType: z.string(),
      ticketId: z.number(),
      ticketData: z.any(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { automationRules, tickets } = await import('../drizzle/schema.js');
      const { eq, and } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      
      // Get all enabled rules for this trigger type
      const rules = await db.select()
        .from(automationRules)
        .where(and(
          eq(automationRules.triggerType, input.triggerType),
          eq(automationRules.isEnabled, 1)
        ));
      
      const executedActions: string[] = [];
      
      for (const rule of rules) {
        try {
          const conditions = JSON.parse(rule.conditions);
          const actions = JSON.parse(rule.actions);
          
          // Check if all conditions are met
          let conditionsMet = true;
          for (const condition of conditions) {
            const { field, operator, value } = condition;
            const ticketValue = input.ticketData[field];
            
            switch (operator) {
              case 'equals':
                if (ticketValue !== value) conditionsMet = false;
                break;
              case 'not_equals':
                if (ticketValue === value) conditionsMet = false;
                break;
              case 'contains':
                if (!String(ticketValue).includes(value)) conditionsMet = false;
                break;
              case 'greater_than':
                if (Number(ticketValue) <= Number(value)) conditionsMet = false;
                break;
              case 'less_than':
                if (Number(ticketValue) >= Number(value)) conditionsMet = false;
                break;
            }
            
            if (!conditionsMet) break;
          }
          
          // Execute actions if conditions are met
          if (conditionsMet) {
            for (const action of actions) {
              const { type, value } = action;
              
              switch (type) {
                case 'set_status':
                  await db.update(tickets)
                    .set({ status: value })
                    .where(eq(tickets.id, input.ticketId));
                  executedActions.push(`Set status to ${value}`);
                  break;
                  
                case 'set_priority':
                  await db.update(tickets)
                    .set({ priority: value })
                    .where(eq(tickets.id, input.ticketId));
                  executedActions.push(`Set priority to ${value}`);
                  break;
                  
                case 'assign_to':
                  await db.update(tickets)
                    .set({ assignedTo: Number(value) })
                    .where(eq(tickets.id, input.ticketId));
                  executedActions.push(`Assigned to user ${value}`);
                  break;
                  
                case 'send_email':
                  // TODO: Implement email sending
                  executedActions.push(`Email sent to ${value}`);
                  break;
              }
            }
          }
        } catch (error) {
          console.error(`Error executing rule ${rule.id}:`, error);
        }
      }
      
      return { success: true, executedActions };
    }),
});
