import nodemailer from "nodemailer";
import { getDb } from "../db";
import { emailLogs, smtpSettings, users as usersTable } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendEmailViaGraph, isGraphEmailAvailable } from "./microsoftGraphEmail";

// Cache for SMTP settings
let cachedSmtpSettings: any = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute

/**
 * Load SMTP settings from database
 */
async function getSmtpSettings() {
  const now = Date.now();

  // Return cached settings if still valid
  if (cachedSmtpSettings && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedSmtpSettings;
  }

  try {
    const db = await getDb();
    if (!db) {
      console.error("[Email] Database not available");
      return null;
    }

    const [settings] = await db
      .select()
      .from(smtpSettings)
      .limit(1);

    if (settings) {
      cachedSmtpSettings = settings;
      lastFetchTime = now;
      console.log("[Email] SMTP settings loaded from database:", {
        host: settings.host,
        port: settings.port,
        user: settings.user,
        fromEmail: settings.fromEmail
      });
      return settings;
    } else {
      console.warn("[Email] No SMTP settings found in database");
      return null;
    }
  } catch (error) {
    console.error("[Email] Failed to load SMTP settings:", error);
    return null;
  }
}

/**
 * Create email transporter with current SMTP settings
 */
async function createTransporter() {
  const settings = await getSmtpSettings();

  if (!settings) {
    console.error("[Email] Cannot create transporter: No SMTP settings");
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure, // true for SSL, false for TLS/STARTTLS
      auth: {
        user: settings.user,
        pass: settings.password,
      },
    });

    console.log("[Email] Transporter created successfully");
    return transporter;
  } catch (error) {
    console.error("[Email] Failed to create transporter:", error);
    return null;
  }
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
  }>;
  // Logging metadata
  templateId?: number;
  templateName?: string;
  recipientName?: string;
  entityType?: string;
  entityId?: number;
  triggeredBy?: number;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const recipientEmail = Array.isArray(options.to) ? options.to[0] : options.to;
  let logId: number | null = null;

  console.log("[Email] Attempting to send email:", {
    to: recipientEmail,
    subject: options.subject,
    templateName: options.templateName
  });

  try {
    // Log email attempt to database
    const db = await getDb();
    if (db) {
      const [result] = await db.insert(emailLogs).values({
        templateId: options.templateId || null,
        templateName: options.templateName || null,
        recipientEmail,
        recipientName: options.recipientName || null,
        subject: options.subject,
        body: options.html,
        status: "pending",
        entityType: options.entityType || null,
        entityId: options.entityId || null,
        triggeredBy: options.triggeredBy || null,
        retryCount: 0,
      });
      logId = result.insertId;
      console.log("[Email] Email log created with ID:", logId);
    }

    // Try Microsoft Graph first (if available)
    // Find an admin user who has a Microsoft OAuth token
    const { oauthProviders } = await import("../../drizzle/schema");

    const adminWithToken = db ? await db
      .select({ userId: oauthProviders.userId })
      .from(oauthProviders)
      .innerJoin(usersTable, eq(oauthProviders.userId, usersTable.id))
      .where(
        and(
          eq(usersTable.role, "admin"),
          eq(oauthProviders.provider, "microsoft")
        )
      )
      .limit(1) : [];

    if (adminWithToken && adminWithToken.length > 0) {
      const adminUserId = adminWithToken[0].userId;
      console.log("[Email] Found admin with Microsoft token, userId:", adminUserId);
      const graphAvailable = await isGraphEmailAvailable(adminUserId);

      if (graphAvailable) {
        console.log("[Email] Attempting to send via Microsoft Graph...");
        const graphSuccess = await sendEmailViaGraph({
          userId: adminUserId,
          to: options.to,
          subject: options.subject,
          html: options.html,
          cc: options.cc,
          bcc: options.bcc,
        });

        if (graphSuccess) {
          // Update log as sent
          if (db && logId) {
            await db.update(emailLogs)
              .set({
                status: "sent",
                sentAt: new Date()
              })
              .where(eq(emailLogs.id, logId));
          }
          return true;
        }
        console.log("[Email] Microsoft Graph failed, falling back to SMTP...");
      }
    } else {
      console.log("[Email] No admin with Microsoft token found");
    }

    // Fallback: Get SMTP settings from database
    const smtpConfig = await getSmtpSettings();

    if (!smtpConfig) {
      const errorMsg = "No email method available (Graph unavailable, SMTP not configured)";
      console.error("[Email]", errorMsg);

      // Update log as failed
      if (db && logId) {
        await db.update(emailLogs)
          .set({
            status: "failed",
            errorMessage: errorMsg
          })
          .where(eq(emailLogs.id, logId));
      }
      return false;
    }

    // Create transporter
    const transport = await createTransporter();
    if (!transport) {
      const errorMsg = "Failed to create email transporter";
      console.error("[Email]", errorMsg);

      if (db && logId) {
        await db.update(emailLogs)
          .set({
            status: "failed",
            errorMessage: errorMsg
          })
          .where(eq(emailLogs.id, logId));
      }
      return false;
    }

    const mailOptions = {
      from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc) : undefined,
      attachments: options.attachments,
    };

    console.log("[Email] Sending email with options:", {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject
    });

    const info = await transport.sendMail(mailOptions);
    console.log("[Email] ✅ Email sent successfully! Message ID:", info.messageId);

    // Update log as sent
    if (db && logId) {
      await db.update(emailLogs)
        .set({
          status: "sent",
          sentAt: new Date()
        })
        .where(eq(emailLogs.id, logId));
      console.log("[Email] Email log updated as 'sent'");
    }

    return true;
  } catch (error) {
    console.error("[Email] ❌ Failed to send email:", error);

    // Update log as failed
    const db = await getDb();
    if (db && logId) {
      await db.update(emailLogs)
        .set({
          status: "failed",
          errorMessage: error instanceof Error ? error.message : String(error)
        })
        .where(eq(emailLogs.id, logId));
      console.log("[Email] Email log updated as 'failed'");
    }

    return false;
  }
}

/**
 * Send SLA warning email
 */
export async function sendSLAWarningEmail(
  ticketId: number,
  ticketSubject: string,
  assignedToEmail: string,
  deadline: Date,
  type: "response" | "resolution"
): Promise<boolean> {
  const typeText = type === "response" ? "Reaktionszeit" : "Lösungszeit";
  const timeRemaining = Math.max(0, deadline.getTime() - Date.now());
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f59e0b; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .warning { background-color: #fef3c7; border-left: 4px solid: #f59e0b; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ SLA-Warnung</h1>
        </div>
        <div class="content">
          <h2>Ticket #${ticketId}: ${ticketSubject}</h2>
          <div class="warning">
            <strong>Achtung:</strong> Die ${typeText}-Frist für dieses Ticket läuft bald ab!
          </div>
          <p><strong>Verbleibende Zeit:</strong> ${hoursRemaining}h ${minutesRemaining}m</p>
          <p><strong>Deadline:</strong> ${deadline.toLocaleString("de-CH")}</p>
          <p>Bitte bearbeiten Sie dieses Ticket zeitnah, um eine SLA-Verletzung zu vermeiden.</p>
          <a href="${process.env.FRONTEND_URL || "https://gross-ict.ch"}/fernwartung/tickets/${ticketId}" class="button">
            Ticket anzeigen
          </a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch vom Gross ICT Support-System generiert.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: assignedToEmail,
    subject: `⚠️ SLA-Warnung: Ticket #${ticketId} - ${typeText} läuft ab`,
    html,
    text: `SLA-Warnung für Ticket #${ticketId}: ${ticketSubject}\n\nVerbleibende Zeit: ${hoursRemaining}h ${minutesRemaining}m\nDeadline: ${deadline.toLocaleString("de-CH")}`,
  });
}

/**
 * Send SLA breach email
 */
export async function sendSLABreachEmail(
  ticketId: number,
  ticketSubject: string,
  assignedToEmail: string,
  adminEmails: string[],
  deadline: Date,
  type: "response" | "resolution"
): Promise<boolean> {
  const typeText = type === "response" ? "Reaktionszeit" : "Lösungszeit";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .breach { background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 SLA-Verletzung</h1>
        </div>
        <div class="content">
          <h2>Ticket #${ticketId}: ${ticketSubject}</h2>
          <div class="breach">
            <strong>KRITISCH:</strong> Die ${typeText}-Frist für dieses Ticket wurde überschritten!
          </div>
          <p><strong>Deadline war:</strong> ${deadline.toLocaleString("de-CH")}</p>
          <p>Dieses Ticket erfordert sofortige Aufmerksamkeit. Bitte eskalieren Sie bei Bedarf.</p>
          <a href="${process.env.FRONTEND_URL || "https://gross-ict.ch"}/fernwartung/tickets/${ticketId}" class="button">
            Ticket sofort bearbeiten
          </a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch vom Gross ICT Support-System generiert.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: assignedToEmail,
    cc: adminEmails,
    subject: `🚨 SLA-Verletzung: Ticket #${ticketId} - ${typeText} überschritten`,
    html,
    text: `SLA-VERLETZUNG für Ticket #${ticketId}: ${ticketSubject}\n\nDeadline war: ${deadline.toLocaleString("de-CH")}\n\nSofortige Bearbeitung erforderlich!`,
  });
}

/**
 * Send ticket assignment notification
 */
export async function sendTicketAssignmentEmail(
  ticketId: number,
  ticketSubject: string,
  assignedToEmail: string,
  assignedByName: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .info { background-color: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; }
        .button { display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Neues Ticket zugewiesen</h1>
        </div>
        <div class="content">
          <h2>Ticket #${ticketId}: ${ticketSubject}</h2>
          <div class="info">
            <p>Ihnen wurde ein neues Support-Ticket zugewiesen von <strong>${assignedByName}</strong>.</p>
          </div>
          <a href="${process.env.FRONTEND_URL || "https://gross-ict.ch"}/fernwartung/tickets/${ticketId}" class="button">
            Ticket anzeigen
          </a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch vom Gross ICT Support-System generiert.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: assignedToEmail,
    subject: `📋 Neues Ticket zugewiesen: #${ticketId} - ${ticketSubject}`,
    html,
    text: `Ihnen wurde ein neues Support-Ticket zugewiesen:\n\nTicket #${ticketId}: ${ticketSubject}\nZugewiesen von: ${assignedByName}`,
  });
}

/**
 * Send ticket mention notification
 */
export async function sendTicketMentionEmail(
  ticketId: number,
  ticketSubject: string,
  mentionedEmail: string,
  mentionedByName: string,
  commentText: string
): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f9fafb; padding: 20px; }
        .mention { background-color: #ede9fe; border-left: 4px solid #8b5cf6; padding: 15px; margin: 20px 0; }
        .comment { background-color: white; padding: 15px; border-radius: 4px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>@ Sie wurden erwähnt</h1>
        </div>
        <div class="content">
          <h2>Ticket #${ticketId}: ${ticketSubject}</h2>
          <div class="mention">
            <p><strong>${mentionedByName}</strong> hat Sie in einem Kommentar erwähnt:</p>
          </div>
          <div class="comment">
            <p>${commentText.substring(0, 200)}${commentText.length > 200 ? "..." : ""}</p>
          </div>
          <a href="${process.env.FRONTEND_URL || "https://gross-ict.ch"}/fernwartung/tickets/${ticketId}" class="button">
            Kommentar anzeigen
          </a>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch vom Gross ICT Support-System generiert.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: mentionedEmail,
    subject: `@ ${mentionedByName} hat Sie erwähnt in Ticket #${ticketId}`,
    html,
    text: `${mentionedByName} hat Sie in einem Kommentar erwähnt:\n\n${commentText}\n\nTicket #${ticketId}: ${ticketSubject}`,
  });
}
