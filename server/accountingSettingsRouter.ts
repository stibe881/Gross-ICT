import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { accountingSettings } from "../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const accountingSettingsRouter = router({
  // Get accounting settings (creates default if not exists)
  get: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const [existing] = await db.select().from(accountingSettings).limit(1);
      
      if (existing) {
        return existing;
      }

      // Create default settings
      const [result] = await db.insert(accountingSettings).values({
        companyName: "Gross ICT",
        companyEmail: "info@gross-ict.ch",
        companyCountry: "Schweiz",
        invoicePrefix: "RE-",
        quotePrefix: "AN-",
      });

      const [newSettings] = await db.select().from(accountingSettings).where(eq(accountingSettings.id, Number(result.insertId)));
      return newSettings;
    }),

  // Update accounting settings
  update: protectedProcedure
    .input(z.object({
      companyName: z.string(),
      companyAddress: z.string().optional(),
      companyCity: z.string().optional(),
      companyPostalCode: z.string().optional(),
      companyCountry: z.string().optional(),
      companyPhone: z.string().optional(),
      companyEmail: z.string().email(),
      companyWebsite: z.string().optional(),
      taxId: z.string().optional(),
      bankName: z.string().optional(),
      iban: z.string().optional(),
      invoicePrefix: z.string().optional(),
      quotePrefix: z.string().optional(),
      invoiceFooter: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      // Check if settings exist
      const [existing] = await db.select().from(accountingSettings).limit(1);

      if (existing) {
        // Update existing
        await db.update(accountingSettings)
          .set({
            ...input,
            updatedAt: new Date(),
          })
          .where(eq(accountingSettings.id, existing.id));
      } else {
        // Create new
        await db.insert(accountingSettings).values(input);
      }

      return { success: true };
    }),
});
