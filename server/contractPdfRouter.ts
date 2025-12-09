import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { contracts, contractItems, customers, contractAttachments } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { storagePut } from "./storage";

export const contractPdfRouter = router({
  // Generate PDF for contract
  generatePdf: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get contract with customer and items
      const [contract] = await db
        .select({
          contract: contracts,
          customer: customers,
        })
        .from(contracts)
        .leftJoin(customers, eq(contracts.customerId, customers.id))
        .where(eq(contracts.id, input.contractId));

      if (!contract) throw new Error("Contract not found");

      const items = await db
        .select()
        .from(contractItems)
        .where(eq(contractItems.contractId, input.contractId))
        .orderBy(contractItems.position);

      // Create PDF
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk: Buffer) => chunks.push(chunk));

      // Header
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("DIENSTLEISTUNGSVERTRAG", { align: "center" })
        .moveDown();

      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Gross ICT", { align: "right" })
        .text("Next-Gen IT Services", { align: "right" })
        .text("Schweiz", { align: "right" })
        .moveDown(2);

      // Contract Info
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text(`Vertragsnummer: ${contract.contract.contractNumber}`)
        .font("Helvetica")
        .fontSize(10)
        .text(`Vertragsdatum: ${new Date(contract.contract.createdAt).toLocaleDateString("de-CH")}`)
        .text(`Laufzeit: ${new Date(contract.contract.startDate).toLocaleDateString("de-CH")} bis ${new Date(contract.contract.endDate).toLocaleDateString("de-CH")}`)
        .moveDown();

      // Customer Info
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Kunde:")
        .font("Helvetica")
        .fontSize(10)
        .text(contract.customer?.name || "")
        .text(contract.customer?.email || "")
        .text(contract.customer?.phone || "")
        .moveDown(2);

      // Contract Title and Description
      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .text(contract.contract.title)
        .moveDown(0.5);

      if (contract.contract.description) {
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(contract.contract.description)
          .moveDown();
      }

      // Items Table
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Leistungen und Preise:")
        .moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      const col1 = 50;
      const col2 = 250;
      const col3 = 330;
      const col4 = 390;
      const col5 = 470;

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .text("Beschreibung", col1, tableTop)
        .text("Menge", col2, tableTop)
        .text("Einheit", col3, tableTop)
        .text("Preis", col4, tableTop)
        .text("Total", col5, tableTop);

      doc.moveTo(col1, tableTop + 15).lineTo(545, tableTop + 15).stroke();

      // Table Rows
      let y = tableTop + 25;
      doc.font("Helvetica").fontSize(9);

      items.forEach((item) => {
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        const description = item.description.length > 40 
          ? item.description.substring(0, 37) + "..." 
          : item.description;

        doc
          .text(description, col1, y, { width: 190 })
          .text(item.quantity, col2, y)
          .text(item.unit, col3, y)
          .text(`CHF ${parseFloat(item.unitPrice).toFixed(2)}`, col4, y)
          .text(`CHF ${parseFloat(item.total).toFixed(2)}`, col5, y);

        y += 20;
      });

      // Totals
      y += 10;
      doc.moveTo(col1, y).lineTo(545, y).stroke();
      y += 15;

      doc
        .font("Helvetica-Bold")
        .text("Zwischensumme:", col4, y)
        .text(`CHF ${parseFloat(contract.contract.subtotal).toFixed(2)}`, col5, y);
      y += 15;

      if (parseFloat(contract.contract.discountAmount) > 0) {
        doc
          .text("Rabatt:", col4, y)
          .text(`-CHF ${parseFloat(contract.contract.discountAmount).toFixed(2)}`, col5, y);
        y += 15;
      }

      doc
        .text("MwSt:", col4, y)
        .text(`CHF ${parseFloat(contract.contract.vatAmount).toFixed(2)}`, col5, y);
      y += 15;

      doc.moveTo(col4, y).lineTo(545, y).stroke();
      y += 15;

      doc
        .fontSize(11)
        .text("Gesamtbetrag:", col4, y)
        .text(`CHF ${parseFloat(contract.contract.totalAmount).toFixed(2)}`, col5, y);

      // Terms
      if (contract.contract.terms) {
        doc.addPage();
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .text("Vertragsbedingungen:")
          .moveDown(0.5)
          .fontSize(10)
          .font("Helvetica")
          .text(contract.contract.terms)
          .moveDown(2);
      }

      // Signature Section
      doc.addPage();
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Unterschriften:")
        .moveDown(2);

      const signY = doc.y;

      // Customer Signature
      doc
        .fontSize(10)
        .font("Helvetica")
        .text("Kunde:", 50, signY)
        .moveDown(3)
        .text("_".repeat(30), 50)
        .text(contract.customer?.name || "", 50)
        .text("Datum: _______________", 50);

      // Company Signature
      doc
        .text("Gross ICT:", 320, signY)
        .moveDown(3)
        .text("_".repeat(30), 320)
        .text("Geschäftsführung", 320)
        .text("Datum: _______________", 320);

      doc.end();

      // Wait for PDF generation to complete
      const pdfBuffer = await new Promise<Buffer>((resolve) => {
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
      });

      // Upload to S3
      const fileName = `contract-${contract.contract.contractNumber}-${Date.now()}.pdf`;
      const { key, url } = await storagePut(
        `contracts/${fileName}`,
        pdfBuffer,
        "application/pdf"
      );

      // Save attachment record
      await db.insert(contractAttachments).values({
        contractId: input.contractId,
        fileName,
        filePath: key,
        fileUrl: url,
        fileSize: pdfBuffer.length,
        mimeType: "application/pdf",
        uploadedBy: ctx.user.id,
      });

      return {
        success: true,
        url,
        fileName,
      };
    }),

  // Get contract attachments
  getAttachments: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const attachments = await db
        .select()
        .from(contractAttachments)
        .where(eq(contractAttachments.contractId, input.contractId));

      return attachments;
    }),

  // Delete attachment
  deleteAttachment: protectedProcedure
    .input(z.object({ attachmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(contractAttachments)
        .where(eq(contractAttachments.id, input.attachmentId));

      return { success: true };
    }),
});
