import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { customers } from "../drizzle/schema";
import { eq, like, or, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const customerRouter = router({
  // Get all customers with optional search
  all: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: z.enum(["company", "individual"]).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }: any) => {
      // Only admin and accounting roles can access
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      let query = db!.select().from(customers);

      if (input?.search) {
        query = query.where(
          or(
            like(customers.name, `%${input.search}%`),
            like(customers.email, `%${input.search}%`),
            like(customers.customerNumber, `%${input.search}%`),
            like(customers.contactPerson, `%${input.search}%`)
          )
        ) as any;
      }

      if (input?.type) {
        query = query.where(eq(customers.type, input.type)) as any;
      }

      const result = await query.orderBy(desc(customers.createdAt));
      return result;
    }),

  // Get customer by ID
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const [customer] = await db!
        .select()
        .from(customers)
        .where(eq(customers.id, input.id))
        .limit(1);

      if (!customer) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
      }

      return customer;
    }),

  // Create customer
  create: protectedProcedure
    .input(
      z.object({
        type: z.enum(["company", "individual"]),
        name: z.string().min(1),
        contactPerson: z.string().optional(),
        email: z.string().email(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().default("Schweiz"),
        paymentTermsDays: z.number().default(30),
        defaultVatRate: z.string().default("8.10"),
        defaultDiscount: z.string().default("0.00"),
        notes: z.string().optional(),
        userId: z.number().optional(),
        language: z.enum(["de", "en", "fr"]).default("de"),
        currency: z.string().length(3).default("CHF"),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      // Generate customer number
      const [lastCustomer] = await db!
        .select({ customerNumber: customers.customerNumber })
        .from(customers)
        .orderBy(desc(customers.id))
        .limit(1);

      let customerNumber = "K-0101";
      if (lastCustomer?.customerNumber) {
        const match = lastCustomer.customerNumber.match(/K-(\d+)/);
        if (match) {
          const nextNum = parseInt(match[1]) + 1;
          customerNumber = `K-${nextNum.toString().padStart(4, "0")}`;
        }
      } else {
        // First customer starts at 101
        customerNumber = "K-0101";
      }

      const [result] = await db!.insert(customers).values({
        ...input,
        customerNumber,
      });

      return { id: Number(result.insertId), customerNumber };
    }),

  // Update customer
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        type: z.enum(["company", "individual"]).optional(),
        name: z.string().min(1).optional(),
        contactPerson: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        postalCode: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
        paymentTermsDays: z.number().optional(),
        defaultVatRate: z.string().optional(),
        defaultDiscount: z.string().optional(),
        notes: z.string().optional(),
        userId: z.number().optional(),
        language: z.enum(["de", "en", "fr"]).optional(),
        currency: z.string().length(3).optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const { id, ...updateData } = input;

      await db!.update(customers).set(updateData).where(eq(customers.id, id));

      return { success: true };
    }),

  // Delete customer
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete customers" });
      }

      const db = await getDb();
      await db!.delete(customers).where(eq(customers.id, input.id));

      return { success: true };
    }),

  // Get customer statistics
  stats: protectedProcedure
    .input(z.object({ customerId: z.number() }))
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // This will be extended later with invoice and ticket stats
      return {
        totalInvoices: 0,
        totalRevenue: "0.00",
        openInvoices: 0,
        totalTickets: 0,
      };
    }),
});
