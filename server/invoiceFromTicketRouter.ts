import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invoices, invoiceItems, tickets, customers } from "../drizzle/schema";
import { eq, inArray, desc, like } from "drizzle-orm";
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

export const invoiceFromTicketRouter = router({
  // Create invoice from tickets
  createFromTickets: protectedProcedure
    .input(
      z.object({
        ticketIds: z.array(z.number()),
        customerId: z.number(),
        dueDate: z.date(),
        hourlyRate: z.number().default(120), // Default hourly rate in CHF
        notes: z.string().optional(),
        footerText: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();

      // Get tickets
      const ticketList = await db!
        .select()
        .from(tickets)
        .where(inArray(tickets.id, input.ticketIds));

      if (ticketList.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No tickets found" });
      }

      // Generate invoice items from tickets
      const items = ticketList.map(ticket => {
        // Estimate hours based on priority (this is a simple heuristic)
        let estimatedHours = 1;
        switch (ticket.priority) {
          case "low": estimatedHours = 0.5; break;
          case "medium": estimatedHours = 1; break;
          case "high": estimatedHours = 2; break;
          case "urgent": estimatedHours = 3; break;
        }

        return {
          description: `Ticket #${ticket.id}: ${ticket.subject}`,
          quantity: estimatedHours.toString(),
          unit: "Stunden",
          unitPrice: input.hourlyRate.toString(),
          vatRate: "8.10",
          discount: "0",
          ticketId: ticket.id,
        };
      });

      const totals = calculateTotals(items);
      const invoiceNumber = await generateInvoiceNumber(db);

      // Create invoice
      const [result] = await db!.insert(invoices).values({
        invoiceNumber,
        customerId: input.customerId,
        invoiceDate: new Date(),
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
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
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
          ticketId: item.ticketId,
        });
      }

      return { id: invoiceId, invoiceNumber };
    }),

  // Get customer from ticket
  getCustomerFromTicket: protectedProcedure
    .input(z.object({ ticketId: z.number() }))
    .query(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();
      const [ticket] = await db!
        .select()
        .from(tickets)
        .where(eq(tickets.id, input.ticketId))
        .limit(1);

      if (!ticket) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      }

      // Try to find existing customer by email
      if (ticket.customerEmail) {
        const [customer] = await db!
          .select()
          .from(customers)
          .where(eq(customers.email, ticket.customerEmail))
          .limit(1);

        if (customer) {
          return customer;
        }
      }

      // Return ticket customer info for creating new customer
      return {
        name: ticket.customerName || ticket.company || "Unbekannt",
        email: ticket.customerEmail,
        company: ticket.company,
      };
    }),
});
