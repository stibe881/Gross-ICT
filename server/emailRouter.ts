import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { publicProcedure, protectedProcedure, router } from './_core/trpc';
import { sendInvoiceEmail, initializeEmailTransporter } from './emailService';

// Admin or Support procedure
const adminOrSupportProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'support') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin or Support access required' });
  }
  return next({ ctx });
});

export const emailRouter = router({
  // Send invoice via email
  sendInvoice: adminOrSupportProcedure
    .input(z.object({
      invoiceId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { getDb } = await import('./db.js');
      const { invoices, customers, accountingSettings } = await import('../drizzle/schema_accounting.js');
      const { eq } = await import('drizzle-orm');
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Get invoice
      const invoice = await db.select().from(invoices).where(eq(invoices.id, input.invoiceId)).limit(1);
      if (!invoice || invoice.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }
      
      // Get customer
      const customer = await db.select().from(customers).where(eq(customers.id, invoice[0].customerId)).limit(1);
      if (!customer || customer.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Customer not found' });
      }
      
      // Get accounting settings
      const settings = await db.select().from(accountingSettings).limit(1);
      const companySettings = settings[0] || {
        companyName: 'Gross ICT',
        companyEmail: 'info@gross-ict.ch',
      };
      
      // Generate PDF
      let pdfBuffer: Buffer | undefined;
      try {
        const { generateInvoicePDFBuffer } = await import('./pdfService.js');
        pdfBuffer = await generateInvoicePDFBuffer(input.invoiceId);
      } catch (error) {
        console.error('[Email] Failed to generate PDF:', error);
        // Continue without PDF attachment
      }
      
      // Send email with PDF attachment
      const result = await sendInvoiceEmail({
        to: customer[0].email,
        customerName: customer[0].name,
        invoiceNumber: invoice[0].invoiceNumber,
        invoiceDate: new Date(invoice[0].invoiceDate).toLocaleDateString('de-CH'),
        totalAmount: parseFloat(invoice[0].totalAmount).toFixed(2),
        dueDate: new Date(invoice[0].dueDate).toLocaleDateString('de-CH'),
        pdfBuffer,
        companyName: companySettings.companyName || 'Gross ICT',
        companyEmail: companySettings.companyEmail || 'info@gross-ict.ch',
        logoUrl: companySettings.logoUrl || undefined,
      });
      
      // Update invoice status to "sent" if it was draft
      if (invoice[0].status === 'draft') {
        await db.update(invoices)
          .set({ status: 'sent' })
          .where(eq(invoices.id, input.invoiceId));
      }
      
      return result;
    }),

  // Initialize email service (for testing)
  initializeEmail: adminOrSupportProcedure
    .mutation(async () => {
      await initializeEmailTransporter();
      return { success: true };
    }),
});
