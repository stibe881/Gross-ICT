import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { contracts, customers } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const contractSignatureRouter = router({
  // Sign contract as customer
  signAsCustomer: protectedProcedure
    .input(z.object({
      contractId: z.number(),
      signerName: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, input.contractId));

      if (!contract) throw new Error("Contract not found");

      // Determine new signature status
      let newStatus = "customer_signed";
      if (contract.companySignedAt) {
        newStatus = "fully_signed";
      }

      await db
        .update(contracts)
        .set({
          customerSignedAt: new Date(),
          customerSignedBy: input.signerName,
          signatureStatus: newStatus,
        })
        .where(eq(contracts.id, input.contractId));

      return { success: true, status: newStatus };
    }),

  // Sign contract as company
  signAsCompany: protectedProcedure
    .input(z.object({
      contractId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, input.contractId));

      if (!contract) throw new Error("Contract not found");

      // Determine new signature status
      let newStatus = "company_signed";
      if (contract.customerSignedAt) {
        newStatus = "fully_signed";
      }

      await db
        .update(contracts)
        .set({
          companySignedAt: new Date(),
          companySignedBy: ctx.user.id,
          signatureStatus: newStatus,
        })
        .where(eq(contracts.id, input.contractId));

      return { success: true, status: newStatus };
    }),

  // Get signature status
  getSignatureStatus: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [contract] = await db
        .select({
          signatureStatus: contracts.signatureStatus,
          customerSignedAt: contracts.customerSignedAt,
          customerSignedBy: contracts.customerSignedBy,
          companySignedAt: contracts.companySignedAt,
          companySignedBy: contracts.companySignedBy,
        })
        .from(contracts)
        .where(eq(contracts.id, input.contractId));

      if (!contract) throw new Error("Contract not found");

      return contract;
    }),

  // Reset signatures (admin only)
  resetSignatures: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(contracts)
        .set({
          signatureStatus: "unsigned",
          customerSignedAt: null,
          customerSignedBy: null,
          companySignedAt: null,
          companySignedBy: null,
        })
        .where(eq(contracts.id, input.contractId));

      return { success: true };
    }),
});
