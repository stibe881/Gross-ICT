import { jsPDF } from "jspdf";
import { getDb } from "./db";
import { invoices, invoiceItems, customers, accountingSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getTranslations, formatCurrency, formatDate, type Language } from "./i18n";

/**
 * Generate invoice PDF and return as Buffer
 * Now supports multilingual invoices based on customer language preference
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

  // Get translations based on customer language
  const lang = (customer.language || 'de') as Language;
  const t = getTranslations(lang);

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
  
  // Invoice Title (multilingual)
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(t.invoice.toUpperCase(), 150, 20);
  
  // Invoice Details (multilingual)
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${t.invoiceNumber}: ${invoice.invoiceNumber}`, 150, 30);
  doc.text(`${t.invoiceDate}: ${formatDate(new Date(invoice.invoiceDate), lang)}`, 150, 35);
  doc.text(`${t.dueDate}: ${formatDate(new Date(invoice.dueDate), lang)}`, 150, 40);
  if (customer.customerNumber) {
    doc.text(`${t.customerNumber}: ${customer.customerNumber}`, 150, 45);
  }
  
  // Customer Address
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(lang === 'de' ? "Kunde:" : lang === 'en' ? "Customer:" : "Client:", 20, 60);
  doc.setFont("helvetica", "normal");
  doc.text(customer.name, 20, 66);
  if (customer.contactPerson) doc.text(customer.contactPerson, 20, 71);
  if (customer.address) doc.text(customer.address, 20, 76);
  if (customer.city) doc.text(`${customer.postalCode || ""} ${customer.city}`, 20, 81);
  if (customer.country && customer.country !== 'Schweiz') doc.text(customer.country, 20, 86);
  
  // Line Items Table Header
  let yPos = 105;
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 170, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t.position, 22, yPos + 5);
  doc.text(t.description, 35, yPos + 5);
  doc.text(t.quantity, 110, yPos + 5);
  doc.text(t.unitPrice, 135, yPos + 5);
  doc.text(t.vatRate, 160, yPos + 5);
  doc.text(t.total, 175, yPos + 5);
  
  yPos += 10;
  
  // Line Items
  doc.setFont("helvetica", "normal");
  items.forEach((item, index) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.text(`${index + 1}`, 22, yPos);
    
    // Description (wrap if too long)
    const description = item.description.substring(0, 60);
    doc.text(description, 35, yPos);
    
    doc.text(`${item.quantity} ${item.unit}`, 110, yPos);
    doc.text(formatCurrency(parseFloat(item.unitPrice), invoice.currency, lang), 135, yPos);
    doc.text(`${parseFloat(item.vatRate).toFixed(1)}%`, 160, yPos);
    doc.text(formatCurrency(parseFloat(item.total), invoice.currency, lang), 175, yPos);
    yPos += 6;
  });
  
  // Totals Section
  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);
  yPos += 8;
  
  doc.setFont("helvetica", "normal");
  doc.text(t.subtotal + ":", 120, yPos);
  doc.text(formatCurrency(parseFloat(invoice.subtotal), invoice.currency, lang), 175, yPos);
  yPos += 6;
  
  if (parseFloat(invoice.discountAmount) > 0) {
    doc.text(t.discount + ":", 120, yPos);
    doc.text(`-${formatCurrency(parseFloat(invoice.discountAmount), invoice.currency, lang)}`, 175, yPos);
    yPos += 6;
  }
  
  doc.text(t.vat + ":", 120, yPos);
  doc.text(formatCurrency(parseFloat(invoice.vatAmount), invoice.currency, lang), 175, yPos);
  yPos += 8;
  
  // Total Amount (bold)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(t.totalAmount + ":", 120, yPos);
  doc.text(formatCurrency(parseFloat(invoice.totalAmount), invoice.currency, lang), 175, yPos);
  yPos += 15;
  
  // Payment Terms
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(t.paymentTerms, 20, yPos);
  yPos += 6;
  
  doc.setFont("helvetica", "normal");
  const paymentDays = customer.paymentTermsDays || 30;
  doc.text(`${t.paymentDue} ${paymentDays} ${lang === 'de' ? 'Tagen' : lang === 'en' ? 'days' : 'jours'}`, 20, yPos);
  yPos += 10;
  
  // Bank Details
  if (settings?.bankName) {
    doc.setFont("helvetica", "bold");
    doc.text(t.bankDetails, 20, yPos);
    yPos += 6;
    
    doc.setFont("helvetica", "normal");
    doc.text(`${t.accountHolder}: ${settings.companyName}`, 20, yPos);
    yPos += 5;
    if (settings.iban) {
      doc.text(`${t.iban}: ${settings.iban}`, 20, yPos);
      yPos += 5;
    }
    if (settings.bankName) {
      doc.text(settings.bankName, 20, yPos);
      yPos += 5;
    }
  }
  
  // Footer Text
  if (invoice.footerText) {
    yPos += 10;
    doc.setFontSize(8);
    doc.setTextColor(100);
    const footerLines = doc.splitTextToSize(invoice.footerText, 170);
    doc.text(footerLines, 20, yPos);
  }
  
  // Thank you message
  yPos += 15;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(t.thankYou, 20, yPos);
  
  return Buffer.from(doc.output("arraybuffer"));
}
