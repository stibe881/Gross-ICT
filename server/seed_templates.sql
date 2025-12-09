-- Insert standard email templates
INSERT INTO emailTemplates (name, title, subject, body, category, isActive, isSystem) VALUES
('ticket_created', 'Ticket Erstellt - Kundenbenachrichtigung', 'Ihr Support-Ticket wurde erstellt - #{{ticketId}}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Ticket erfolgreich erstellt</h2>
    <p style="color: #666; line-height: 1.6;">Hallo {{customerName}},</p>
    <p style="color: #666; line-height: 1.6;">Vielen Dank für Ihre Anfrage. Wir haben Ihr Support-Ticket erfolgreich erstellt und werden uns schnellstmöglich darum kümmern.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Ticket-ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Betreff:</strong> {{ticketSubject}}</p>
      <p style="margin: 5px 0;"><strong>Priorität:</strong> {{ticketPriority}}</p>
      <p style="margin: 5px 0;"><strong>Status:</strong> {{ticketStatus}}</p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">Sie können den Status Ihres Tickets jederzeit in unserem Support-Portal einsehen.</p>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">Mit freundlichen Grüssen,<br>Ihr Gross ICT Support-Team</p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">Gross ICT | Neuhushof 3 | 6144 Zell LU</p>
</div>', 'ticket', 1, 1),

('ticket_status_changed', 'Ticket Status Geändert - Kundenbenachrichtigung', 'Status-Update für Ihr Ticket #{{ticketId}}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Ticket-Status aktualisiert</h2>
    <p style="color: #666; line-height: 1.6;">Hallo {{customerName}},</p>
    <p style="color: #666; line-height: 1.6;">Der Status Ihres Support-Tickets wurde aktualisiert.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Ticket-ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Neuer Status:</strong> <span style="color: #2563eb; font-weight: bold;">{{ticketStatus}}</span></p>
      <p style="margin: 5px 0;"><strong>Bearbeiter:</strong> {{assignedTo}}</p>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af;"><strong>Letzte Nachricht:</strong></p>
      <p style="margin: 10px 0 0 0; color: #1e3a8a;">{{lastMessage}}</p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">Sie können auf diese Nachricht antworten oder das Ticket in unserem Support-Portal einsehen.</p>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">Mit freundlichen Grüssen,<br>Ihr Gross ICT Support-Team</p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">Gross ICT | Neuhushof 3 | 6144 Zell LU</p>
</div>', 'ticket', 1, 1),

('sla_warning', 'SLA Warnung - Mitarbeiterbenachrichtigung', 'SLA-Warnung: Ticket #{{ticketId}} nähert sich Deadline', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 4px solid #f59e0b;">
    <h2 style="color: #f59e0b; margin-top: 0;">SLA-Warnung</h2>
    <p style="color: #666; line-height: 1.6;">Hallo {{assignedTo}},</p>
    <p style="color: #666; line-height: 1.6;">Ein Ticket nähert sich der SLA-Deadline und erfordert Ihre Aufmerksamkeit.</p>
    
    <div style="background-color: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <p style="margin: 5px 0;"><strong>Ticket-ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Kunde:</strong> {{customerName}}</p>
      <p style="margin: 5px 0;"><strong>Betreff:</strong> {{ticketSubject}}</p>
      <p style="margin: 5px 0;"><strong>Priorität:</strong> {{ticketPriority}}</p>
      <p style="margin: 5px 0;"><strong>SLA-Deadline:</strong> <span style="color: #f59e0b; font-weight: bold;">{{slaDeadline}}</span></p>
      <p style="margin: 5px 0;"><strong>Verbleibende Zeit:</strong> <span style="color: #dc2626; font-weight: bold;">{{remainingTime}}</span></p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">Bitte priorisieren Sie dieses Ticket, um einen SLA-Verstoss zu vermeiden.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ticketUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ticket öffnen</a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">Mit freundlichen Grüssen,<br>Gross ICT System</p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">Automatische Benachrichtigung | Gross ICT</p>
</div>', 'sla', 1, 1),

('sla_breach', 'SLA Verstoss - Mitarbeiterbenachrichtigung', 'SLA-VERSTOSS: Ticket #{{ticketId}} hat Deadline überschritten', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-top: 4px solid #dc2626;">
    <h2 style="color: #dc2626; margin-top: 0;">SLA-VERSTOSS</h2>
    <p style="color: #666; line-height: 1.6;">Hallo {{assignedTo}},</p>
    <p style="color: #666; line-height: 1.6;"><strong>DRINGEND:</strong> Ein Ticket hat die SLA-Deadline überschritten und erfordert sofortige Massnahmen.</p>
    
    <div style="background-color: #fee2e2; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc2626;">
      <p style="margin: 5px 0;"><strong>Ticket-ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Kunde:</strong> {{customerName}}</p>
      <p style="margin: 5px 0;"><strong>Betreff:</strong> {{ticketSubject}}</p>
      <p style="margin: 5px 0;"><strong>Priorität:</strong> {{ticketPriority}}</p>
      <p style="margin: 5px 0;"><strong>SLA-Deadline:</strong> {{slaDeadline}}</p>
      <p style="margin: 5px 0;"><strong>Überschritten seit:</strong> <span style="color: #dc2626; font-weight: bold;">{{overdueTime}}</span></p>
      <p style="margin: 5px 0;"><strong>Eskalationsstufe:</strong> <span style="color: #dc2626; font-weight: bold;">{{escalationLevel}}</span></p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">Dieses Ticket erfordert Ihre sofortige Aufmerksamkeit. Bitte kontaktieren Sie den Kunden umgehend und eskalieren Sie bei Bedarf an das Management.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ticketUrl}}" style="background-color: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ticket sofort bearbeiten</a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">Mit freundlichen Grüssen,<br>Gross ICT System</p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">Automatische Benachrichtigung | Gross ICT</p>
</div>', 'sla', 1, 1),

('invoice_due', 'Rechnung Fällig - Kundenbenachrichtigung', 'Zahlungserinnerung: Rechnung {{invoiceNumber}} ist fällig', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Zahlungserinnerung</h2>
    <p style="color: #666; line-height: 1.6;">Sehr geehrte/r {{customerName}},</p>
    <p style="color: #666; line-height: 1.6;">Wir möchten Sie freundlich daran erinnern, dass die folgende Rechnung zur Zahlung fällig ist:</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Rechnungsnummer:</strong> {{invoiceNumber}}</p>
      <p style="margin: 5px 0;"><strong>Rechnungsdatum:</strong> {{invoiceDate}}</p>
      <p style="margin: 5px 0;"><strong>Fälligkeitsdatum:</strong> {{dueDate}}</p>
      <p style="margin: 5px 0;"><strong>Betrag:</strong> <span style="color: #2563eb; font-size: 18px; font-weight: bold;">{{totalAmount}}</span></p>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af;"><strong>Zahlungsinformationen:</strong></p>
      <p style="margin: 10px 0 0 0; color: #1e3a8a;">
        Bank: {{bankName}}<br>
        IBAN: {{iban}}<br>
        Referenz: {{invoiceNumber}}
      </p>
    </div>
    
    <p style="color: #666; line-height: 1.6;">Falls Sie die Rechnung bereits bezahlt haben, betrachten Sie diese E-Mail bitte als gegenstandslos.</p>
    
    <p style="color: #666; line-height: 1.6;">Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">Mit freundlichen Grüssen,<br>Ihr Gross ICT Team</p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">Gross ICT | Neuhushof 3 | 6144 Zell LU</p>
</div>', 'invoice', 1, 1);
