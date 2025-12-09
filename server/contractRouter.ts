import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { contracts, contractItems, customers, invoices, invoiceItems, recurringInvoices } from "../drizzle/schema";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export const contractRouter = router({
  // Get all contracts with optional filters
  getAll: protectedProcedure
    .input(
      z.object({
        customerId: z.number().optional(),
        status: z.enum(["draft", "active", "expired", "cancelled", "renewed"]).optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let query = db
        .select({
          contract: contracts,
          customer: customers,
        })
        .from(contracts)
        .leftJoin(customers, eq(contracts.customerId, customers.id))
        .$dynamic();

      const conditions = [];
      if (input.customerId) {
        conditions.push(eq(contracts.customerId, input.customerId));
      }
      if (input.status) {
        conditions.push(eq(contracts.status, input.status));
      }
      if (input.search) {
        conditions.push(
          or(
            like(contracts.contractNumber, `%${input.search}%`),
            like(contracts.title, `%${input.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      const results = await query.orderBy(desc(contracts.createdAt));
      return results;
    }),

  // Get contract by ID with items
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, input.id));

      if (!contract) throw new Error("Contract not found");

      const items = await db
        .select()
        .from(contractItems)
        .where(eq(contractItems.contractId, input.id))
        .orderBy(contractItems.position);

      return { contract, items };
    }),

  // Create new contract
  create: protectedProcedure
    .input(
      z.object({
        customerId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        contractType: z.enum(["service", "license", "support", "hosting", "maintenance", "other"]),
        startDate: z.string(),
        endDate: z.string(),
        billingInterval: z.enum(["monthly", "quarterly", "yearly", "one_time"]),
        paymentTermsDays: z.number().default(30),
        autoRenew: z.number().default(0),
        renewalNoticeDays: z.number().default(30),
        slaId: z.number().optional(),
        slaResponseTime: z.number().optional(),
        slaResolutionTime: z.number().optional(),
        notes: z.string().optional(),
        terms: z.string().optional(),
        items: z.array(
          z.object({
            description: z.string(),
            quantity: z.string(),
            unit: z.string(),
            unitPrice: z.string(),
            vatRate: z.string(),
            discount: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate contract number
      const year = new Date().getFullYear();
      const lastContract = await db
        .select()
        .from(contracts)
        .where(like(contracts.contractNumber, `VTR-${year}-%`))
        .orderBy(desc(contracts.contractNumber))
        .limit(1);

      let contractNumber = `VTR-${year}-001`;
      if (lastContract.length > 0) {
        const lastNumber = parseInt(lastContract[0].contractNumber.split("-")[2]);
        contractNumber = `VTR-${year}-${String(lastNumber + 1).padStart(3, "0")}`;
      }

      // Calculate totals
      let subtotal = 0;
      let discountAmount = 0;
      let vatAmount = 0;

      const itemsWithTotals = input.items.map((item, index) => {
        const qty = parseFloat(item.quantity);
        const price = parseFloat(item.unitPrice);
        const disc = parseFloat(item.discount);
        const vat = parseFloat(item.vatRate);

        const itemTotal = qty * price * (1 - disc / 100);
        const itemVat = itemTotal * (vat / 100);
        const itemDiscount = qty * price * (disc / 100);

        subtotal += qty * price;
        discountAmount += itemDiscount;
        vatAmount += itemVat;

        return {
          position: index + 1,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount,
          total: itemTotal.toFixed(2),
        };
      });

      const totalAmount = subtotal - discountAmount + vatAmount;

      // Calculate next billing date
      let nextBillingDate = null;
      if (input.billingInterval !== "one_time") {
        const start = new Date(input.startDate);
        nextBillingDate = start;
      }

      // Insert contract
      const insertData: any = {
        contractNumber,
        customerId: input.customerId,
        title: input.title,
        description: input.description,
        contractType: input.contractType,
        status: "draft" as const,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        billingInterval: input.billingInterval,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        vatAmount: vatAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        paymentTermsDays: input.paymentTermsDays,
        autoRenew: input.autoRenew,
        renewalNoticeDays: input.renewalNoticeDays,
        slaId: input.slaId,
        slaResponseTime: input.slaResponseTime,
        slaResolutionTime: input.slaResolutionTime,
        notes: input.notes,
        terms: input.terms,
        createdBy: ctx.user.id,
      };
      
      if (nextBillingDate) {
        insertData.nextBillingDate = nextBillingDate;
      }

      const [newContract] = await db.insert(contracts).values(insertData);

      // Insert items
      const contractId = newContract.insertId;
      for (const item of itemsWithTotals) {
        await db.insert(contractItems).values({
          contractId,
          ...item,
        });
      }

      return { id: contractId, contractNumber };
    }),

  // Update contract status
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "active", "expired", "cancelled", "renewed"]),
        signedDate: z.string().optional(),
        cancelledDate: z.string().optional(),
        cancellationReason: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {
        status: input.status,
        cancellationReason: input.cancellationReason,
      };
      
      if (input.signedDate) {
        updateData.signedDate = new Date(input.signedDate);
      }
      if (input.cancelledDate) {
        updateData.cancelledDate = new Date(input.cancelledDate);
      }

      await db
        .update(contracts)
        .set(updateData)
        .where(eq(contracts.id, input.id));

      return { success: true };
    }),

  // Delete contract
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete items first
      await db.delete(contractItems).where(eq(contractItems.contractId, input.id));
      
      // Delete contract
      await db.delete(contracts).where(eq(contracts.id, input.id));

      return { success: true };
    }),

  // Convert contract to one-time invoice
  convertToInvoice: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get contract with items
      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, input.contractId));

      if (!contract) throw new Error("Contract not found");

      const items = await db
        .select()
        .from(contractItems)
        .where(eq(contractItems.contractId, input.contractId))
        .orderBy(contractItems.position);

      // Generate invoice number
      const year = new Date().getFullYear();
      const lastInvoice = await db
        .select()
        .from(invoices)
        .where(like(invoices.invoiceNumber, `${year}-%`))
        .orderBy(desc(invoices.invoiceNumber))
        .limit(1);

      let invoiceNumber = `${year}-001`;
      if (lastInvoice.length > 0) {
        const lastNumber = parseInt(lastInvoice[0].invoiceNumber.split("-")[1]);
        invoiceNumber = `${year}-${String(lastNumber + 1).padStart(3, "0")}`;
      }

      // Create invoice
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + contract.paymentTermsDays);

      const [newInvoice] = await db.insert(invoices).values({
        invoiceNumber,
        customerId: contract.customerId,
        invoiceDate: new Date(),
        dueDate,
        status: "draft",
        subtotal: contract.subtotal,
        discountAmount: contract.discountAmount,
        vatAmount: contract.vatAmount,
        totalAmount: contract.totalAmount,
        currency: contract.currency,
        notes: `Rechnung für Vertrag ${contract.contractNumber}: ${contract.title}`,
        createdBy: ctx.user.id,
      });

      // Copy items
      const invoiceId = newInvoice.insertId;
      for (const item of items) {
        await db.insert(invoiceItems).values({
          invoiceId,
          position: item.position,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          discount: item.discount,
          total: item.total,
        });
      }

      return { invoiceId, invoiceNumber };
    }),

  // Convert contract to recurring invoice
  convertToRecurringInvoice: protectedProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get contract with items
      const [contract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, input.contractId));

      if (!contract) throw new Error("Contract not found");

      if (contract.billingInterval === "one_time") {
        throw new Error("Cannot create recurring invoice for one-time contract");
      }

      const items = await db
        .select()
        .from(contractItems)
        .where(eq(contractItems.contractId, input.contractId))
        .orderBy(contractItems.position);

      // Map billing interval
      const intervalMap: Record<string, "monthly" | "quarterly" | "yearly"> = {
        monthly: "monthly",
        quarterly: "quarterly",
        yearly: "yearly",
      };

      const interval = intervalMap[contract.billingInterval];

      // Calculate next run date
      const nextRunDate = contract.nextBillingDate || contract.startDate;

      // Create recurring invoice
      const itemsData = items.map(item => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        vatRate: item.vatRate,
        discount: item.discount,
      }));

      const [newRecurring] = await db.insert(recurringInvoices).values({
        customerId: contract.customerId,
        templateName: `Vertrag ${contract.contractNumber}: ${contract.title}`,
        interval,
        nextRunDate,
        isActive: true,
        notes: contract.notes || "",
        items: JSON.stringify(itemsData),
        discount: "0",
        taxRate: "8.1",
      });

      // Update contract with recurring invoice reference
      await db
        .update(contracts)
        .set({ recurringInvoiceId: newRecurring.insertId })
        .where(eq(contracts.id, input.contractId));

      return { recurringInvoiceId: newRecurring.insertId };
    }),
});
