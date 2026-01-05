import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { invoices, invoiceItems, quotes, quoteItems, customers, accountingSettings } from "../drizzle/schema_accounting";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { jsPDF } from "jspdf";

// Modern color scheme
const COLORS = {
  primary: [212, 175, 55] as [number, number, number], // Gold
  dark: [51, 51, 51] as [number, number, number],
  lightGray: [245, 245, 245] as [number, number, number],
  white: [255, 255, 255] as [number, number, number],
  paymentBox: [245, 250, 255] as [number, number, number],
};

// Helper function to generate modern invoice PDF
async function generateInvoicePDF(invoice: any, customer: any, items: any[], settings: any) {
  const doc = new jsPDF();

  // === HEADER SECTION WITH LOGO/COMPANY NAME ===
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(settings?.companyName || "Gross ICT", 20, 25);

  // Company contact details
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  let headerY = 32;
  if (settings?.address) { doc.text(settings.address, 20, headerY); headerY += 4; }
  if (settings?.city) { doc.text(`${settings.postalCode || ""} ${settings.city}`, 20, headerY); headerY += 4; }
  if (settings?.phone) { doc.text(`Tel: ${settings.phone}`, 20, headerY); headerY += 4; }
  if (settings?.email) { doc.text(`E-Mail: ${settings.email}`, 20, headerY); }

  // Invoice title with colored background
  doc.setFillColor(...COLORS.primary);
  doc.rect(130, 15, 60, 12, "F");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text("RECHNUNG", 160, 23, { align: "center" });

  // Invoice details box
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(130, 30, 60, 24, "F");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text("Nr:", 135, 36);
  doc.text("Datum:", 135, 42);
  doc.text("Fällig:", 135, 48);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.invoiceNumber, 155, 36);
  doc.text(new Date(invoice.invoiceDate).toLocaleDateString("de-CH"), 155, 42);
  doc.text(new Date(invoice.dueDate).toLocaleDateString("de-CH"), 155, 48);

  // === CUSTOMER SECTION ===
  doc.setFillColor(...COLORS.lightGray);
  doc.rect(20, 60, 90, 30, "F");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Rechnungsempfänger", 25, 67);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text(customer.name, 25, 74);
  doc.setFont("helvetica", "normal");
  let custY = 79;
  if (customer.company) { doc.text(customer.company, 25, custY); custY += 5; }
  if (customer.address) { doc.text(customer.address, 25, custY); custY += 5; }
  if (customer.city) { doc.text(`${customer.postalCode || ""} ${customer.city}`, 25, custY); }

  // === LINE ITEMS TABLE ===
  let yPos = 100;

  // Table header
  doc.setFillColor(...COLORS.primary);
  doc.rect(20, yPos, 170, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text("Beschreibung", 25, yPos + 7);
  doc.text("Menge", 125, yPos + 7);
  doc.text("Preis", 150, yPos + 7);
  doc.text("Total", 175, yPos + 7, { align: "right" });

  yPos += 12;

  // Table rows with alternating colors
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  items.forEach((item: any, index: number) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPos - 3, 170, 7, "F");
    }

    doc.text(item.description.substring(0, 60), 25, yPos);
    doc.text(`${item.quantity} ${item.unit}`, 125, yPos);
    doc.text(`CHF ${parseFloat(item.unitPrice).toFixed(2)}`, 150, yPos);
    doc.text(`CHF ${parseFloat(item.total).toFixed(2)}`, 185, yPos, { align: "right" });
    yPos += 7;
  });

  // === TOTALS SECTION ===
  yPos += 5;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(120, yPos, 190, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Zwischensumme:", 130, yPos);
  doc.text(`CHF ${parseFloat(invoice.subtotal).toFixed(2)}`, 185, yPos, { align: "right" });
  yPos += 6;

  if (parseFloat(invoice.discountAmount) > 0) {
    doc.text("Rabatt:", 130, yPos);
    doc.text(`- CHF ${parseFloat(invoice.discountAmount).toFixed(2)}`, 185, yPos, { align: "right" });
    yPos += 6;
  }

  doc.text("MwSt (8.1%):", 130, yPos);
  doc.text(`CHF ${parseFloat(invoice.vatAmount).toFixed(2)}`, 185, yPos, { align: "right" });
  yPos += 8;

  // Total with accent
  doc.setFillColor(...COLORS.primary);
  doc.rect(120, yPos - 5, 70, 10, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("Gesamtbetrag:", 130, yPos + 2);
  doc.text(`CHF ${parseFloat(invoice.totalAmount).toFixed(2)}`, 185, yPos + 2, { align: "right" });

  // === PAYMENT INFORMATION BOX ===
  yPos += 20;
  if (settings?.iban || settings?.bankName) {
    doc.setFillColor(...COLORS.paymentBox);
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.rect(20, yPos, 90, 28, "FD");

    doc.setFontSize(11);
    doc.setTextColor(...COLORS.primary);
    doc.setFont("helvetica", "bold");
    doc.text("Zahlungsinformationen", 25, yPos + 7);

    doc.setFontSize(9);
    doc.setTextColor(...COLORS.dark);
    doc.setFont("helvetica", "normal");
    let payY = yPos + 14;

    if (settings.bankName) {
      doc.setFont("helvetica", "bold");
      doc.text("Bank:", 25, payY);
      doc.setFont("helvetica", "normal");
      doc.text(settings.bankName, 45, payY);
      payY += 5;
    }

    if (settings.iban) {
      doc.setFont("helvetica", "bold");
      doc.text("IBAN:", 25, payY);
      doc.setFont("helvetica", "normal");
      doc.text(settings.iban, 45, payY);
    }
  }

  // Footer text
  if (invoice.footerText) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text(invoice.footerText, 20, 280, { maxWidth: 170 });
  }

  // Page footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${settings?.companyName || "Gross ICT"} | ${invoice.invoiceNumber}`, 105, 290, { align: "center" });

  return doc.output("arraybuffer");
}

// Helper function to generate quote PDF (simplified version)
async function generateQuotePDF(quote: any, customer: any, items: any[], settings: any) {
  const doc = new jsPDF();

  // Similar structure as invoice but with "ANGEBOT" title
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text(settings?.companyName || "Gross ICT", 20, 25);

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  let headerY = 32;
  if (settings?.address) { doc.text(settings.address, 20, headerY); headerY += 4; }
  if (settings?.city) { doc.text(`${settings.postalCode || ""} ${settings.city}`, 20, headerY); headerY += 4; }
  if (settings?.phone) { doc.text(`Tel: ${settings.phone}`, 20, headerY); headerY += 4; }
  if (settings?.email) { doc.text(`E-Mail: ${settings.email}`, 20, headerY); }

  doc.setFillColor(...COLORS.primary);
  doc.rect(130, 15, 60, 12, "F");
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text("ANGEBOT", 160, 23, { align: "center" });

  doc.setFillColor(...COLORS.lightGray);
  doc.rect(130, 30, 60, 24, "F");
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text("Nr:", 135, 36);
  doc.text("Datum:", 135, 42);
  doc.text("Gültig bis:", 135, 48);
  doc.setFont("helvetica", "normal");
  doc.text(quote.quoteNumber, 155, 36);
  doc.text(new Date(quote.quoteDate).toLocaleDateString("de-CH"), 155, 42);
  doc.text(new Date(quote.validUntil).toLocaleDateString("de-CH"), 155, 48);

  doc.setFillColor(...COLORS.lightGray);
  doc.rect(20, 60, 90, 30, "F");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.setFont("helvetica", "bold");
  doc.text("Kunde", 25, 67);

  doc.setFontSize(10);
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.text(customer.name, 25, 74);
  doc.setFont("helvetica", "normal");
  let custY = 79;
  if (customer.company) { doc.text(customer.company, 25, custY); custY += 5; }
  if (customer.address) { doc.text(customer.address, 25, custY); custY += 5; }
  if (customer.city) { doc.text(`${customer.postalCode || ""} ${customer.city}`, 25, custY); }

  let yPos = 100;
  doc.setFillColor(...COLORS.primary);
  doc.rect(20, yPos, 170, 10, "F");
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.white);
  doc.setFont("helvetica", "bold");
  doc.text("Beschreibung", 25, yPos + 7);
  doc.text("Menge", 125, yPos + 7);
  doc.text("Preis", 150, yPos + 7);
  doc.text("Total", 175, yPos + 7, { align: "right" });

  yPos += 12;
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  items.forEach((item: any, index: number) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPos - 3, 170, 7, "F");
    }

    doc.text(item.description.substring(0, 60), 25, yPos);
    doc.text(`${item.quantity} ${item.unit}`, 125, yPos);
    doc.text(`CHF ${parseFloat(item.unitPrice).toFixed(2)}`, 150, yPos);
    doc.text(`CHF ${parseFloat(item.total).toFixed(2)}`, 185, yPos, { align: "right" });
    yPos += 7;
  });

  yPos += 5;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(120, yPos, 190, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Zwischensumme:", 130, yPos);
  doc.text(`CHF ${parseFloat(quote.subtotal).toFixed(2)}`, 185, yPos, { align: "right" });
  yPos += 6;

  if (parseFloat(quote.discountAmount) > 0) {
    doc.text("Rabatt:", 130, yPos);
    doc.text(`- CHF ${parseFloat(quote.discountAmount).toFixed(2)}`, 185, yPos, { align: "right" });
    yPos += 6;
  }

  doc.text("MwSt (8.1%):", 130, yPos);
  doc.text(`CHF ${parseFloat(quote.vatAmount).toFixed(2)}`, 185, yPos, { align: "right" });
  yPos += 8;

  doc.setFillColor(...COLORS.primary);
  doc.rect(120, yPos - 5, 70, 10, "F");
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.white);
  doc.text("Gesamtbetrag:", 130, yPos + 2);
  doc.text(`CHF ${parseFloat(quote.totalAmount).toFixed(2)}`, 185, yPos + 2, { align: "right" });

  if (quote.footerText) {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "italic");
    doc.text(quote.footerText, 20, 280, { maxWidth: 170 });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`${settings?.companyName || "Gross ICT"} | ${quote.quoteNumber}`, 105, 290, { align: "center" });

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
