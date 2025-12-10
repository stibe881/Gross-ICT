import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { smtpSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import nodemailer from "nodemailer";

export const smtpRouter = router({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(smtpSettings)
      .limit(1);

    if (!settings) {
      return null;
    }

    // Don't return password to client
    return {
      id: settings.id,
      host: settings.host,
      port: settings.port,
      secure: settings.secure === 1,
      user: settings.user,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
    };
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        host: z.string().min(1),
        port: z.number().int().min(1).max(65535),
        secure: z.boolean(),
        user: z.string().email(),
        password: z.string().optional(),
        fromEmail: z.string().email(),
        fromName: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if settings exist
      const [existing] = await db
        .select()
        .from(smtpSettings)
        .limit(1);

      const updateData: any = {
        host: input.host,
        port: input.port,
        secure: input.secure ? 1 : 0,
        user: input.user,
        fromEmail: input.fromEmail,
        fromName: input.fromName,
        updatedAt: new Date(),
      };

      // Only update password if provided
      if (input.password && input.password.length > 0) {
        updateData.password = input.password;
      }

      if (existing) {
        await db
          .update(smtpSettings)
          .set(updateData)
          .where(eq(smtpSettings.id, existing.id));
      } else {
        // For new settings, password is required
        if (!input.password) {
          throw new Error("Password is required for new SMTP configuration");
        }
        await db.insert(smtpSettings).values({
          ...updateData,
          password: input.password,
        });
      }

      return { success: true };
    }),

  testConnection: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [settings] = await db
      .select()
      .from(smtpSettings)
      .limit(1);

    if (!settings) {
      throw new Error("SMTP settings not configured");
    }

    try {
      const transporter = nodemailer.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure === 1,
        auth: {
          user: settings.user,
          pass: settings.password,
        },
      });

      await transporter.verify();
      return { success: true, message: "SMTP connection successful" };
    } catch (error: any) {
      throw new Error(`SMTP connection failed: ${error.message}`);
    }
  }),
});
