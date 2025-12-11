import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { sql } from "drizzle-orm";

export const dashboardPreferencesRouter = router({
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [preferences] = await db.execute(
      sql`SELECT widgetOrder FROM user_dashboard_preferences WHERE userId = ${ctx.user.id} LIMIT 1`
    );

    if (!preferences || !Array.isArray(preferences) || preferences.length === 0) {
      return null;
    }

    return {
      widgetOrder: JSON.parse((preferences[0] as any).widgetOrder || "[]"),
    };
  }),

  savePreferences: protectedProcedure
    .input(
      z.object({
        widgetOrder: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const widgetOrderJson = JSON.stringify(input.widgetOrder);

      await db.execute(
        sql`INSERT INTO user_dashboard_preferences (userId, widgetOrder, createdAt, updatedAt)
            VALUES (${ctx.user.id}, ${widgetOrderJson}, NOW(), NOW())
            ON DUPLICATE KEY UPDATE widgetOrder = ${widgetOrderJson}, updatedAt = NOW()`
      );

      return { success: true };
    }),
});
