import { getDb } from './db';
import { recurringInvoices, invoices, invoiceItems } from '../drizzle/schema';
import { eq, and, lte, sql } from 'drizzle-orm';

/**
 * Recurring Invoice Scheduler
 * Automatically generates invoices from recurring invoice templates
 */

// Helper function to generate invoice number
async function generateInvoiceNumber(db: any, prefix: string = "") {
  const year = new Date().getFullYear();
  const [lastInvoice] = await db!
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(sql`${invoices.invoiceNumber} LIKE ${`${prefix}${year}-%`}`)
    .orderBy(sql`${invoices.id} DESC`)
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

// Helper function to calculate next run date based on interval
function calculateNextRunDate(currentDate: Date, interval: string): Date {
  const nextDate = new Date(currentDate);
  
  switch (interval) {
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1); // Default to monthly
  }
  
  return nextDate;
}

/**
 * Process all due recurring invoices
 * This function should be called periodically (e.g., daily via cron)
 */
export async function processRecurringInvoices() {
  console.log('[Scheduler] Processing recurring invoices...');
  
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Scheduler] Database not available');
      return { success: false, error: 'Database not available' };
    }

    const now = new Date();
    
    // Get all active recurring invoices that are due
    const dueInvoices = await db
      .select()
      .from(recurringInvoices)
      .where(
        and(
          eq(recurringInvoices.isActive, true),
          lte(recurringInvoices.nextRunDate, now)
        )
      );

    console.log(`[Scheduler] Found ${dueInvoices.length} due recurring invoices`);

    let processed = 0;
    let failed = 0;

    for (const recurring of dueInvoices) {
      try {
        // Parse template data (stored in 'items' field)
        const template = JSON.parse(recurring.items);
        
        // Calculate due date (e.g., 30 days from invoice date)
        const invoiceDate = new Date();
        const dueDate = new Date(invoiceDate);
        dueDate.setDate(dueDate.getDate() + 30);

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(db);

        // Create invoice
        const [result] = await db.insert(invoices).values({
          invoiceNumber,
          customerId: recurring.customerId,
          invoiceDate,
          dueDate,
          status: 'draft',
          subtotal: template.subtotal || '0.00',
          discountAmount: template.discountAmount || '0.00',
          vatAmount: template.vatAmount || '0.00',
          totalAmount: template.totalAmount || '0.00',
          notes: template.notes || null,
          footerText: template.footerText || null,
          createdBy: 1, // System-generated (admin user)
        });

        const invoiceId = Number(result.insertId);

        // Create invoice items from template
        if (template.items && Array.isArray(template.items)) {
          for (let i = 0; i < template.items.length; i++) {
            const item = template.items[i];
            await db.insert(invoiceItems).values({
              invoiceId,
              position: i + 1,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate,
              discount: item.discount || '0.00',
              total: item.total,
            });
          }
        }

        // Update recurring invoice: set next run date
        const nextRunDate = calculateNextRunDate(now, recurring.interval);
        await db
          .update(recurringInvoices)
          .set({
            lastRunDate: now,
            nextRunDate,
          })
          .where(eq(recurringInvoices.id, recurring.id));

        console.log(`[Scheduler] Generated invoice ${invoiceNumber} from recurring template #${recurring.id}`);
        processed++;
      } catch (error) {
        console.error(`[Scheduler] Failed to process recurring invoice #${recurring.id}:`, error);
        failed++;
      }
    }

    console.log(`[Scheduler] Completed: ${processed} processed, ${failed} failed`);
    
    return {
      success: true,
      processed,
      failed,
      total: dueInvoices.length,
    };
  } catch (error) {
    console.error('[Scheduler] Error processing recurring invoices:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start the recurring invoice scheduler
 * Runs every hour to check for due invoices
 */
export function startRecurringInvoiceScheduler() {
  console.log('[Scheduler] Starting recurring invoice scheduler...');
  
  // Run immediately on start
  processRecurringInvoices();
  
  // Then run every hour
  const intervalMs = 60 * 60 * 1000; // 1 hour
  setInterval(() => {
    processRecurringInvoices();
  }, intervalMs);
  
  console.log('[Scheduler] Recurring invoice scheduler started (runs every hour)');
}
