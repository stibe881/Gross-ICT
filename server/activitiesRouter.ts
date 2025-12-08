import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { activities } from "../drizzle/schema";
import { desc, eq, and, sql } from "drizzle-orm";

export const activitiesRouter = router({
  /**
   * List recent activities with pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        activityType: z.string().optional(),
        entityType: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { page, pageSize, activityType, entityType } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [];
      if (activityType) {
        conditions.push(eq(activities.activityType, activityType));
      }
      if (entityType) {
        conditions.push(eq(activities.entityType, entityType));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const [activityList, totalCountResult] = await Promise.all([
        db
          .select()
          .from(activities)
          .where(whereClause)
          .orderBy(desc(activities.createdAt))
          .limit(pageSize)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(activities)
          .where(whereClause),
      ]);

      return {
        activities: activityList,
        total: Number(totalCountResult[0]?.count || 0),
        page,
        pageSize,
      };
    }),

  /**
   * Create a new activity log entry
   */
  create: protectedProcedure
    .input(
      z.object({
        activityType: z.string(),
        title: z.string(),
        description: z.string().optional(),
        entityType: z.string().optional(),
        entityId: z.number().optional(),
        metadata: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { user } = ctx;

      const [newActivity] = await db.insert(activities).values({
        activityType: input.activityType,
        userId: user.id,
        userName: user.name || user.email || "Unknown",
        title: input.title,
        description: input.description,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
      });

      return newActivity;
    }),

  /**
   * Get activity statistics
   */
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount, weekCount, monthCount] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(activities)
        .where(sql`${activities.createdAt} >= ${today}`),
      db
        .select({ count: sql<number>`count(*)` })
        .from(activities)
        .where(sql`${activities.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
      db
        .select({ count: sql<number>`count(*)` })
        .from(activities)
        .where(sql`${activities.createdAt} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`),
    ]);

    return {
      today: Number(todayCount[0]?.count || 0),
      week: Number(weekCount[0]?.count || 0),
      month: Number(monthCount[0]?.count || 0),
    };
  }),
});
