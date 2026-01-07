import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { emailTemplates } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const emailTemplateRouter = router({
  // List all email templates
  list: protectedProcedure
    .input(
      z.object({
        category: z.enum(["ticket", "sla", "invoice", "customer", "system", "kundenakquise", "newsletter", "custom", "all"]).optional(),
        activeOnly: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      let query = db.select().from(emailTemplates);

      // Apply filters
      const conditions = [];
      if (input?.category && input.category !== "all") {
        conditions.push(eq(emailTemplates.category, input.category));
      }
      if (input?.activeOnly) {
        conditions.push(eq(emailTemplates.isActive, true));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      const templates = await query.orderBy(desc(emailTemplates.createdAt));
      return templates;
    }),

  // Get a single template by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (!template) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      return template;
    }),

  // Get a template by name
  getByName: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [template] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, input.name))
        .limit(1);

      return template || null;
    }),

  // Create a new template
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        subject: z.string().min(1).max(500),
        body: z.string().min(1),
        designJson: z.string().optional(),
        category: z.enum(["ticket", "sla", "invoice", "customer", "system", "kundenakquise", "newsletter", "custom"]),
        isActive: z.boolean().optional(),
        placeholders: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can create email templates",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if template with same name already exists
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, input.name))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A template with this name already exists",
        });
      }

      const [template] = await db
        .insert(emailTemplates)
        .values({
          name: input.name,
          title: input.title,
          description: input.description,
          subject: input.subject,
          body: input.body,
          designJson: input.designJson || null,
          category: input.category,
          isActive: input.isActive ?? true,
          isSystem: false,
          placeholders: input.placeholders ? JSON.stringify(input.placeholders) : null,
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        })
        .$returningId();

      return { id: template.id, message: "Template created successfully" };
    }),

  // Update an existing template
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        subject: z.string().min(1).max(500).optional(),
        body: z.string().min(1).optional(),
        designJson: z.string().optional(),
        category: z.enum(["ticket", "sla", "invoice", "customer", "system", "kundenakquise", "newsletter", "custom"]).optional(),
        isActive: z.boolean().optional(),
        placeholders: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update email templates",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if template exists and is not a system template
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      if (existing.isSystem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "System templates cannot be modified",
        });
      }

      const updateData: any = {
        updatedBy: ctx.user.id,
      };

      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.body !== undefined) updateData.body = input.body;
      if (input.designJson !== undefined) updateData.designJson = input.designJson;
      if (input.category !== undefined) updateData.category = input.category;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.placeholders !== undefined) {
        updateData.placeholders = JSON.stringify(input.placeholders);
      }

      await db
        .update(emailTemplates)
        .set(updateData)
        .where(eq(emailTemplates.id, input.id));

      return { message: "Template updated successfully" };
    }),

  // Delete a template
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can delete email templates",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if template exists and is not a system template
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      if (existing.isSystem) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "System templates cannot be deleted",
        });
      }

      await db.delete(emailTemplates).where(eq(emailTemplates.id, input.id));

      return { message: "Template deleted successfully" };
    }),

  // Duplicate a template
  duplicate: protectedProcedure
    .input(z.object({ id: z.number(), newName: z.string().min(1).max(100) }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can duplicate email templates",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get the original template
      const [original] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.id, input.id))
        .limit(1);

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      // Check if new name already exists
      const [existing] = await db
        .select()
        .from(emailTemplates)
        .where(eq(emailTemplates.name, input.newName))
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A template with this name already exists",
        });
      }

      // Create duplicate
      const [template] = await db
        .insert(emailTemplates)
        .values({
          name: input.newName,
          title: `${original.title} (Copy)`,
          description: original.description,
          subject: original.subject,
          body: original.body,
          designJson: original.designJson,
          category: original.category,
          isActive: false, // New duplicates start as inactive
          isSystem: false,
          placeholders: original.placeholders,
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        })
        .$returningId();

      return { id: template.id, message: "Template duplicated successfully" };
    }),
});
