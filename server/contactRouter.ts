import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { sendEmail } from "./_core/emailService";
import { getDb } from "./db";
import { leads, leadActivities } from "../drizzle/schema_leads";

export const contactRouter = router({
  submit: publicProcedure
    .input(
      z.object({
        firstName: z.string().min(1, "Vorname ist erforderlich"),
        lastName: z.string().min(1, "Nachname ist erforderlich"),
        email: z.string().email("Ungültige E-Mail-Adresse"),
        subject: z.string().min(1, "Betreff ist erforderlich"),
        message: z.string().min(1, "Nachricht ist erforderlich"),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // 1. Send notification email to Gross ICT
        const emailBody = `
          <h2>Neue Kontaktanfrage</h2>
          <p><strong>Von:</strong> ${input.firstName} ${input.lastName} (${input.email})</p>
          <p><strong>Betreff:</strong> ${input.subject}</p>
          <p><strong>Nachricht:</strong></p>
          <p>${input.message.replace(/\n/g, "<br>")}</p>
        `;

        await sendEmail({
          to: "info@gross-ict.ch",
          subject: `Kontaktanfrage: ${input.subject}`,
          html: emailBody,
          text: `Neue Kontaktanfrage von ${input.firstName} ${input.lastName} (${input.email})\nBetreff: ${input.subject}\n\nNachricht:\n${input.message}`,
        });

        // 2. Create a lead in the database
        const db = await getDb();
        if (db) {
          const result = await db.insert(leads).values({
            firstName: input.firstName,
            lastName: input.lastName,
            email: input.email,
            status: "new",
            source: "website",
            notes: `Kontaktanfrage via Website.\nBetreff: ${input.subject}\nNachricht: ${input.message}`,
          });

          // Log initial activity
          const leadId = (result as any)[0]?.insertId || (result as any).insertId;
          if (leadId) {
             await db.insert(leadActivities).values({
               leadId,
               activityType: "note",
               description: "Lead automatisch erstellt durch Kontaktformular",
             });
          }
        }

        return {
          success: true,
          message: "Ihre Nachricht wurde erfolgreich gesendet. Wir setzen uns in Kürze mit Ihnen in Verbindung.",
        };
      } catch (error: any) {
        console.error("Error submitting contact form:", error);
        throw new Error("Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut.");
      }
    }),
});
