import { router, protectedProcedure } from "./_core/trpc.js";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

/**
 * User management router - Admin only
 */
export const userRouter = router({
  /**
   * Get all users (admin only)
   */
  all: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Nur Administratoren können Benutzer verwalten",
      });
    }

    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    return await db.select().from(users);
  }),

  /**
   * Create a new user (admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(["user", "support", "accounting", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur Administratoren können Benutzer erstellen",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Ein Benutzer mit dieser E-Mail existiert bereits",
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 10);

      // Create user
      const [newUser] = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role,
        loginMethod: "local",
        openId: `local-${Date.now()}-${Math.random()}`, // Generate unique openId for local users
      });

      return { success: true, userId: newUser.insertId };
    }),

  /**
   * Update user role (admin only)
   */
  updateRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        role: z.enum(["user", "support", "accounting", "admin"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur Administratoren können Rollen ändern",
        });
      }

      // Prevent admin from changing their own role
      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sie können Ihre eigene Rolle nicht ändern",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Delete user (admin only)
   */
  delete: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur Administratoren können Benutzer löschen",
        });
      }

      // Prevent admin from deleting themselves
      if (ctx.user.id === input.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Sie können sich nicht selbst löschen",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(users).where(eq(users.id, input.userId));

      return { success: true };
    }),

  /**
   * Reset user password (admin only)
   */
  resetPassword: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Nur Administratoren können Passwörter zurücksetzen",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const hashedPassword = await bcrypt.hash(input.newPassword, 10);

      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, input.userId));

      return { success: true };
    }),
});
