import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { favorites } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const favoritesRouter = router({
  // Get all favorites for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, ctx.user.id));
    
    return userFavorites;
  }),

  // Add a favorite
  add: protectedProcedure
    .input(
      z.object({
        itemType: z.string(),
        itemLabel: z.string(),
        itemPath: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if already exists
      const existing = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, ctx.user.id),
            eq(favorites.itemType, input.itemType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Dieser Favorit existiert bereits",
        });
      }

      const favorite = await db.insert(favorites).values({
        userId: ctx.user.id,
        itemType: input.itemType,
        itemLabel: input.itemLabel,
        itemPath: input.itemPath,
      });

      return { success: true, id: favorite[0].insertId };
    }),

  // Remove a favorite
  remove: protectedProcedure
    .input(
      z.object({
        itemType: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, ctx.user.id),
            eq(favorites.itemType, input.itemType)
          )
        );

      return { success: true };
    }),

  // Toggle favorite (add if not exists, remove if exists)
  toggle: protectedProcedure
    .input(
      z.object({
        itemType: z.string(),
        itemLabel: z.string(),
        itemPath: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const existing = await db
        .select()
        .from(favorites)
        .where(
          and(
            eq(favorites.userId, ctx.user.id),
            eq(favorites.itemType, input.itemType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Remove
        await db
          .delete(favorites)
          .where(
            and(
              eq(favorites.userId, ctx.user.id),
              eq(favorites.itemType, input.itemType)
            )
          );
        return { success: true, action: "removed" };
      } else {
        // Add
        await db.insert(favorites).values({
          userId: ctx.user.id,
          itemType: input.itemType,
          itemLabel: input.itemLabel,
          itemPath: input.itemPath,
        });
        return { success: true, action: "added" };
      }
    }),
});
