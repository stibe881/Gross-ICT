import { getDb } from './db';
import { invoices, customers, accountingSettings } from '../drizzle/schema';
import { eq, and, lt, gte, sql } from 'drizzle-orm';
import { sendPaymentReminderEmail } from './emailService';

/**
 * Payment Reminder Scheduler
 * Automatically sends payment reminders for overdue invoices
 */

interface ReminderConfig {
  daysOverdue: number;
  reminderType: '1st' | '2nd' | 'final';
  subject: string;
  message: string;
}

// Reminder configuration: when to send reminders
const REMINDER_SCHEDULE: ReminderConfig[] = [
  {
    daysOverdue: 7,
    reminderType: '1st',
    subject: 'Freundliche Zahlungserinnerung',
    message: 'Wir möchten Sie freundlich daran erinnern, dass die Zahlung für diese Rechnung noch aussteht. Sollten Sie die Rechnung bereits beglichen haben, betrachten Sie diese E-Mail bitte als gegenstandslos.',
  },
  {
    daysOverdue: 14,
    reminderType: '2nd',
    subject: '2. Zahlungserinnerung',
    message: 'Leider haben wir bisher keine Zahlung für diese Rechnung erhalten. Wir bitten Sie höflich, den ausstehenden Betrag umgehend zu begleichen. Bei Fragen oder Problemen kontaktieren Sie uns bitte.',
  },
  {
    daysOverdue: 21,
    reminderType: 'final',
    subject: 'Letzte Mahnung - Zahlungsaufforderung',
    message: 'Dies ist unsere letzte Mahnung. Die Rechnung ist nun erheblich überfällig. Bitte begleichen Sie den ausstehenden Betrag innerhalb der nächsten 7 Tage, um weitere rechtliche Schritte zu vermeiden.',
  },
];

/**
 * Check if a reminder should be sent for an invoice
 */
function shouldSendReminder(invoice: any, config: ReminderConfig): boolean {
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if invoice is overdue by exactly the configured days
  // (with a 1-day tolerance to avoid missing reminders)
  return daysOverdue >= config.daysOverdue && daysOverdue <= config.daysOverdue + 1;
}

/**
 * Process all overdue invoices and send reminders
 */
export async function processPaymentReminders() {
  console.log('[Payment Reminders] Processing overdue invoices...');
  
  try {
    const db = await getDb();
    if (!db) {
      console.error('[Payment Reminders] Database not available');
      return { success: false, error: 'Database not available' };
    }

    const today = new Date();
    
    // Get all unpaid invoices that are overdue
    const overdueInvoices = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.status, 'sent'),
          lt(invoices.dueDate, today)
        )
      );

    console.log(`[Payment Reminders] Found ${overdueInvoices.length} overdue invoices`);

    // Get accounting settings for company info
    const [settings] = await db.select().from(accountingSettings).limit(1);
    const companySettings = settings || {
      companyName: 'Gross ICT',
      companyEmail: 'info@gross-ict.ch',
      logoUrl: null,
    };

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const invoice of overdueInvoices) {
      try {
        // Get customer details
        const [customer] = await db
          .select()
          .from(customers)
          .where(eq(customers.id, invoice.customerId));

        if (!customer) {
          console.warn(`[Payment Reminders] Customer not found for invoice #${invoice.id}`);
          skipped++;
          continue;
        }

        // Determine which reminder to send based on days overdue
        let reminderToSend: ReminderConfig | null = null;
        for (const config of REMINDER_SCHEDULE) {
          if (shouldSendReminder(invoice, config)) {
            reminderToSend = config;
            break;
          }
        }

        if (!reminderToSend) {
          // No reminder scheduled for this invoice yet
          skipped++;
          continue;
        }

        // Send reminder email
        await sendPaymentReminderEmail({
          to: customer.email,
          customerName: customer.name,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('de-CH'),
          dueDate: new Date(invoice.dueDate).toLocaleDateString('de-CH'),
          totalAmount: parseFloat(invoice.totalAmount).toFixed(2),
          reminderType: reminderToSend.reminderType,
          reminderSubject: reminderToSend.subject,
          reminderMessage: reminderToSend.message,
          companyName: companySettings.companyName || 'Gross ICT',
          companyEmail: companySettings.companyEmail || 'info@gross-ict.ch',
          logoUrl: companySettings.logoUrl || undefined,
        });

        // Update invoice status to overdue if it's the first reminder
        if (reminderToSend.reminderType === '1st' && invoice.status === 'sent') {
          await db
            .update(invoices)
            .set({ status: 'overdue' })
            .where(eq(invoices.id, invoice.id));
        }

        console.log(`[Payment Reminders] Sent ${reminderToSend.reminderType} reminder for invoice ${invoice.invoiceNumber}`);
        sent++;
      } catch (error) {
        console.error(`[Payment Reminders] Failed to process invoice #${invoice.id}:`, error);
        failed++;
      }
    }

    console.log(`[Payment Reminders] Completed: ${sent} sent, ${skipped} skipped, ${failed} failed`);
    
    return {
      success: true,
      sent,
      skipped,
      failed,
      total: overdueInvoices.length,
    };
  } catch (error) {
    console.error('[Payment Reminders] Error processing reminders:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Start the payment reminder scheduler
 * Runs daily at 9 AM to check for overdue invoices
 */
export function startPaymentReminderScheduler() {
  console.log('[Payment Reminders] Starting payment reminder scheduler...');
  
  // Calculate time until next 9 AM
  const now = new Date();
  const next9AM = new Date();
  next9AM.setHours(9, 0, 0, 0);
  
  // If it's already past 9 AM today, schedule for tomorrow
  if (now.getHours() >= 9) {
    next9AM.setDate(next9AM.getDate() + 1);
  }
  
  const msUntil9AM = next9AM.getTime() - now.getTime();
  
  // Run first check at 9 AM
  setTimeout(() => {
    processPaymentReminders();
    
    // Then run every 24 hours
    setInterval(() => {
      processPaymentReminders();
    }, 24 * 60 * 60 * 1000);
  }, msUntil9AM);
  
  console.log(`[Payment Reminders] Scheduler started. Next run at ${next9AM.toLocaleString('de-CH')}`);
}
