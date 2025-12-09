import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { smtpSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";
import { TRPCError } from "@trpc/server";

// Only admin can manage SMTP settings
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only administrators can manage SMTP settings",
    });
  }
  return next();
});

export const smtpRouter = router({
  // Get current SMTP settings
  getSettings: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
    const settings = await db.select().from(smtpSettings).where(eq(smtpSettings.isActive, true)).limit(1);
    
    if (settings.length === 0) {
      return null;
    }

    // Don't return the password to the client
    const { password, ...settingsWithoutPassword } = settings[0];
    return settingsWithoutPassword;
  }),

  // Update or create SMTP settings
  upsertSettings: adminProcedure
    .input(
      z.object({
        host: z.string().min(1, "Host is required"),
        port: z.number().int().min(1).max(65535),
        secure: z.boolean(),
        user: z.string().email("Valid email is required"),
        password: z.string().min(1, "Password is required"),
        fromEmail: z.string().email("Valid from email is required"),
        fromName: z.string().min(1, "From name is required"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Deactivate all existing settings
      await db.update(smtpSettings).set({ isActive: false });

      // Insert new settings
      const result = await db.insert(smtpSettings).values({
        ...input,
        isActive: true,
      });

      return {
        success: true,
        id: Number((result as any).insertId || 0),
      };
    }),

  // Test SMTP connection
  testConnection: adminProcedure
    .input(
      z.object({
        host: z.string(),
        port: z.number(),
        secure: z.boolean(),
        user: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const transporter = nodemailer.createTransport({
          host: input.host,
          port: input.port,
          secure: input.secure,
          auth: {
            user: input.user,
            pass: input.password,
          },
        });

        // Verify connection
        await transporter.verify();

        // Update last test status in database if settings exist
        const db = await getDb();
        if (!db) return { success: true, message: 'SMTP connection successful (DB unavailable for logging)' };
        const existingSettings = await db
          .select()
          .from(smtpSettings)
          .where(eq(smtpSettings.user, input.user))
          .limit(1);

        if (existingSettings.length > 0) {
          await db
            .update(smtpSettings)
            .set({
              lastTestStatus: "success",
              lastTestedAt: new Date(),
            })
            .where(eq(smtpSettings.id, existingSettings[0].id));
        }

        return {
          success: true,
          message: "SMTP connection successful",
        };
      } catch (error: any) {
        // Update last test status in database if settings exist
        const db = await getDb();
        if (!db) return { success: true, message: 'SMTP connection successful (DB unavailable for logging)' };
        const existingSettings = await db
          .select()
          .from(smtpSettings)
          .where(eq(smtpSettings.user, input.user))
          .limit(1);

        if (existingSettings.length > 0) {
          await db
            .update(smtpSettings)
            .set({
              lastTestStatus: "failed",
              lastTestedAt: new Date(),
            })
            .where(eq(smtpSettings.id, existingSettings[0].id));
        }

        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `SMTP connection failed: ${error.message}`,
        });
      }
    }),

  // Delete SMTP settings
  deleteSettings: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      await db.delete(smtpSettings).where(eq(smtpSettings.id, input.id));

      return {
        success: true,
      };
    }),
});
