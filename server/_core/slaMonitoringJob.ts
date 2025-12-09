import { getDb } from "../db";
import { tickets, users } from "../../drizzle/schema";
import { eq, and, lte, isNull, sql } from "drizzle-orm";
import { sendEmail } from "./emailService";
import { getRenderedEmail, getTicketUrl, formatPriority } from "./emailTemplateService";

/**
 * SLA Monitoring Background Job
 * Checks for tickets approaching SLA deadlines and sends notifications
 */

interface SLACheckResult {
  warnings: number;
  breaches: number;
  errors: string[];
}

/**
 * Check all open tickets for SLA violations and send notifications
 */
export async function checkSLAViolations(): Promise<SLACheckResult> {
  const result: SLACheckResult = {
    warnings: 0,
    breaches: 0,
    errors: [],
  };

  try {
    const db = await getDb();
    if (!db) {
      result.errors.push("Database not available");
      return result;
    }

    const now = new Date();

    // Get all open/in_progress tickets with SLA due dates
    const openTickets = await db
      .select()
      .from(tickets)
      .where(
        and(
          sql`${tickets.status} IN ('open', 'in_progress')`,
          isNull(tickets.resolvedAt)
        )
      );

    for (const ticket of openTickets) {
      if (!ticket.slaDueDate) continue;

      const slaDueDate = new Date(ticket.slaDueDate);
      const timeUntilDue = slaDueDate.getTime() - now.getTime();
      const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

      // Check for SLA breach (past due date)
      if (timeUntilDue < 0 && ticket.slaBreached === 0) {
        result.breaches++;
        await handleSLABreach(ticket, hoursUntilDue);
        
        // Mark ticket as breached
        await db
          .update(tickets)
          .set({ 
            slaBreached: 1,
            escalationLevel: (ticket.escalationLevel || 0) + 1
          })
          .where(eq(tickets.id, ticket.id));
      }
      // Check for SLA warning (within warning threshold)
      else if (hoursUntilDue > 0 && hoursUntilDue <= 2 && ticket.escalationLevel === 0) {
        result.warnings++;
        await handleSLAWarning(ticket, hoursUntilDue);
        
        // Mark ticket as warned
        await db
          .update(tickets)
          .set({ escalationLevel: 1 })
          .where(eq(tickets.id, ticket.id));
      }
    }

    console.log(`[SLA Monitor] Checked ${openTickets.length} tickets: ${result.warnings} warnings, ${result.breaches} breaches`);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    result.errors.push(errorMsg);
    console.error("[SLA Monitor] Error checking SLA violations:", error);
  }

  return result;
}

/**
 * Handle SLA warning - send notification to assigned staff
 */
async function handleSLAWarning(ticket: any, hoursUntilDue: number) {
  try {
    const db = await getDb();
    if (!db || !ticket.assignedTo) return;

    // Get assigned user
    const [assignedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, ticket.assignedTo))
      .limit(1);

    if (!assignedUser || !assignedUser.email) return;

    const remainingMinutes = Math.round(hoursUntilDue * 60);
    const remainingTime = remainingMinutes < 60 
      ? `${remainingMinutes} Minuten`
      : `${Math.round(hoursUntilDue * 10) / 10} Stunden`;

    const emailData = {
      assignedTo: assignedUser.name || assignedUser.email,
      ticketId: ticket.id.toString(),
      customerName: ticket.customerName || 'Unbekannt',
      ticketSubject: ticket.subject || 'Kein Betreff',
      ticketPriority: formatPriority(ticket.priority || 'medium'),
      slaDeadline: new Date(ticket.slaDueDate).toLocaleString('de-CH'),
      remainingTime,
      ticketUrl: getTicketUrl(ticket.id),
    };

    const { subject, body } = await getRenderedEmail('sla_warning', emailData);
    await sendEmail({
      to: assignedUser.email,
      subject,
      html: body,
    });

    console.log(`[SLA Monitor] Warning email sent for ticket #${ticket.id}`);
  } catch (error) {
    console.error(`[SLA Monitor] Failed to send warning email for ticket #${ticket.id}:`, error);
  }
}

/**
 * Handle SLA breach - send urgent notification to assigned staff and escalate
 */
async function handleSLABreach(ticket: any, hoursOverdue: number) {
  try {
    const db = await getDb();
    if (!db) return;

    // Get assigned user or find admin/support users
    let recipients: any[] = [];

    if (ticket.assignedTo) {
      const [assignedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, ticket.assignedTo))
        .limit(1);
      
      if (assignedUser && assignedUser.email) {
        recipients.push(assignedUser);
      }
    }

    // Also notify all admin and support users
    const adminUsers = await db
      .select()
      .from(users)
      .where(sql`${users.role} IN ('admin', 'support')`);

    recipients = [...recipients, ...adminUsers.filter(u => u.email)];

    // Remove duplicates
    const uniqueRecipients = recipients.filter((user, index, self) =>
      index === self.findIndex(u => u.email === user.email)
    );

    const overdueHours = Math.abs(Math.round(hoursOverdue * 10) / 10);
    const overdueTime = overdueHours < 1
      ? `${Math.round(Math.abs(hoursOverdue) * 60)} Minuten`
      : `${overdueHours} Stunden`;

    for (const user of uniqueRecipients) {
      const emailData = {
        assignedTo: user.name || user.email,
        ticketId: ticket.id.toString(),
        customerName: ticket.customerName || 'Unbekannt',
        ticketSubject: ticket.subject || 'Kein Betreff',
        ticketPriority: formatPriority(ticket.priority || 'medium'),
        slaDeadline: new Date(ticket.slaDueDate).toLocaleString('de-CH'),
        overdueTime,
        escalationLevel: (ticket.escalationLevel || 0) + 1,
        ticketUrl: getTicketUrl(ticket.id),
      };

      const { subject, body } = await getRenderedEmail('sla_breach', emailData);
      await sendEmail({
        to: user.email,
        subject,
        html: body,
      });
    }

    console.log(`[SLA Monitor] Breach email sent to ${uniqueRecipients.length} recipients for ticket #${ticket.id}`);
  } catch (error) {
    console.error(`[SLA Monitor] Failed to send breach email for ticket #${ticket.id}:`, error);
  }
}

/**
 * Start the SLA monitoring job
 * Runs every 15 minutes
 */
export function startSLAMonitoring() {
  console.log("[SLA Monitor] Starting SLA monitoring job...");

  // Run immediately on start
  checkSLAViolations();

  // Run every 15 minutes
  const interval = 15 * 60 * 1000; // 15 minutes in milliseconds
  setInterval(async () => {
    await checkSLAViolations();
  }, interval);

  console.log("[SLA Monitor] SLA monitoring job started (runs every 15 minutes)");
}
