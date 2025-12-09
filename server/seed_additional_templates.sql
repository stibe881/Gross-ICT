-- Insert additional email templates (Ticket Assigned, Mention)
INSERT INTO emailTemplates (name, title, subject, body, category, isActive, isSystem) VALUES
('ticket_assigned', 'Ticket Zugewiesen - Mitarbeiterbenachrichtigung', 'Neues Ticket zugewiesen: #{{ticketId}}', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">Neues Ticket zugewiesen</h2>
    <p style="color: #666; line-height: 1.6;">Hallo {{assignedTo}},</p>
    <p style="color: #666; line-height: 1.6;">Ihnen wurde ein neues Support-Ticket zugewiesen.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Ticket-ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Kunde:</strong> {{customerName}}</p>
      <p style="margin: 5px 0;"><strong>Betreff:</strong> {{ticketSubject}}</p>
      <p style="margin: 5px 0;"><strong>Priorität:</strong> {{ticketPriority}}</p>
      <p style="margin: 5px 0;"><strong>Kategorie:</strong> {{ticketCategory}}</p>
      <p style="margin: 5px 0;"><strong>Erstellt am:</strong> {{createdAt}}</p>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af;"><strong>Beschreibung:</strong></p>
      <p style="margin: 10px 0 0 0; color: #1e3a8a;">{{ticketDescription}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ticketUrl}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ticket öffnen</a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">Mit freundlichen Grüssen,<br>Gross ICT System</p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">Automatische Benachrichtigung | Gross ICT</p>
</div>', 'ticket', 1, 1),

('mention_notification', 'Erwähnung - Mitarbeiterbenachrichtigung', 'Sie wurden in Ticket #{{ticketId}} erwähnt', '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h2 style="color: #333; margin-top: 0;">💬 Sie wurden erwähnt</h2>
    <p style="color: #666; line-height: 1.6;">Hallo {{mentionedUser}},</p>
    <p style="color: #666; line-height: 1.6;">{{mentionedBy}} hat Sie in einem Kommentar zu Ticket #{{ticketId}} erwähnt.</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Ticket-ID:</strong> #{{ticketId}}</p>
      <p style="margin: 5px 0;"><strong>Betreff:</strong> {{ticketSubject}}</p>
      <p style="margin: 5px 0;"><strong>Kunde:</strong> {{customerName}}</p>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #1e40af;"><strong>Kommentar von {{mentionedBy}}:</strong></p>
      <p style="margin: 10px 0 0 0; color: #1e3a8a;">{{commentText}}</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ticketUrl}}" style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Kommentar anzeigen</a>
    </div>
    
    <p style="color: #666; line-height: 1.6; margin-top: 30px;">Mit freundlichen Grüssen,<br>Gross ICT System</p>
  </div>
  <p style="text-align: center; color: #999; font-size: 12px; margin-top: 20px;">Automatische Benachrichtigung | Gross ICT</p>
</div>', 'system', 1, 1);
