import { getTranslations, type Language } from './i18n';

/**
 * Generate multilingual invoice email HTML
 */
export function generateInvoiceEmailHTML(options: {
  customerName: string;
  invoiceNumber: string;
  totalAmount: string;
  dueDate: string;
  companyName: string;
  companyEmail: string;
  logoUrl?: string;
  language: Language;
}): { subject: string; html: string; text: string } {
  const t = getTranslations(options.language);
  
  const subject = `${t.invoiceEmailSubject} ${options.invoiceNumber} - ${options.companyName}`;
  
  const greeting = options.language === 'de' ? `Guten Tag ${options.customerName},` :
                   options.language === 'en' ? `${t.dear} ${options.customerName},` :
                   `${t.dear} ${options.customerName},`;
  
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
    .invoice-details td:first-child { font-weight: bold; width: 50%; }
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
      <h2>${greeting}</h2>
      
      <p>${t.invoiceEmailBody}</p>
      
      <div class="invoice-details">
        <table>
          <tr>
            <td>${t.invoiceNumber}:</td>
            <td>${options.invoiceNumber}</td>
          </tr>
          <tr>
            <td>${t.dueDate}:</td>
            <td>${options.dueDate}</td>
          </tr>
          <tr>
            <td>${t.totalAmount}:</td>
            <td><strong>${options.totalAmount}</strong></td>
          </tr>
        </table>
      </div>
      
      <p>${t.thankYou}</p>
      
      <p>${t.bestRegards}<br>${options.companyName}</p>
    </div>
    
    <div class="footer">
      <p>${options.companyName}<br>${options.companyEmail}</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${greeting}

${t.invoiceEmailBody}

${t.invoiceNumber}: ${options.invoiceNumber}
${t.dueDate}: ${options.dueDate}
${t.totalAmount}: ${options.totalAmount}

${t.thankYou}

${t.bestRegards}
${options.companyName}
  `;

  return { subject, html, text };
}

/**
 * Generate multilingual payment reminder email HTML
 */
export function generateReminderEmailHTML(options: {
  customerName: string;
  invoiceNumber: string;
  totalAmount: string;
  daysOverdue: number;
  reminderType: '1st' | '2nd' | 'final';
  companyName: string;
  companyEmail: string;
  logoUrl?: string;
  language: Language;
}): { subject: string; html: string; text: string } {
  const t = getTranslations(options.language);
  
  const reminderTitle = options.reminderType === '1st' ? t.firstReminder :
                       options.reminderType === '2nd' ? t.secondReminder :
                       t.finalReminder;
  
  const reminderMessage = options.reminderType === '1st' ? t.reminderMessage1 :
                         options.reminderType === '2nd' ? t.reminderMessage2 :
                         t.reminderMessageFinal;
  
  const urgencyColor = options.reminderType === '1st' ? '#ff9800' :
                      options.reminderType === '2nd' ? '#ff5722' :
                      '#d32f2f';
  
  const subject = `${reminderTitle} - ${t.invoiceEmailSubject} ${options.invoiceNumber}`;
  
  const greeting = options.language === 'de' ? `Guten Tag ${options.customerName},` :
                   options.language === 'en' ? `${t.dear} ${options.customerName},` :
                   `${t.dear} ${options.customerName},`;
  
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
    .invoice-details td:first-child { font-weight: bold; width: 50%; }
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
      <div class="reminder-badge">${reminderTitle}</div>
      
      <h2>${greeting}</h2>
      
      <p>${reminderMessage}</p>
      
      <div class="invoice-details">
        <table>
          <tr>
            <td>${t.invoiceNumber}:</td>
            <td>${options.invoiceNumber}</td>
          </tr>
          <tr>
            <td>${t.totalAmount}:</td>
            <td><strong>${options.totalAmount}</strong></td>
          </tr>
          <tr>
            <td>${options.language === 'de' ? 'Tage überfällig' : options.language === 'en' ? 'Days overdue' : 'Jours de retard'}:</td>
            <td><strong style="color: ${urgencyColor}">${options.daysOverdue}</strong></td>
          </tr>
        </table>
      </div>
      
      <p>${t.bestRegards}<br>${options.companyName}</p>
    </div>
    
    <div class="footer">
      <p>${options.companyName}<br>${options.companyEmail}</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
${reminderTitle}

${greeting}

${reminderMessage}

${t.invoiceNumber}: ${options.invoiceNumber}
${t.totalAmount}: ${options.totalAmount}
${options.language === 'de' ? 'Tage überfällig' : options.language === 'en' ? 'Days overdue' : 'Jours de retard'}: ${options.daysOverdue}

${t.bestRegards}
${options.companyName}
  `;

  return { subject, html, text };
}
