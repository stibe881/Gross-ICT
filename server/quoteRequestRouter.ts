import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { sendEmail } from "./_core/emailService";
import { getDb } from "./db";
import { emailTemplates } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Helper function to render template with placeholders
async function renderTemplate(templateName: string, placeholders: Record<string, string>): Promise<{ subject: string; html: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [template] = await db
    .select()
    .from(emailTemplates)
    .where(eq(emailTemplates.name, templateName))
    .limit(1);

  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  let subject = template.subject;
  let html = template.body;

  // Replace placeholders
  Object.entries(placeholders).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    html = html.replace(regex, value);
  });

  return { subject, html };
}

export const quoteRequestRouter = router({
  sendQuoteRequest: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        message: z.string().optional(),
        estimatedBudget: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Send email to customer
        await sendEmail({
          to: input.email,
          subject: "Ihre Angebotsanfrage bei Gross ICT",
          html: `
            <h2>Vielen Dank für Ihre Anfrage!</h2>
            <p>Hallo ${input.name},</p>
            <p>wir haben Ihre Angebotsanfrage erhalten und werden uns in Kürze bei Ihnen melden.</p>
            <p><strong>Geschätztes Budget:</strong> CHF ${input.estimatedBudget.toLocaleString("de-CH")}</p>
            ${input.message ? `<p><strong>Ihre Nachricht:</strong><br>${input.message.replace(/\n/g, '<br>')}</p>` : ''}
            <p>Mit freundlichen Grüssen,<br>Ihr Gross ICT Team</p>
          `,
          templateName: "quote_request",
          recipientName: input.name,
        });

        // Send notification to sales team
        const salesDetails = `
Neue Angebotsanfrage von Website-Kalkulator

Kunde: ${input.name}
E-Mail: ${input.email}
Telefon: ${input.phone || "Nicht angegeben"}

Geschätztes Budget: CHF ${input.estimatedBudget.toLocaleString("de-CH")}

${input.message ? `Nachricht:\n${input.message}` : ""}
        `.trim();

        // Send plain text notification to sales
        await sendEmail({
          to: "verkauf@gross-ict.ch",
          subject: `Neue Angebotsanfrage - CHF ${input.estimatedBudget.toLocaleString("de-CH")}`,
          html: `<pre>${salesDetails}</pre>`,
          text: salesDetails,
        });

        return {
          success: true,
          message: "Angebotsanfrage erfolgreich gesendet",
        };
      } catch (error: any) {
        console.error("Error sending quote request:", error);
        throw new Error(`Fehler beim Senden der Angebotsanfrage: ${error.message}`);
      }
    }),
});
