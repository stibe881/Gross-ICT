-- SQL Script to insert all required email templates for Gross ICT
-- Run this on your production database

-- Insert ticket_created template
INSERT INTO emailTemplates (name, title, subject, htmlContent, category, isActive, createdAt, updatedAt)
VALUES (
  'ticket_created',
  'Ticket Erstellt Benachrichtigung',
  'Ticket #{ticketId} erstellt: {subject}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Ticket erfolgreich erstellt</h1>
    </div>
    <div class="content">
      <p>Hallo {customerName},</p>
      <p>Vielen Dank für Ihre Anfrage! Ihr Support-Ticket wurde erfolgreich erstellt.</p>
      
      <div class="ticket-info">
        <h3>Ticket-Details:</h3>
        <p><strong>Ticket-ID:</strong> #{ticketId}</p>
        <p><strong>Betreff:</strong> {subject}</p>
        <p><strong>Priorität:</strong> {priority}</p>
        <p><strong>Status:</strong> {status}</p>
        <p><strong>Erstellt am:</strong> {createdAt}</p>
      </div>
      
      <p>Unser Support-Team wird sich so schnell wie möglich um Ihr Anliegen kümmern.</p>
      
      <a href="https://gross-ict.ch/support-center" class="button">Ticket anzeigen</a>
    </div>
    <div class="footer">
      <p>Gross ICT | Neuhushof 3, 6144 Zell LU | +41 79 414 06 16</p>
      <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht direkt auf diese E-Mail.</p>
    </div>
  </div>
</body>
</html>',
  'ticket',
  1,
  NOW(),
  NOW()
);

-- Insert ticket_status_changed template
INSERT INTO emailTemplates (name, title, subject, htmlContent, category, isActive, createdAt, updatedAt)
VALUES (
  'ticket_status_changed',
  'Ticket Status Geändert',
  'Ticket #{ticketId}: Status aktualisiert',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Status-Update</h1>
    </div>
    <div class="content">
      <p>Hallo {customerName},</p>
      <p>Der Status Ihres Tickets wurde aktualisiert:</p>
      
      <p><strong>Ticket-ID:</strong> #{ticketId}</p>
      <p><strong>Betreff:</strong> {subject}</p>
      <p><strong>Neuer Status:</strong> <span class="status-badge">{status}</span></p>
    </div>
    <div class="footer">
      <p>Gross ICT | Neuhushof 3, 6144 Zell LU | +41 79 414 06 16</p>
    </div>
  </div>
</body>
</html>',
  'ticket',
  1,
  NOW(),
  NOW()
);

-- Insert ticket_assigned template
INSERT INTO emailTemplates (name, title, subject, htmlContent, category, isActive, createdAt, updatedAt)
VALUES (
  'ticket_assigned',
  'Ticket Zugewiesen',
  'Ticket #{ticketId} wurde Ihnen zugewiesen',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Neues Ticket zugewiesen</h1>
    </div>
    <div class="content">
      <p>Hallo,</p>
      <p>Ihnen wurde ein neues Support-Ticket zugewiesen:</p>
      
      <p><strong>Ticket-ID:</strong> #{ticketId}</p>
      <p><strong>Betreff:</strong> {subject}</p>
      <p><strong>Kunde:</strong> {customerName}</p>
      <p><strong>Priorität:</strong> {priority}</p>
      
      <a href="https://gross-ict.ch/admin/tickets" class="button">Ticket bearbeiten</a>
    </div>
  </div>
</body>
</html>',
  'ticket',
  1,
  NOW(),
  NOW()
);

-- Insert mention_notification template
INSERT INTO emailTemplates (name, title, subject, htmlContent, category, isActive, createdAt, updatedAt)
VALUES (
  'mention_notification',
  'Erwähnung in Kommentar',
  'Sie wurden in Ticket #{ticketId} erwähnt',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💬 Neue Erwähnung</h1>
    </div>
    <div class="content">
      <p>Hallo,</p>
      <p>Sie wurden in einem Ticket-Kommentar erwähnt:</p>
      
      <p><strong>Ticket-ID:</strong> #{ticketId}</p>
      <p><strong>Von:</strong> {mentionedBy}</p>
    </div>
  </div>
</body>
</html>',
  'ticket',
  1,
  NOW(),
  NOW()
);

-- Insert sla_warning template
INSERT INTO emailTemplates (name, title, subject, htmlContent, category, isActive, createdAt, updatedAt)
VALUES (
  'sla_warning',
  'SLA Warnung',
  '⚠️ SLA Warnung: Ticket #{ticketId}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ SLA Warnung</h1>
    </div>
    <div class="content">
      <div class="warning">
        <p><strong>Achtung:</strong> Das folgende Ticket nähert sich der SLA-Frist!</p>
      </div>
      
      <p><strong>Ticket-ID:</strong> #{ticketId}</p>
      <p><strong>Betreff:</strong> {subject}</p>
      <p><strong>Verbleibende Zeit:</strong> {timeRemaining}</p>
      
      <p>Bitte priorisieren Sie dieses Ticket, um einen SLA-Verstoß zu vermeiden.</p>
    </div>
  </div>
</body>
</html>',
  'sla',
  1,
  NOW(),
  NOW()
);

-- Insert sla_breach template
INSERT INTO emailTemplates (name, title, subject, htmlContent, category, isActive, createdAt, updatedAt)
VALUES (
  'sla_breach',
  'SLA Verstoß',
  '🚨 SLA Verstoß: Ticket #{ticketId}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .alert { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 SLA Verstoß</h1>
    </div>
    <div class="content">
      <div class="alert">
        <p><strong>Kritisch:</strong> Die SLA-Frist wurde überschritten!</p>
      </div>
      
      <p><strong>Ticket-ID:</strong> #{ticketId}</p>
      <p><strong>Betreff:</strong> {subject}</p>
      <p><strong>Überschritten um:</strong> {breachTime}</p>
      
      <p>Sofortige Maßnahmen erforderlich!</p>
    </div>
  </div>
</body>
</html>',
  'sla',
  1,
  NOW(),
  NOW()
);

-- Insert invoice_due template
INSERT INTO emailTemplates (name, title, subject, htmlContent, category, isActive, createdAt, updatedAt)
VALUES (
  'invoice_due',
  'Rechnung Fällig',
  'Zahlungserinnerung: Rechnung #{invoiceNumber}',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Zahlungserinnerung</h1>
    </div>
    <div class="content">
      <p>Sehr geehrte/r {customerName},</p>
      <p>Ihre Rechnung ist zur Zahlung fällig:</p>
      
      <p><strong>Rechnungsnummer:</strong> {invoiceNumber}</p>
      <p><strong>Betrag:</strong> {amount} CHF</p>
      <p><strong>Fälligkeitsdatum:</strong> {dueDate}</p>
      
      <p>Bitte überweisen Sie den Betrag auf unser Konto.</p>
    </div>
  </div>
</body>
</html>',
  'rechnung',
  1,
  NOW(),
  NOW()
);

-- Verify insertion
SELECT name, title, category, isActive FROM emailTemplates ORDER BY category, name;
