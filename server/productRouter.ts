import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { products } from "../drizzle/schema";
import { eq, like, or, and } from "drizzle-orm";

export const productRouter = router({
  // Get all products with optional filters
  all: publicProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          category: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      
      const conditions = [];
      
      if (input?.search) {
        conditions.push(
          or(
            like(products.name, `%${input.search}%`),
            like(products.sku, `%${input.search}%`),
            like(products.description, `%${input.search}%`)
          )
        );
      }
      
      if (input?.category) {
        conditions.push(eq(products.category, input.category));
      }
      
      if (input?.isActive !== undefined) {
        conditions.push(eq(products.isActive, input.isActive));
      }
      
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
      
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(products)
        .where(whereClause)
        .orderBy(products.name);
    }),

  // Get product by ID
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const result = await db
        .select()
        .from(products)
        .where(eq(products.id, input.id))
        .limit(1);
      return result[0] || null;
    }),

  // Create new product
  create: publicProcedure
    .input(
      z.object({
        sku: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        unitPrice: z.string(),
        unit: z.string().default("Stück"),
        vatRate: z.string().default("8.10"),
        isActive: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.insert(products).values({
        sku: input.sku || null,
        name: input.name,
        description: input.description || null,
        category: input.category || null,
        unitPrice: input.unitPrice,
        unit: input.unit,
        vatRate: input.vatRate,
        isActive: input.isActive,
      });
      
      return { id: Number((result as any).insertId) };
    }),

  // Update product
  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        sku: z.string().optional(),
        name: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        unitPrice: z.string(),
        unit: z.string(),
        vatRate: z.string(),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db
        .update(products)
        .set({
          sku: input.sku || null,
          name: input.name,
          description: input.description || null,
          category: input.category || null,
          unitPrice: input.unitPrice,
          unit: input.unit,
          vatRate: input.vatRate,
          isActive: input.isActive,
        })
        .where(eq(products.id, input.id));
      
      return { success: true };
    }),

  // Delete product
  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      await db.delete(products).where(eq(products.id, input.id));
      
      return { success: true };
    }),

  // Get unique categories
  categories: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    const result = await db
      .selectDistinct({ category: products.category })
      .from(products)
      .where(eq(products.isActive, true));
    
    return result
      .map((r) => r.category)
      .filter((c): c is string => c !== null)
      .sort();
  }),
});
