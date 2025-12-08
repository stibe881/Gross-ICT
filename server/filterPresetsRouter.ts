import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { filterPresets } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const filterPresetsRouter = router({
  /**
   * List all filter presets for current user
   */
  list: protectedProcedure
    .input(
      z.object({
        filterType: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { user } = ctx;

      const conditions = [eq(filterPresets.userId, user.id)];
      if (input.filterType) {
        conditions.push(eq(filterPresets.filterType, input.filterType));
      }

      const presets = await db
        .select()
        .from(filterPresets)
        .where(and(...conditions))
        .orderBy(desc(filterPresets.createdAt));

      return presets;
    }),

  /**
   * Create a new filter preset
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        filterType: z.string(),
        filters: z.string(), // JSON string
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { user } = ctx;

      // If this is set as default, unset other defaults for this filter type
      if (input.isDefault) {
        await db
          .update(filterPresets)
          .set({ isDefault: 0 })
          .where(
            and(
              eq(filterPresets.userId, user.id),
              eq(filterPresets.filterType, input.filterType)
            )
          );
      }

      const [newPreset] = await db.insert(filterPresets).values({
        userId: user.id,
        name: input.name,
        filterType: input.filterType,
        filters: input.filters,
        isDefault: input.isDefault ? 1 : 0,
      });

      return newPreset;
    }),

  /**
   * Update a filter preset
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        filters: z.string().optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { user } = ctx;

      // Verify ownership
      const [preset] = await db
        .select()
        .from(filterPresets)
        .where(
          and(
            eq(filterPresets.id, input.id),
            eq(filterPresets.userId, user.id)
          )
        );

      if (!preset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filter preset not found",
        });
      }

      // If this is set as default, unset other defaults for this filter type
      if (input.isDefault) {
        await db
          .update(filterPresets)
          .set({ isDefault: 0 })
          .where(
            and(
              eq(filterPresets.userId, user.id),
              eq(filterPresets.filterType, preset.filterType)
            )
          );
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.filters !== undefined) updateData.filters = input.filters;
      if (input.isDefault !== undefined) updateData.isDefault = input.isDefault ? 1 : 0;

      await db
        .update(filterPresets)
        .set(updateData)
        .where(eq(filterPresets.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a filter preset
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { user } = ctx;

      // Verify ownership
      const [preset] = await db
        .select()
        .from(filterPresets)
        .where(
          and(
            eq(filterPresets.id, input.id),
            eq(filterPresets.userId, user.id)
          )
        );

      if (!preset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Filter preset not found",
        });
      }

      await db.delete(filterPresets).where(eq(filterPresets.id, input.id));

      return { success: true };
    }),
});
