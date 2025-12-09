import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { contractTemplates, contractTemplateItems } from "../drizzle/schema";
import { eq, desc, like } from "drizzle-orm";

export const contractTemplateRouter = router({
  // Get all templates
  getAll: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        activeOnly: z.boolean().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db.select().from(contractTemplates).$dynamic();

      if (input.activeOnly) {
        query = query.where(eq(contractTemplates.isActive, 1));
      }

      if (input.search) {
        query = query.where(like(contractTemplates.name, `%${input.search}%`));
      }

      const results = await query.orderBy(desc(contractTemplates.createdAt));
      return results;
    }),

  // Get template by ID with items
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [template] = await db
        .select()
        .from(contractTemplates)
        .where(eq(contractTemplates.id, input.id));

      if (!template) throw new Error("Template not found");

      const items = await db
        .select()
        .from(contractTemplateItems)
        .where(eq(contractTemplateItems.templateId, input.id))
        .orderBy(contractTemplateItems.position);

      return { template, items };
    }),

  // Create new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        contractType: z.enum(["service", "license", "support", "hosting", "maintenance", "other"]),
        defaultBillingInterval: z.enum(["monthly", "quarterly", "yearly", "one_time"]),
        defaultDurationMonths: z.number(),
        defaultPaymentTermsDays: z.number(),
        defaultAutoRenew: z.number(),
        defaultRenewalNoticeDays: z.number(),
        defaultTerms: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            defaultQuantity: z.string(),
            defaultUnit: z.string(),
            defaultUnitPrice: z.string(),
            defaultVatRate: z.string(),
            defaultDiscount: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert template
      const [newTemplate] = await db.insert(contractTemplates).values({
        name: input.name,
        description: input.description,
        contractType: input.contractType,
        defaultBillingInterval: input.defaultBillingInterval,
        defaultDurationMonths: input.defaultDurationMonths,
        defaultPaymentTermsDays: input.defaultPaymentTermsDays,
        defaultAutoRenew: input.defaultAutoRenew,
        defaultRenewalNoticeDays: input.defaultRenewalNoticeDays,
        defaultTerms: input.defaultTerms,
        createdBy: ctx.user.id,
      });

      // Insert items
      const templateId = newTemplate.insertId;
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        await db.insert(contractTemplateItems).values({
          templateId,
          position: i + 1,
          description: item.description,
          defaultQuantity: item.defaultQuantity,
          defaultUnit: item.defaultUnit,
          defaultUnitPrice: item.defaultUnitPrice,
          defaultVatRate: item.defaultVatRate,
          defaultDiscount: item.defaultDiscount,
        });
      }

      return { id: templateId };
    }),

  // Update template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string(),
        description: z.string().optional(),
        contractType: z.enum(["service", "license", "support", "hosting", "maintenance", "other"]),
        defaultBillingInterval: z.enum(["monthly", "quarterly", "yearly", "one_time"]),
        defaultDurationMonths: z.number(),
        defaultPaymentTermsDays: z.number(),
        defaultAutoRenew: z.number(),
        defaultRenewalNoticeDays: z.number(),
        defaultTerms: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            defaultQuantity: z.string(),
            defaultUnit: z.string(),
            defaultUnitPrice: z.string(),
            defaultVatRate: z.string(),
            defaultDiscount: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update template
      await db
        .update(contractTemplates)
        .set({
          name: input.name,
          description: input.description,
          contractType: input.contractType,
          defaultBillingInterval: input.defaultBillingInterval,
          defaultDurationMonths: input.defaultDurationMonths,
          defaultPaymentTermsDays: input.defaultPaymentTermsDays,
          defaultAutoRenew: input.defaultAutoRenew,
          defaultRenewalNoticeDays: input.defaultRenewalNoticeDays,
          defaultTerms: input.defaultTerms,
        })
        .where(eq(contractTemplates.id, input.id));

      // Delete old items
      await db.delete(contractTemplateItems).where(eq(contractTemplateItems.templateId, input.id));

      // Insert new items
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        await db.insert(contractTemplateItems).values({
          templateId: input.id,
          position: i + 1,
          description: item.description,
          defaultQuantity: item.defaultQuantity,
          defaultUnit: item.defaultUnit,
          defaultUnitPrice: item.defaultUnitPrice,
          defaultVatRate: item.defaultVatRate,
          defaultDiscount: item.defaultDiscount,
        });
      }

      return { success: true };
    }),

  // Toggle active status
  toggleActive: protectedProcedure
    .input(z.object({ id: z.number(), isActive: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(contractTemplates)
        .set({ isActive: input.isActive })
        .where(eq(contractTemplates.id, input.id));

      return { success: true };
    }),

  // Delete template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete items first
      await db.delete(contractTemplateItems).where(eq(contractTemplateItems.templateId, input.id));

      // Delete template
      await db.delete(contractTemplates).where(eq(contractTemplates.id, input.id));

      return { success: true };
    }),
});
