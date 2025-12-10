import { getDb } from './server/db.js';
import { emailTemplates } from './drizzle/schema.js';
import { eq } from 'drizzle-orm';

async function createTicketReplyTemplate() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  // Check if template already exists
  const [existing] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.name, 'ticket_reply'))
    .limit(1);

  if (existing) {
    console.log('✅ Template ticket_reply already exists');
    process.exit(0);
  }

  // Create the template
  await db.insert(emailTemplates).values({
    name: 'ticket_reply',
    title: 'Neue Antwort auf Ihr Ticket',
    subject: 'Neue Antwort auf Ticket {{ticketNumber}}',
    body: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1a1a19; color: #fbbf24; padding: 20px; text-center; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .comment { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #fbbf24; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #fbbf24; color: #1a1a19; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Gross ICT</h1>
      <p>Neue Antwort auf Ihr Ticket</p>
    </div>
    <div class="content">
      <p>Hallo {{customerName}},</p>
      <p><strong>{{commentAuthor}}</strong> hat eine neue Antwort zu Ihrem Ticket <strong>{{ticketNumber}}</strong> hinzugefügt:</p>
      <p><strong>Betreff:</strong> {{ticketSubject}}</p>
      <div class="comment">
        <p>{{commentMessage}}</p>
      </div>
      <p>
        <a href="{{ticketUrl}}" class="button">Ticket anzeigen</a>
      </p>
      <p>Sie können auf diese Nachricht antworten, indem Sie das Ticket über den obigen Link aufrufen.</p>
    </div>
    <div class="footer">
      <p>© 2025 Gross ICT - Ihr Partner für IT-Lösungen</p>
      <p>Neuhushof 3, 6144 Zell LU | +41 79 414 06 16</p>
    </div>
  </div>
</body>
</html>`,
    category: 'Ticket',
    placeholders: 'customerName, ticketNumber, ticketSubject, commentAuthor, commentMessage, ticketUrl',
    isActive: 1,
  });

  console.log('✅ Template ticket_reply created successfully');
  process.exit(0);
}

createTicketReplyTemplate().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
