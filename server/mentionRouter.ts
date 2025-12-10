import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { mentions, users, tickets, ticketComments } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

export const mentionRouter = router({
  // Get unread mentions for the current user
  getUnreadMentions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      return [];
    }

    const unreadMentions = await db
      .select({
        id: mentions.id,
        ticketId: mentions.ticketId,
        commentId: mentions.commentId,
        mentionedByUserId: mentions.mentionedByUserId,
        mentionedByName: users.name,
        ticketSubject: tickets.subject,
        commentText: ticketComments.message,
        createdAt: mentions.createdAt,
      })
      .from(mentions)
      .leftJoin(users, eq(mentions.mentionedByUserId, users.id))
      .leftJoin(tickets, eq(mentions.ticketId, tickets.id))
      .leftJoin(ticketComments, eq(mentions.commentId, ticketComments.id))
      .where(
        and(
          eq(mentions.mentionedUserId, ctx.user!.id),
          eq(mentions.isRead, 0)
        )
      )
      .orderBy(desc(mentions.createdAt))
      .limit(50);

    return unreadMentions;
  }),

  // Mark a mention as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        mentionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error('Database not available');
      }

      // Verify the mention belongs to the current user
      const [mention] = await db
        .select()
        .from(mentions)
        .where(eq(mentions.id, input.mentionId))
        .limit(1);

      if (!mention || mention.mentionedUserId !== ctx.user!.id) {
        throw new Error('Mention not found or unauthorized');
      }

      await db
        .update(mentions)
        .set({ isRead: 1 })
        .where(eq(mentions.id, input.mentionId));

      return { success: true };
    }),

  // Mark all mentions as read for the current user
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error('Database not available');
    }

    await db
      .update(mentions)
      .set({ isRead: 1 })
      .where(
        and(
          eq(mentions.mentionedUserId, ctx.user!.id),
          eq(mentions.isRead, 0)
        )
      );

    return { success: true };
  }),
});
