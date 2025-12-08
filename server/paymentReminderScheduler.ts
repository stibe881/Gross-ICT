import { getDb } from './db';
import { invoices, customers, paymentReminderLog } from '../drizzle/schema';
import { accountingSettings } from '../drizzle/schema_accounting';
import { eq, and, lt, sql } from 'drizzle-orm';
import { sendPaymentReminderEmail } from './emailService';

/**
 * Payment Reminder Scheduler
 * Automatically sends payment reminders for overdue invoices
 * Runs daily at 9:00 AM
 */

interface ReminderConfig {
  daysOverdue: number;
  reminderType: '1st' | '2nd' | 'final';
  subject: string;
  message: string;
}

const REMINDER_SCHEDULE: ReminderConfig[] = [
  {
    daysOverdue: 7,
    reminderType: '1st',
    subject: '1. Zahlungserinnerung',
    message: 'Wir möchten Sie freundlich daran erinnern, dass die unten aufgeführte Rechnung noch offen ist. Bitte überweisen Sie den Betrag in den nächsten Tagen.',
  },
  {
    daysOverdue: 14,
    reminderType: '2nd',
    subject: '2. Zahlungserinnerung',
    message: 'Leider haben wir bisher keine Zahlung für die unten aufgeführte Rechnung erhalten. Wir bitten Sie dringend, den offenen Betrag umgehend zu begleichen.',
  },
  {
    daysOverdue: 21,
    reminderType: 'final',
    subject: 'Letzte Mahnung',
    message: 'Dies ist unsere letzte Mahnung. Falls wir innerhalb der nächsten 7 Tage keine Zahlung erhalten, werden wir weitere rechtliche Schritte einleiten müssen.',
  },
];

/**
 * Check if a reminder should be sent for an invoice
 */
function shouldSendReminder(invoice: any, config: ReminderConfig): boolean {
  const dueDate = new Date(invoice.dueDate);
  const today = new Date();
  const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Send reminder if invoice is exactly at the configured days overdue
  // (with 1-day tolerance to account for scheduler running time)
  return daysOverdue >= config.daysOverdue && daysOverdue < config.daysOverdue + 2;
}

/**
 * Process payment reminders
 */
export async function processPaymentReminders() {
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
          sql`${invoices.status} IN ('sent', 'overdue')`,
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

        // Calculate days overdue
        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

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

        // Check if we already sent this type of reminder for this invoice
        const existingReminder = await db
          .select()
          .from(paymentReminderLog)
          .where(
            and(
              eq(paymentReminderLog.invoiceId, invoice.id),
              eq(paymentReminderLog.reminderType, reminderToSend.reminderType),
              eq(paymentReminderLog.status, 'sent')
            )
          )
          .limit(1);

        if (existingReminder.length > 0) {
          // Already sent this reminder
          skipped++;
          continue;
        }

        // Send reminder email
        let emailResult;
        try {
          emailResult = await sendPaymentReminderEmail({
            to: customer.email,
            customerName: customer.name,
            invoiceNumber: invoice.invoiceNumber,
            invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('de-CH'),
            dueDate: dueDate.toLocaleDateString('de-CH'),
            totalAmount: parseFloat(invoice.totalAmount).toFixed(2),
            reminderType: reminderToSend.reminderType,
            reminderSubject: reminderToSend.subject,
            reminderMessage: reminderToSend.message,
            companyName: companySettings.companyName || 'Gross ICT',
            companyEmail: companySettings.companyEmail || 'info@gross-ict.ch',
            logoUrl: companySettings.logoUrl || undefined,
          });

          // Log successful reminder
          await db.insert(paymentReminderLog).values({
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            reminderType: reminderToSend.reminderType,
            emailTo: customer.email,
            subject: `${reminderToSend.subject} - Rechnung ${invoice.invoiceNumber}`,
            status: 'sent',
            messageId: emailResult.messageId || null,
            invoiceAmount: invoice.totalAmount,
            daysOverdue,
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
        } catch (emailError: any) {
          console.error(`[PaymentReminder] Failed to send reminder for invoice ${invoice.invoiceNumber}:`, emailError);
          
          // Log failed reminder
          await db.insert(paymentReminderLog).values({
            invoiceId: invoice.id,
            customerId: invoice.customerId,
            reminderType: reminderToSend.reminderType,
            emailTo: customer.email,
            subject: `${reminderToSend.subject} - Rechnung ${invoice.invoiceNumber}`,
            status: 'failed',
            errorMessage: emailError.message || 'Unknown error',
            invoiceAmount: invoice.totalAmount,
            daysOverdue,
          });
          failed++;
        }
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
 * Runs daily at 9:00 AM
 */
export function startPaymentReminderScheduler() {
  console.log('[PaymentReminderScheduler] Starting payment reminder scheduler');
  
  // Calculate time until next 9 AM
  const now = new Date();
  const next9AM = new Date();
  next9AM.setHours(9, 0, 0, 0);
  
  if (now >= next9AM) {
    // If it's already past 9 AM today, schedule for tomorrow
    next9AM.setDate(next9AM.getDate() + 1);
  }
  
  const timeUntilNext9AM = next9AM.getTime() - now.getTime();
  
  console.log(`[PaymentReminderScheduler] Next run scheduled for ${next9AM.toLocaleString()}`);
  
  // Schedule first run
  setTimeout(() => {
    processPaymentReminders();
    
    // Then run every 24 hours
    setInterval(() => {
      processPaymentReminders();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }, timeUntilNext9AM);
}
