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
        customerName: z.string().min(1),
        customerEmail: z.string().email(),
        customerPhone: z.string().optional(),
        projectType: z.string(),
        designType: z.string(),
        features: z.string(),
        webshopOptions: z.string().optional(),
        totalPrice: z.number(),
        message: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Render template for customer
        const customerEmail = await renderTemplate("quote_request", {
          customerName: input.customerName,
          projectType: input.projectType,
          designType: input.designType,
          features: input.features,
          webshopOptions: input.webshopOptions || "Keine",
          totalPrice: input.totalPrice.toLocaleString("de-CH"),
        });

        // Send email to customer
        await sendEmail({
          to: input.customerEmail,
          subject: customerEmail.subject,
          html: customerEmail.html,
          templateName: "quote_request",
          recipientName: input.customerName,
        });

        // Render template for sales team
        const salesEmail = await renderTemplate("quote_request", {
          customerName: `NEUE ANFRAGE von ${input.customerName}`,
          projectType: input.projectType,
          designType: input.designType,
          features: input.features,
          webshopOptions: input.webshopOptions || "Keine",
          totalPrice: input.totalPrice.toLocaleString("de-CH"),
        });

        // Send notification to sales team
        await sendEmail({
          to: "verkauf@gross-ict.ch",
          subject: salesEmail.subject,
          html: salesEmail.html,
          templateName: "quote_request",
        });

        // Additional info for sales team (plain text)
        const salesDetails = `
Neue Angebotsanfrage von Website-Kalkulator

Kunde: ${input.customerName}
E-Mail: ${input.customerEmail}
Telefon: ${input.customerPhone || "Nicht angegeben"}

Projektkonfiguration:
- Typ: ${input.projectType}
- Design: ${input.designType}
- Features: ${input.features}
- Webshop-Optionen: ${input.webshopOptions || "Keine"}

Geschätzter Preis: CHF ${input.totalPrice.toLocaleString("de-CH")}

${input.message ? `Nachricht:\n${input.message}` : ""}
        `.trim();

        // Send plain text notification to sales
        await sendEmail({
          to: "verkauf@gross-ict.ch",
          subject: `Neue Angebotsanfrage: ${input.projectType} - CHF ${input.totalPrice.toLocaleString("de-CH")}`,
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
