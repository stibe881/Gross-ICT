import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import {
  newsletterAutomations,
  newsletterAutomationSteps,
  newsletterAutomationExecutions,
  newsletterAutomationStepLogs,
} from "../drizzle/schema_newsletter";
import { eq, and, desc } from "drizzle-orm";

export const newsletterAutomationRouter = router({
  // List all automations
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.enum(["draft", "active", "paused"]).optional(),
      })
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.pageSize;
      const whereConditions = input.status
        ? eq(newsletterAutomations.status, input.status)
        : undefined;

      const automations = await db
        .select()
        .from(newsletterAutomations)
        .where(whereConditions)
        .orderBy(desc(newsletterAutomations.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      return { automations };
    }),

  // Get automation by ID with steps
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: { input: { id: number } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [automation] = await db
        .select()
        .from(newsletterAutomations)
        .where(eq(newsletterAutomations.id, input.id));

      if (!automation) {
        throw new Error("Automation not found");
      }

      const steps = await db
        .select()
        .from(newsletterAutomationSteps)
        .where(eq(newsletterAutomationSteps.automationId, input.id))
        .orderBy(newsletterAutomationSteps.stepOrder);

      return { automation, steps };
    }),

  // Create automation
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        triggerType: z.enum(["welcome", "birthday", "re_engagement", "custom"]),
        triggerConfig: z.any().optional(),
        segmentId: z.number().optional(),
        steps: z.array(
          z.object({
            stepOrder: z.number(),
            delayValue: z.number().default(0),
            delayUnit: z.enum(["minutes", "hours", "days"]).default("minutes"),
            subject: z.string().min(1),
            htmlContent: z.string().min(1),
            templateId: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }: { input: any; ctx: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(newsletterAutomations).values({
        name: input.name,
        description: input.description,
        triggerType: input.triggerType,
        triggerConfig: input.triggerConfig
          ? JSON.stringify(input.triggerConfig)
          : null,
        segmentId: input.segmentId,
        status: "draft",
        createdBy: ctx.user.id,
      });

      const automationId = result.insertId;

      // Insert steps
      if (input.steps.length > 0) {
        await db.insert(newsletterAutomationSteps).values(
          input.steps.map((step: any) => ({
            automationId,
            stepOrder: step.stepOrder,
            delayValue: step.delayValue,
            delayUnit: step.delayUnit,
            subject: step.subject,
            htmlContent: step.htmlContent,
            templateId: step.templateId,
          }))
        );
      }

      return { id: automationId };
    }),

  // Update automation
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        triggerType: z
          .enum(["welcome", "birthday", "re_engagement", "custom"])
          .optional(),
        triggerConfig: z.any().optional(),
        segmentId: z.number().optional(),
        status: z.enum(["draft", "active", "paused"]).optional(),
        steps: z
          .array(
            z.object({
              id: z.number().optional(),
              stepOrder: z.number(),
              delayValue: z.number().default(0),
              delayUnit: z.enum(["minutes", "hours", "days"]).default("minutes"),
              subject: z.string().min(1),
              htmlContent: z.string().min(1),
              templateId: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name) updateData.name = input.name;
      if (input.description !== undefined)
        updateData.description = input.description;
      if (input.triggerType) updateData.triggerType = input.triggerType;
      if (input.triggerConfig)
        updateData.triggerConfig = JSON.stringify(input.triggerConfig);
      if (input.segmentId !== undefined) updateData.segmentId = input.segmentId;
      if (input.status) updateData.status = input.status;

      await db
        .update(newsletterAutomations)
        .set(updateData)
        .where(eq(newsletterAutomations.id, input.id));

      // Update steps if provided
      if (input.steps) {
        // Delete existing steps
        await db
          .delete(newsletterAutomationSteps)
          .where(eq(newsletterAutomationSteps.automationId, input.id));

        // Insert new steps
        if (input.steps.length > 0) {
          await db.insert(newsletterAutomationSteps).values(
            input.steps.map((step: any) => ({
              automationId: input.id,
              stepOrder: step.stepOrder,
              delayValue: step.delayValue,
              delayUnit: step.delayUnit,
              subject: step.subject,
              htmlContent: step.htmlContent,
              templateId: step.templateId,
            }))
          );
        }
      }

      return { success: true };
    }),

  // Delete automation
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }: { input: { id: number } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Delete steps first
      await db
        .delete(newsletterAutomationSteps)
        .where(eq(newsletterAutomationSteps.automationId, input.id));

      // Delete executions
      await db
        .delete(newsletterAutomationExecutions)
        .where(eq(newsletterAutomationExecutions.automationId, input.id));

      // Delete automation
      await db
        .delete(newsletterAutomations)
        .where(eq(newsletterAutomations.id, input.id));

      return { success: true };
    }),

  // Activate/Deactivate automation
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["draft", "active", "paused"]),
      })
    )
    .mutation(async ({ input }: { input: { id: number; status: string } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(newsletterAutomations)
        .set({ status: input.status })
        .where(eq(newsletterAutomations.id, input.id));

      return { success: true };
    }),

  // Get automation statistics
  getStats: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }: { input: { id: number } }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const executions = await db
        .select()
        .from(newsletterAutomationExecutions)
        .where(eq(newsletterAutomationExecutions.automationId, input.id));

      const totalExecutions = executions.length;
      const completedExecutions = executions.filter(
        (e: any) => e.status === "completed"
      ).length;
      const pendingExecutions = executions.filter(
        (e: any) => e.status === "pending"
      ).length;
      const failedExecutions = executions.filter(
        (e: any) => e.status === "failed"
      ).length;

      return {
        totalExecutions,
        completedExecutions,
        pendingExecutions,
        failedExecutions,
        completionRate:
          totalExecutions > 0
            ? (completedExecutions / totalExecutions) * 100
            : 0,
      };
    }),
});
