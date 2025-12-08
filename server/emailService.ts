import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { Language } from './i18n';
import { generateInvoiceEmailHTML, generateReminderEmailHTML } from './emailService_multilingual';

let transporter: Transporter | null = null;

/**
 * Initialize email transporter with SMTP settings
 * For now, using a test account. In production, use real SMTP credentials.
 */
export async function initializeEmailTransporter() {
  // Create a test account for development
  // In production, replace with real SMTP credentials from env variables
  const testAccount = await nodemailer.createTestAccount();
  
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || testAccount.smtp.host,
    port: parseInt(process.env.SMTP_PORT || String(testAccount.smtp.port)),
    secure: process.env.SMTP_SECURE === 'true' || testAccount.smtp.secure,
    auth: {
      user: process.env.SMTP_USER || testAccount.user,
      pass: process.env.SMTP_PASS || testAccount.pass,
    },
  });

  console.log('[Email] Transporter initialized');
  if (!process.env.SMTP_HOST) {
    console.log('[Email] Using test account:', testAccount.user);
    console.log('[Email] Preview URLs will be logged for development');
  }
}

/**
 * Send invoice via email
 */
/**
 * Send ticket notification email
 */
export async function sendTicketNotificationEmail(options: {
  to: string;
  customerName: string;
  ticketId: number;
  subject: string;
  status: string;
  updateMessage: string;
  companyName: string;
  companyEmail: string;
  logoUrl?: string;
}) {
  if (!transporter) {
    await initializeEmailTransporter();
  }

  const emailSubject = `Ticket #${options.ticketId} Update: ${options.subject}`;
  
  const statusLabels: Record<string, string> = {
    open: 'Offen',
    in_progress: 'In Bearbeitung',
    resolved: 'Gelöst',
    closed: 'Geschlossen',
  };
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 10px; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .ticket-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #D4AF37; }
    .ticket-details table { width: 100%; }
    .ticket-details td { padding: 8px 0; }
    .ticket-details td:first-child { font-weight: bold; width: 40%; }
    .update-message { background: #f0f0f0; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${options.logoUrl ? `<img src="${options.logoUrl}" alt="${options.companyName}" class="logo" />` : ''}
      <h1>${options.companyName}</h1>
    </div>
    
    <div class="content">
      <h2>Guten Tag ${options.customerName},</h2>
      
      <p>Es gibt ein Update zu Ihrem Support-Ticket.</p>
      
      <div class="ticket-details">
        <table>
          <tr>
            <td>Ticket-Nummer:</td>
            <td>#${options.ticketId}</td>
          </tr>
          <tr>
            <td>Betreff:</td>
            <td>${options.subject}</td>
          </tr>
          <tr>
            <td>Status:</td>
            <td><strong>${statusLabels[options.status] || options.status}</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="update-message">
        <strong>Aktualisierung:</strong><br>
        ${options.updateMessage}
      </div>
      
      <p>Sie können den Status Ihres Tickets jederzeit in Ihrem Dashboard einsehen.</p>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      
      <p>Freundliche Grüsse<br>${options.companyName}</p>
    </div>
    
    <div class="footer">
      <p>${options.companyName}<br>
      ${options.companyEmail}</p>
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Guten Tag ${options.customerName},

Es gibt ein Update zu Ihrem Support-Ticket.

Ticket-Nummer: #${options.ticketId}
Betreff: ${options.subject}
Status: ${statusLabels[options.status] || options.status}

Aktualisierung:
${options.updateMessage}

Sie können den Status Ihres Tickets jederzeit in Ihrem Dashboard einsehen.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Freundliche Grüsse
${options.companyName}
  `;

  try {
    const info = await transporter!.sendMail({
      from: `"${options.companyName}" <${options.companyEmail}>`,
      to: options.to,
      subject: emailSubject,
      text,
      html,
    });

    console.log('[Email] Ticket notification sent:', info.messageId);
    
    // For development with test account, log preview URL
    if (!process.env.SMTP_HOST) {
      console.log('[Email] Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('[Email] Failed to send ticket notification:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send invoice via email
 */
export async function sendInvoiceEmail(options: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
  pdfBuffer: Buffer;
  companyName: string;
  companyEmail: string;
  logoUrl?: string;
  language?: 'de' | 'en' | 'fr';
}) {
  if (!transporter) {
    await initializeEmailTransporter();
  }

  const lang = (options.language || 'de') as Language;
  const { subject, html, text } = generateInvoiceEmailHTML({
    customerName: options.customerName,
    invoiceNumber: options.invoiceNumber,
    totalAmount: options.totalAmount,
    dueDate: options.dueDate,
    companyName: options.companyName,
    companyEmail: options.companyEmail,
    logoUrl: options.logoUrl,
    language: lang,
  });

  /* OLD HTML TEMPLATE - REPLACED WITH MULTILINGUAL VERSION
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 10px; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .invoice-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #D4AF37; }
    .invoice-details table { width: 100%; }
    .invoice-details td { padding: 8px 0; }
    .invoice-details td:first-child { font-weight: bold; width: 40%; }
    .button { display: inline-block; padding: 12px 30px; background: #D4AF37; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${options.logoUrl ? `<img src="${options.logoUrl}" alt="${options.companyName}" class="logo" />` : ''}
      <h1>${options.companyName}</h1>
    </div>
    
    <div class="content">
      <h2>Guten Tag ${options.customerName},</h2>
      
      <p>anbei erhalten Sie die Rechnung <strong>${options.invoiceNumber}</strong> vom ${options.invoiceDate}.</p>
      
      <div class="invoice-details">
        <table>
          <tr>
            <td>Rechnungsnummer:</td>
            <td>${options.invoiceNumber}</td>
          </tr>
          <tr>
            <td>Rechnungsdatum:</td>
            <td>${options.invoiceDate}</td>
          </tr>
          <tr>
            <td>Fälligkeitsdatum:</td>
            <td>${options.dueDate}</td>
          </tr>
          <tr>
            <td>Gesamtbetrag:</td>
            <td><strong>CHF ${options.totalAmount}</strong></td>
          </tr>
        </table>
      </div>
      
      ${options.pdfUrl ? `
      <p style="text-align: center;">
        <a href="${options.pdfUrl}" class="button">Rechnung als PDF herunterladen</a>
      </p>
      ` : ''}
      
      <p>Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum auf unser Konto.</p>
      
      <p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
      
      <p>Freundliche Grüsse<br>${options.companyName}</p>
    </div>
    
    <div class="footer">
      <p>${options.companyName}<br>
      ${options.companyEmail}</p>
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
    </div>
  </div>
</body>
</html>
  `;

  */
  // Text version generated by multilingual helper

  try {
    const mailOptions: any = {
      from: `"${options.companyName}" <${options.companyEmail}>`,
      to: options.to,
      subject,
      text,
      html,
    };
    
    // Add PDF attachment if provided
    if (options.pdfBuffer) {
      mailOptions.attachments = [{
        filename: `${options.invoiceNumber}.pdf`,
        content: options.pdfBuffer,
        contentType: 'application/pdf',
      }];
    }
    
    const info = await transporter!.sendMail(mailOptions);

    console.log('[Email] Invoice sent:', info.messageId);
    
    // For development with test account, log preview URL
    if (!process.env.SMTP_HOST) {
      console.log('[Email] Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('[Email] Failed to send invoice:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(options: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: string;
  reminderType: '1st' | '2nd' | 'final';
  reminderSubject: string;
  reminderMessage: string;
  companyName: string;
  companyEmail: string;
  logoUrl?: string;
}) {
  if (!transporter) {
    await initializeEmailTransporter();
  }

  const subject = `${options.reminderSubject} - Rechnung ${options.invoiceNumber}`;
  
  const urgencyColors = {
    '1st': '#FFA500',
    '2nd': '#FF6B00',
    'final': '#FF0000',
  };
  
  const urgencyColor = urgencyColors[options.reminderType];
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
    .logo { max-width: 150px; height: auto; margin-bottom: 10px; }
    .content { padding: 30px 20px; background: #f9f9f9; }
    .reminder-badge { background: ${urgencyColor}; color: white; padding: 10px 20px; text-align: center; font-weight: bold; margin: 20px 0; border-radius: 4px; }
    .invoice-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid ${urgencyColor}; }
    .invoice-details table { width: 100%; }
    .invoice-details td { padding: 8px 0; }
    .invoice-details td:first-child { font-weight: bold; width: 40%; }
    .amount-due { font-size: 24px; font-weight: bold; color: ${urgencyColor}; text-align: center; margin: 20px 0; }
    .message { background: #fff3cd; padding: 15px; margin: 20px 0; border-left: 4px solid ${urgencyColor}; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 30px; background: #D4AF37; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${options.logoUrl ? `<img src="${options.logoUrl}" alt="${options.companyName}" class="logo" />` : ''}
      <h1>${options.companyName}</h1>
    </div>
    
    <div class="content">
      <div class="reminder-badge">
        ${options.reminderType === '1st' ? '1. ZAHLUNGSERINNERUNG' : options.reminderType === '2nd' ? '2. ZAHLUNGSERINNERUNG' : 'LETZTE MAHNUNG'}
      </div>
      
      <h2>Guten Tag ${options.customerName},</h2>
      
      <div class="message">
        <p>${options.reminderMessage}</p>
      </div>
      
      <div class="invoice-details">
        <table>
          <tr>
            <td>Rechnungsnummer:</td>
            <td>${options.invoiceNumber}</td>
          </tr>
          <tr>
            <td>Rechnungsdatum:</td>
            <td>${options.invoiceDate}</td>
          </tr>
          <tr>
            <td>Fälligkeitsdatum:</td>
            <td>${options.dueDate}</td>
          </tr>
          <tr>
            <td>Status:</td>
            <td><strong style="color: ${urgencyColor};">ÜBERFÄLLIG</strong></td>
          </tr>
        </table>
      </div>
      
      <div class="amount-due">
        Offener Betrag: CHF ${options.totalAmount}
      </div>
      
      <p>
        Bitte überweisen Sie den offenen Betrag umgehend auf unser Konto.
        Die Zahlungsinformationen finden Sie auf der ursprünglichen Rechnung.
      </p>
      
      <p>
        Falls Sie die Rechnung bereits beglichen haben oder Fragen haben, 
        kontaktieren Sie uns bitte unter <a href="mailto:${options.companyEmail}">${options.companyEmail}</a>.
      </p>
      
      <p>
        Vielen Dank für Ihr Verständnis.
      </p>
      
      <p>
        Freundliche Grüsse<br>
        ${options.companyName}
      </p>
    </div>
    
    <div class="footer">
      <p>
        ${options.companyName}<br>
        <a href="mailto:${options.companyEmail}">${options.companyEmail}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${options.reminderType === '1st' ? '1. ZAHLUNGSERINNERUNG' : options.reminderType === '2nd' ? '2. ZAHLUNGSERINNERUNG' : 'LETZTE MAHNUNG'}

Guten Tag ${options.customerName},

${options.reminderMessage}

Rechnungsdetails:
- Rechnungsnummer: ${options.invoiceNumber}
- Rechnungsdatum: ${options.invoiceDate}
- Fälligkeitsdatum: ${options.dueDate}
- Status: ÜBERFÄLLIG

Offener Betrag: CHF ${options.totalAmount}

Bitte überweisen Sie den offenen Betrag umgehend auf unser Konto.
Die Zahlungsinformationen finden Sie auf der ursprünglichen Rechnung.

Falls Sie die Rechnung bereits beglichen haben oder Fragen haben, 
kontaktieren Sie uns bitte unter ${options.companyEmail}.

Vielen Dank für Ihr Verständnis.

Freundliche Grüsse
${options.companyName}
  `;

  try {
    const info = await transporter!.sendMail({
      from: `"${options.companyName}" <${options.companyEmail}>`,
      to: options.to,
      subject,
      text,
      html,
    });

    console.log('[Email] Payment reminder sent:', info.messageId);
    
    // For development with test account, log preview URL
    if (!process.env.SMTP_HOST) {
      console.log('[Email] Preview URL:', nodemailer.getTestMessageUrl(info));
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info),
    };
  } catch (error) {
    console.error('[Email] Failed to send payment reminder:', error);
    throw new Error('Failed to send payment reminder');
  }
}
