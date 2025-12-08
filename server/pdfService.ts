import { jsPDF } from "jspdf";
import { getDb } from "./db";
import { invoices, invoiceItems, customers, accountingSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Generate invoice PDF and return as Buffer
 */
export async function generateInvoicePDFBuffer(invoiceId: number): Promise<Buffer> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');

  // Get invoice
  const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
  if (!invoice) throw new Error('Invoice not found');

  // Get customer
  const [customer] = await db.select().from(customers).where(eq(customers.id, invoice.customerId));
  if (!customer) throw new Error('Customer not found');

  // Get invoice items
  const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

  // Get settings
  const [settings] = await db.select().from(accountingSettings).limit(1);

  // Generate PDF
  const doc = new jsPDF();
  
  // Company Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(settings?.companyName || "Gross ICT", 20, 20);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  if (settings?.companyAddress) doc.text(settings.companyAddress, 20, 28);
  if (settings?.companyCity) doc.text(`${settings.companyPostalCode || ""} ${settings.companyCity}`, 20, 33);
  if (settings?.companyPhone) doc.text(`Tel: ${settings.companyPhone}`, 20, 38);
  if (settings?.companyEmail) doc.text(`Email: ${settings.companyEmail}`, 20, 43);
  
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
  if (customer.address) doc.text(customer.address, 20, 71);
  if (customer.city) doc.text(`${customer.postalCode || ""} ${customer.city}`, 20, 76);
  
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
  if (settings?.iban) {
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
  
  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
