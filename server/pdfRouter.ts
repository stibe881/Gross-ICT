import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invoices, invoiceItems, quotes, quoteItems, customers, accountingSettings } from "../drizzle/schema_accounting";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { jsPDF } from "jspdf";

// Helper function to generate invoice PDF
async function generateInvoicePDF(invoice: any, customer: any, items: any[], settings: any) {
  const doc = new jsPDF();

  // Company Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(settings?.companyName || "Gross ICT", 20, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (settings?.address) doc.text(settings.address, 20, 28);
  if (settings?.city) doc.text(`${settings.postalCode || ""} ${settings.city}`, 20, 33);
  if (settings?.phone) doc.text(`Tel: ${settings.phone}`, 20, 38);
  if (settings?.email) doc.text(`Email: ${settings.email}`, 20, 43);

  // Invoice Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("RECHNUNG", 150, 20);

  // Invoice Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Rechnungsnummer: ${invoice.invoiceNumber}`, 150, 30);
  doc.text(`Datum: ${new Date(invoice.invoiceDate).toLocaleDateString("de-CH")}`, 150, 35);
  doc.text(`Fällig: ${new Date(invoice.dueDate).toLocaleDateString("de-CH")}`, 150, 40);

  // Customer Address
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Kunde:", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(customer.name, 20, 66);
  if (customer.company) doc.text(customer.company, 20, 71);
  if (customer.address) doc.text(customer.address, 20, 76);
  if (customer.city) doc.text(`${customer.postalCode || ""} ${customer.city}`, 20, 81);

  // Line Items Table Header
  let yPos = 100;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 170, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.text("Beschreibung", 22, yPos + 5);
  doc.text("Menge", 120, yPos + 5);
  doc.text("Preis", 145, yPos + 5);
  doc.text("Total", 170, yPos + 5);

  yPos += 10;

  // Line Items
  doc.setFont("helvetica", "normal");
  for (const item of items) {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(item.description.substring(0, 50), 22, yPos);
    doc.text(`${item.quantity} ${item.unit}`, 120, yPos);
    doc.text(`${parseFloat(item.unitPrice).toFixed(2)}`, 145, yPos);
    doc.text(`${parseFloat(item.total).toFixed(2)}`, 170, yPos);
    yPos += 6;
  }

  // Totals
  yPos += 10;
  doc.line(20, yPos, 190, yPos);
  yPos += 8;

  doc.text("Zwischensumme:", 120, yPos);
  doc.text(`${parseFloat(invoice.subtotal).toFixed(2)} CHF`, 170, yPos);
  yPos += 6;

  if (parseFloat(invoice.discountAmount) > 0) {
    doc.text("Rabatt:", 120, yPos);
    doc.text(`-${parseFloat(invoice.discountAmount).toFixed(2)} CHF`, 170, yPos);
    yPos += 6;
  }

  doc.text("MwSt:", 120, yPos);
  doc.text(`${parseFloat(invoice.vatAmount).toFixed(2)} CHF`, 170, yPos);
  yPos += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", 120, yPos);
  doc.text(`${parseFloat(invoice.totalAmount).toFixed(2)} CHF`, 170, yPos);

  // Footer
  if (settings?.bankAccount || settings?.iban) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Zahlungsinformationen:", 20, yPos);
    doc.setFont("helvetica", "normal");
    yPos += 6;
    if (settings.bankName) doc.text(`Bank: ${settings.bankName}`, 20, yPos);
    if (settings.iban) {
      yPos += 6;
      doc.text(`IBAN: ${settings.iban}`, 20, yPos);
    }
  }

  if (invoice.footerText) {
    yPos += 10;
    doc.setFontSize(9);
    doc.text(invoice.footerText, 20, yPos, { maxWidth: 170 });
  }

  return doc.output("arraybuffer");
}

// Helper function to generate quote PDF
async function generateQuotePDF(quote: any, customer: any, items: any[], settings: any) {
  const doc = new jsPDF();

  // Company Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(settings?.companyName || "Gross ICT", 20, 20);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (settings?.address) doc.text(settings.address, 20, 28);
  if (settings?.city) doc.text(`${settings.postalCode || ""} ${settings.city}`, 20, 33);
  if (settings?.phone) doc.text(`Tel: ${settings.phone}`, 20, 38);
  if (settings?.email) doc.text(`Email: ${settings.email}`, 20, 43);

  // Quote Title
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("ANGEBOT", 150, 20);

  // Quote Details
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Angebotsnummer: ${quote.quoteNumber}`, 150, 30);
  doc.text(`Datum: ${new Date(quote.quoteDate).toLocaleDateString("de-CH")}`, 150, 35);
  doc.text(`Gültig bis: ${new Date(quote.validUntil).toLocaleDateString("de-CH")}`, 150, 40);

  // Customer Address
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Kunde:", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(customer.name, 20, 66);
  if (customer.company) doc.text(customer.company, 20, 71);
  if (customer.address) doc.text(customer.address, 20, 76);
  if (customer.city) doc.text(`${customer.postalCode || ""} ${customer.city}`, 20, 81);

  // Line Items Table Header
  let yPos = 100;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 170, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.text("Beschreibung", 22, yPos + 5);
  doc.text("Menge", 120, yPos + 5);
  doc.text("Preis", 145, yPos + 5);
  doc.text("Total", 170, yPos + 5);

  yPos += 10;

  // Line Items
  doc.setFont("helvetica", "normal");
  for (const item of items) {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(item.description.substring(0, 50), 22, yPos);
    doc.text(`${item.quantity} ${item.unit}`, 120, yPos);
    doc.text(`${parseFloat(item.unitPrice).toFixed(2)}`, 145, yPos);
    doc.text(`${parseFloat(item.total).toFixed(2)}`, 170, yPos);
    yPos += 6;
  }

  // Totals
  yPos += 10;
  doc.line(20, yPos, 190, yPos);
  yPos += 8;

  doc.text("Zwischensumme:", 120, yPos);
  doc.text(`${parseFloat(quote.subtotal).toFixed(2)} CHF`, 170, yPos);
  yPos += 6;

  if (parseFloat(quote.discountAmount) > 0) {
    doc.text("Rabatt:", 120, yPos);
    doc.text(`-${parseFloat(quote.discountAmount).toFixed(2)} CHF`, 170, yPos);
    yPos += 6;
  }

  doc.text("MwSt:", 120, yPos);
  doc.text(`${parseFloat(quote.vatAmount).toFixed(2)} CHF`, 170, yPos);
  yPos += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total:", 120, yPos);
  doc.text(`${parseFloat(quote.totalAmount).toFixed(2)} CHF`, 170, yPos);

  // Footer
  if (quote.footerText) {
    yPos += 10;
    doc.setFontSize(9);
    doc.text(quote.footerText, 20, yPos, { maxWidth: 170 });
  }

  return doc.output("arraybuffer");
}

export const pdfRouter = router({
  // Generate invoice PDF
  generateInvoicePDF: protectedProcedure
    .input(z.object({ invoiceId: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();

      // Get invoice with customer and items
      const [invoiceData] = await db!
        .select({
          invoice: invoices,
          customer: customers,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(eq(invoices.id, input.invoiceId))
        .limit(1);

      if (!invoiceData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      }

      const items = await db!
        .select()
        .from(invoiceItems)
        .where(eq(invoiceItems.invoiceId, input.invoiceId))
        .orderBy(invoiceItems.position);

      // Get accounting settings
      const [settings] = await db!
        .select()
        .from(accountingSettings)
        .limit(1);

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(
        invoiceData.invoice,
        invoiceData.customer,
        items,
        settings
      );

      // Convert to base64 for transmission
      const base64 = Buffer.from(pdfBuffer).toString("base64");

      return {
        filename: `Rechnung_${invoiceData.invoice.invoiceNumber}.pdf`,
        data: base64,
      };
    }),

  // Generate quote PDF
  generateQuotePDF: protectedProcedure
    .input(z.object({ quoteId: z.number() }))
    .mutation(async ({ input, ctx }: any) => {
      if (ctx.user.role !== "admin" && ctx.user.role !== "support") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      const db = await getDb();

      // Get quote with customer and items
      const [quoteData] = await db!
        .select({
          quote: quotes,
          customer: customers,
        })
        .from(quotes)
        .leftJoin(customers, eq(quotes.customerId, customers.id))
        .where(eq(quotes.id, input.quoteId))
        .limit(1);

      if (!quoteData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Quote not found" });
      }

      const items = await db!
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, input.quoteId))
        .orderBy(quoteItems.position);

      // Get accounting settings
      const [settings] = await db!
        .select()
        .from(accountingSettings)
        .limit(1);

      // Generate PDF
      const pdfBuffer = await generateQuotePDF(
        quoteData.quote,
        quoteData.customer,
        items,
        settings
      );

      // Convert to base64 for transmission
      const base64 = Buffer.from(pdfBuffer).toString("base64");

      return {
        filename: `Angebot_${quoteData.quote.quoteNumber}.pdf`,
        data: base64,
      };
    }),
});
