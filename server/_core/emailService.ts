import nodemailer from "nodemailer";

// Email configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "noreply@gross-ict.ch";
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || "Gross ICT";

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });
  }
  return transporter;
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
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // Check if SMTP is configured
    if (!SMTP_USER || !SMTP_PASSWORD) {
      console.warn("SMTP not configured, email not sent:", options.subject);
      return false;
    }

    const transport = getTransporter();
    if (!transport) {
      throw new Error("Failed to create email transporter");
    }

    const mailOptions = {
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM}>`,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc) : undefined,
      attachments: options.attachments,
    };

    const info = await transport.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
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
