import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

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
export async function sendInvoiceEmail(options: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  invoiceDate: string;
  totalAmount: string;
  dueDate: string;
  pdfUrl?: string;
  companyName: string;
  companyEmail: string;
}) {
  if (!transporter) {
    await initializeEmailTransporter();
  }

  const subject = `Rechnung ${options.invoiceNumber} von ${options.companyName}`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
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

  const text = `
Guten Tag ${options.customerName},

anbei erhalten Sie die Rechnung ${options.invoiceNumber} vom ${options.invoiceDate}.

Rechnungsnummer: ${options.invoiceNumber}
Rechnungsdatum: ${options.invoiceDate}
Fälligkeitsdatum: ${options.dueDate}
Gesamtbetrag: CHF ${options.totalAmount}

${options.pdfUrl ? `Rechnung als PDF: ${options.pdfUrl}` : ''}

Bitte überweisen Sie den Betrag bis zum Fälligkeitsdatum auf unser Konto.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

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
