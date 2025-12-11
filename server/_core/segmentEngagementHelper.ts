import { getDb } from "../db";
import { newsletterSubscribers, newsletterActivity } from "../../drizzle/schema";
import { eq, sql, and, inArray } from "drizzle-orm";

/**
 * Build SQL conditions for engagement-based segment criteria
 */
export async function buildEngagementConditions(criteria: any): Promise<any[]> {
  const conditions: any[] = [];
  const db = await getDb();
  if (!db) return conditions;

  // Basic status filter
  if (criteria.status && criteria.status.length > 0) {
    conditions.push(inArray(newsletterSubscribers.status, criteria.status));
  }

  // Date range filters
  if (criteria.subscribedAfter) {
    conditions.push(
      sql`${newsletterSubscribers.subscribedAt} >= ${criteria.subscribedAfter}`
    );
  }

  if (criteria.subscribedBefore) {
    conditions.push(
      sql`${newsletterSubscribers.subscribedAt} <= ${criteria.subscribedBefore}`
    );
  }

  // Engagement-based filters using subqueries
  if (criteria.hasOpenedInDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - criteria.hasOpenedInDays);
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${newsletterActivity}
        WHERE ${newsletterActivity.subscriberId} = ${newsletterSubscribers.id}
        AND ${newsletterActivity.activityType} = 'opened'
        AND ${newsletterActivity.createdAt} >= ${daysAgo}
      )`
    );
  }

  if (criteria.hasClickedInDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - criteria.hasClickedInDays);
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${newsletterActivity}
        WHERE ${newsletterActivity.subscriberId} = ${newsletterSubscribers.id}
        AND ${newsletterActivity.activityType} = 'clicked'
        AND ${newsletterActivity.createdAt} >= ${daysAgo}
      )`
    );
  }

  if (criteria.hasNotOpenedInDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - criteria.hasNotOpenedInDays);
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${newsletterActivity}
        WHERE ${newsletterActivity.subscriberId} = ${newsletterSubscribers.id}
        AND ${newsletterActivity.activityType} = 'opened'
        AND ${newsletterActivity.createdAt} >= ${daysAgo}
      )`
    );
  }

  if (criteria.hasNotClickedInDays) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - criteria.hasNotClickedInDays);
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${newsletterActivity}
        WHERE ${newsletterActivity.subscriberId} = ${newsletterSubscribers.id}
        AND ${newsletterActivity.activityType} = 'clicked'
        AND ${newsletterActivity.createdAt} >= ${daysAgo}
      )`
    );
  }

  if (criteria.minOpens) {
    conditions.push(
      sql`(
        SELECT COUNT(*) FROM ${newsletterActivity}
        WHERE ${newsletterActivity.subscriberId} = ${newsletterSubscribers.id}
        AND ${newsletterActivity.activityType} = 'opened'
      ) >= ${criteria.minOpens}`
    );
  }

  if (criteria.minClicks) {
    conditions.push(
      sql`(
        SELECT COUNT(*) FROM ${newsletterActivity}
        WHERE ${newsletterActivity.subscriberId} = ${newsletterSubscribers.id}
        AND ${newsletterActivity.activityType} = 'clicked'
      ) >= ${criteria.minClicks}`
    );
  }

  return conditions;
}

/**
 * Count subscribers matching engagement criteria
 */
export async function countSubscribersByEngagement(
  criteria: any
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  try {
    const conditions = await buildEngagementConditions(criteria);

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(newsletterSubscribers)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return Number(countResult?.count || 0);
  } catch (error) {
    console.error("[Segment Helper] Error counting subscribers:", error);
    return 0;
  }
}

/**
 * Get subscribers matching engagement criteria
 */
export async function getSubscribersByEngagement(
  criteria: any,
  limit?: number,
  offset?: number
): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];

  try {
    const conditions = await buildEngagementConditions(criteria);

    let query = db
      .select()
      .from(newsletterSubscribers)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    if (limit !== undefined) {
      query = query.limit(limit) as any;
    }

    if (offset !== undefined) {
      query = query.offset(offset) as any;
    }

    const subscribers = await query;
    return subscribers;
  } catch (error) {
    console.error("[Segment Helper] Error getting subscribers:", error);
    return [];
  }
}

/**
 * Update lastActivityAt when subscriber opens or clicks
 */
export async function updateSubscriberActivity(
  subscriberId: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  try {
    await db
      .update(newsletterSubscribers)
      .set({ lastActivityAt: new Date() })
      .where(eq(newsletterSubscribers.id, subscriberId));
  } catch (error) {
    console.error("[Segment Helper] Error updating activity:", error);
  }
}
