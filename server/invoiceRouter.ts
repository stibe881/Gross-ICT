import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invoices, invoiceItems, quotes, quoteItems, customers } from "../drizzle/schema";
import { eq, like, or, desc, and, gte, lte, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Helper function to calculate totals
function calculateTotals(items: Array<{
  quantity: string;
  unitPrice: string;
  discount: string;
  vatRate: string;
}>) {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalVat = 0;

  for (const item of items) {
    const qty = parseFloat(item.quantity);
    const price = parseFloat(item.unitPrice);
    const disc = parseFloat(item.discount);
    const vat = parseFloat(item.vatRate);

    const itemTotal = qty * price;
    const itemDiscount = itemTotal * (disc / 100);
    const itemAfterDiscount = itemTotal - itemDiscount;
    const itemVat = itemAfterDiscount * (vat / 100);

    subtotal += itemTotal;
    totalDiscount += itemDiscount;
    totalVat += itemVat;
  }

  const total = subtotal - totalDiscount + totalVat;

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: totalDiscount.toFixed(2),
    vatAmount: totalVat.toFixed(2),
    totalAmount: total.toFixed(2),
  };
}

// Helper function to generate invoice number
async function generateInvoiceNumber(db: any, prefix: string = "") {
  const year = new Date().getFullYear();
  const [lastInvoice] = await db!
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(like(invoices.invoiceNumber, `${prefix}${year}-%`))
    .orderBy(desc(invoices.id))
    .limit(1);

  let nextNum = 1;
  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(/-(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}${year}-${nextNum.toString().padStart(3, "0")}`;
}

// Helper function to generate quote number
async function generateQuoteNumber(db: any, prefix: string = "OFF-") {
  const year = new Date().getFullYear();
  const [lastQuote] = await db!
    .select({ quoteNumber: quotes.quoteNumber })
    .from(quotes)
    .where(like(quotes.quoteNumber, `${prefix}${year}-%`))
    .orderBy(desc(quotes.id))
    .limit(1);

  let nextNum = 1;
  if (lastQuote?.quoteNumber) {
    const match = lastQuote.quoteNumber.match(/-(\d+)$/);
    if (match) {
      nextNum = parseInt(match[1]) + 1;
    }
  }

  return `${prefix}${year}-${nextNum.toString().padStart(3, "0")}`;
}

export const invoiceRouter = router({
  // Get all invoices with filters
  all: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
        customerId: z.number().optional(),
        year: z.number().optional(),
        month: z.number().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      let conditions = [];

      if (input?.search) {
        conditions.push(
          or(
            like(invoices.invoiceNumber, `%${input.search}%`),
            like(invoices.notes, `%${input.search}%`)
          )
        );
      }

      if (input?.status) {
        conditions.push(eq(invoices.status, input.status));
      }

      if (input?.customerId) {
        conditions.push(eq(invoices.customerId, input.customerId));
      }

      if (input?.year) {
        const startDate = new Date(input.year, 0, 1);
        const endDate = new Date(input.year, 11, 31, 23, 59, 59);
        conditions.push(
          and(
            gte(invoices.invoiceDate, startDate),
            lte(invoices.invoiceDate, endDate)
          )
        );
      }

      if (input?.month && input?.year) {
        const startDate = new Date(input.year, input.month - 1, 1);
        const endDate = new Date(input.year, input.month, 0, 23, 59, 59);
        conditions.push(
          and(
            gte(invoices.invoiceDate, startDate),
            lte(invoices.invoiceDate, endDate)
          )
        );
      }

      const result = await db!
        .select({
          invoice: invoices,
          customer: customers,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(invoices.invoiceDate));

      return result.map(r => ({
        ...r.invoice,
        customer: r.customer,
      }));
    }),

  // Get invoice by ID with items
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const [invoice] = await db!
        .select({
          invoice: invoices,
          customer: customers,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(eq(invoices.id, input.id))
        .limit(1);

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      const items = await db!
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, input.id))
        .orderBy(invoiceItems.position);

      return {
        ...invoice.invoice,
        customer: invoice.customer,
        items,
      };
    }),

  // Create invoice
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        invoiceDate: z.date().optional(),
        dueDate: z.date(),
        notes: z.string().optional(),
        footerText: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.string(),
            unit: z.string(),
            unitPrice: z.string(),
            vatRate: z.string(),
            discount: z.string().default("0.00"),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const invoiceNumber = await generateInvoiceNumber(db);
      const totals = calculateTotals(input.items);

      const [result] = await db!.insert(invoices).values({
        invoiceNumber,
        customerId: input.customerId,
        invoiceDate: input.invoiceDate || new Date(),
        dueDate: input.dueDate,
        status: "draft",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        notes: input.notes,
        footerText: input.footerText,
        createdBy: ctx.user.id,
      });

      const invoiceId = Number(result.insertId);

      // Insert items
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        const disc = parseFloat(item.discount);
        const itemTotal = qty * price * (1 - disc / 100);

        await db!.insert(invoiceItems).values({
          invoiceId,
          position: i + 1,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount,
          total: itemTotal.toFixed(2),
        });
      }

      return { id: invoiceId, invoiceNumber };
    }),

  // Update invoice
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        customerId: z.number().optional(),
        invoiceDate: z.date().optional(),
        dueDate: z.date().optional(),
        status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).optional(),
        notes: z.string().optional(),
        footerText: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.string(),
            unit: z.string(),
            unitPrice: z.string(),
            vatRate: z.string(),
            discount: z.string().default("0.00"),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const { id, items, ...updateData } = input;

      // If items are provided, recalculate totals
      if (items) {
        const totals = calculateTotals(items);
        Object.assign(updateData, totals);

        // Delete old items
        await db!.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id));

        // Insert new items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const qty = parseFloat(item.quantity);
          const price = parseFloat(item.unitPrice);
          const disc = parseFloat(item.discount);
          const itemTotal = qty * price * (1 - disc / 100);

          await db!.insert(invoiceItems).values({
            invoiceId: id,
            position: i + 1,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            total: itemTotal.toFixed(2),
          });
        }
      }

      await db!.update(invoices).set(updateData).where(eq(invoices.id, id));

      return { success: true };
    }),

  // Mark invoice as paid
  markPaid: protectedProcedure
    .input(z.object({ id: z.number(), paidDate: z.date().optional() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      await db!.update(invoices).set({
        status: "paid",
        paidDate: input.paidDate || new Date(),
      }).where(eq(invoices.id, input.id));

      return { success: true };
    }),

  // Delete invoice
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete invoices" });
      }

      const db = await getDb();
      await db!.delete(invoiceItems).where(eq(invoiceItems.invoiceId, input.id));
      await db!.delete(invoices).where(eq(invoices.id, input.id));

      return { success: true };
    }),

  // Get revenue statistics
  stats: protectedProcedure
    .input(
      z.object({
        year: z.number().optional(),
        customerId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      let conditions = [eq(invoices.status, "paid")];

      if (input?.year) {
        const startDate = new Date(input.year, 0, 1);
        const endDate = new Date(input.year, 11, 31, 23, 59, 59);
        conditions.push(
          and(
            gte(invoices.invoiceDate, startDate),
            lte(invoices.invoiceDate, endDate)
          ) as any
        );
      }

      if (input?.customerId) {
        conditions.push(eq(invoices.customerId, input.customerId));
      }

      const result = await db!
        .select({
          totalRevenue: sql<string>`SUM(${invoices.totalAmount})`,
          invoiceCount: sql<number>`COUNT(*)`,
        })
        .from(invoices)
        .where(and(...conditions));

      return {
        totalRevenue: result[0]?.totalRevenue || "0.00",
        invoiceCount: result[0]?.invoiceCount || 0,
      };
    }),

  // Get open invoices
  openInvoices: protectedProcedure
    .query(async ({ ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const result = await db!
        .select({
          invoice: invoices,
          customer: customers,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(
          or(
            eq(invoices.status, "sent"),
            eq(invoices.status, "overdue")
          )
        )
        .orderBy(invoices.dueDate);

      return result.map(r => ({
        ...r.invoice,
        customer: r.customer,
      }));
    }),
});

export const quoteRouter = router({
  // Get all quotes
  all: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
        customerId: z.number().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      let conditions = [];

      if (input?.search) {
        conditions.push(
          or(
            like(quotes.quoteNumber, `%${input.search}%`),
            like(quotes.notes, `%${input.search}%`)
          )
        );
      }

      if (input?.status) {
        conditions.push(eq(quotes.status, input.status));
      }

      if (input?.customerId) {
        conditions.push(eq(quotes.customerId, input.customerId));
      }

      const result = await db!
        .select({
          quote: quotes,
          customer: customers,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(quotes.quoteDate));

      return result.map(r => ({
        ...r.quote,
        customer: r.customer,
      }));
    }),

  // Get quote by ID with items
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const [quote] = await db!
        .select({
          quote: quotes,
          customer: customers,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .where(eq(quotes.id, input.id))
        .limit(1);

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      const items = await db!
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, input.id))
        .orderBy(quoteItems.position);

      return {
        ...quote.quote,
        customer: quote.customer,
        items,
      };
    }),

  // Create quote
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        quoteDate: z.date().optional(),
        validUntil: z.date(),
        notes: z.string().optional(),
        footerText: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.string(),
            unit: z.string(),
            unitPrice: z.string(),
            vatRate: z.string(),
            discount: z.string().default("0.00"),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const quoteNumber = await generateQuoteNumber(db);
      const totals = calculateTotals(input.items);

      const [result] = await db!.insert(quotes).values({
        quoteNumber,
        customerId: input.customerId,
        quoteDate: input.quoteDate || new Date(),
        validUntil: input.validUntil,
        status: "draft",
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        vatAmount: totals.vatAmount,
        totalAmount: totals.totalAmount,
        notes: input.notes,
        footerText: input.footerText,
        createdBy: ctx.user.id,
      });

      const quoteId = Number(result.insertId);

      // Insert items
      for (let i = 0; i < input.items.length; i++) {
        const item = input.items[i];
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        const disc = parseFloat(item.discount);
        const itemTotal = qty * price * (1 - disc / 100);

        await db!.insert(quoteItems).values({
          quoteId,
          position: i + 1,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount,
          total: itemTotal.toFixed(2),
        });
      }

      return { id: quoteId, quoteNumber };
    }),

  // Convert quote to invoice
  convertToInvoice: protectedProcedure
    .input(z.object({ quoteId: z.number(), dueDate: z.date() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();

      // Get quote with items
      const [quote] = await db!
        .select()
        .from(quotes)
        .where(eq(quotes.id, input.quoteId))
        .limit(1);

      if (!quote) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      const items = await db!
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, input.quoteId))
        .orderBy(quoteItems.position);

      // Create invoice
      const invoiceNumber = await generateInvoiceNumber(db);
      const [result] = await db!.insert(invoices).values({
        invoiceNumber,
        customerId: quote.customerId,
        invoiceDate: new Date(),
        dueDate: input.dueDate,
        status: "draft",
        subtotal: quote.subtotal,
        discountAmount: quote.discountAmount,
        vatAmount: quote.vatAmount,
        totalAmount: quote.totalAmount,
        notes: quote.notes,
        footerText: quote.footerText,
        createdBy: ctx.user.id,
      });

      const invoiceId = Number(result.insertId);

      // Copy items
      for (const item of items) {
        await db!.insert(invoiceItems).values({
          invoiceId,
          position: item.position,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount,
          total: item.total,
        });
      }

      // Update quote status and link to invoice
      await db!.update(quotes).set({
        status: "accepted",
        invoiceId,
      }).where(eq(quotes.id, input.quoteId));

      return { invoiceId, invoiceNumber };
    }),

  // Update quote
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        customerId: z.number().optional(),
        quoteDate: z.date().optional(),
        validUntil: z.date().optional(),
        status: z.enum(["draft", "sent", "accepted", "rejected", "expired"]).optional(),
        notes: z.string().optional(),
        footerText: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.string(),
            unit: z.string(),
            unitPrice: z.string(),
            vatRate: z.string(),
            discount: z.string().default("0.00"),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const { id, items, ...updateData } = input;

      // If items are provided, recalculate totals
      if (items) {
        const totals = calculateTotals(items);
        Object.assign(updateData, totals);

        // Delete old items
        await db!.delete(quoteItems).where(eq(quoteItems.quoteId, id));

        // Insert new items
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const qty = parseFloat(item.quantity);
          const price = parseFloat(item.unitPrice);
          const disc = parseFloat(item.discount);
          const itemTotal = qty * price * (1 - disc / 100);

          await db!.insert(quoteItems).values({
            quoteId: id,
            position: i + 1,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            vatRate: item.vatRate,
            discount: item.discount,
            total: itemTotal.toFixed(2),
          });
        }
      }

      await db!.update(quotes).set(updateData).where(eq(quotes.id, id));

      return { success: true };
    }),

  // Delete quote
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can delete quotes" });
      }

      const db = await getDb();
      await db!.delete(quoteItems).where(eq(quoteItems.quoteId, input.id));
      await db!.delete(quotes).where(eq(quotes.id, input.id));

      return { success: true };
    }),

  // Get invoice statistics
  statistics: protectedProcedure
    .input(z.object({ year: z.number() }).optional())
    .query(async ({ input, ctx }) => {
      if (!['admin', 'accounting', 'support'].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const year = input?.year || new Date().getFullYear();

      // Get all invoices for the year
      const yearInvoices = await db!
        .select()
        .from(invoices)
        .where(
          and(
            gte(invoices.invoiceDate, new Date(`${year}-01-01`)),
            lte(invoices.invoiceDate, new Date(`${year}-12-31`))
          )
        );

      const totalRevenue = yearInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + parseFloat(inv.totalAmount), 0);

      const paidInvoices = yearInvoices.filter((inv: any) => inv.status === 'paid').length;

      return {
        totalRevenue,
        totalInvoices: yearInvoices.length,
        paidInvoices,
        year,
      };
    }),

  // Get invoices for the logged-in customer (customer portal)
  myInvoices: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "user") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only customers can access this endpoint" });
    }

    const db = await getDb();
    
    // Find customer by user email
    const [customer] = await db!
      .select()
      .from(customers)
      .where(eq(customers.email, ctx.user.email!))
      .limit(1);

    if (!customer) {
      return [];
    }

    // Get all invoices for this customer (exclude drafts)
    const customerInvoices = await db!
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.customerId, customer.id),
          sql`${invoices.status} != 'draft'`
        )
      )
      .orderBy(desc(invoices.invoiceDate));

    return customerInvoices;
  }),
});

