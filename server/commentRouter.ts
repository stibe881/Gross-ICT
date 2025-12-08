import { z } from 'zod';
import { publicProcedure, router, protectedProcedure } from './_core/trpc';
import { createTicketComment, getCommentsByTicketId, createTicketAttachment, getAttachmentsByTicketId, deleteAttachment, getTicketById } from './db';
import { TRPCError } from '@trpc/server';
import { storagePut } from './storage';

export const commentRouter = router({
  // Get all comments for a ticket
  getComments: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const ticket = await getTicketById(input.ticketId);
      
      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      // Check if user has access to this ticket
      const isAdmin = ctx.user?.role === 'admin';
      const isOwner = ctx.user?.id === ticket.userId;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this ticket',
        });
      }

      const comments = await getCommentsByTicketId(input.ticketId);
      
      // Filter out internal comments for non-admin users
      if (!isAdmin) {
        return comments.filter(c => !c.isInternal);
      }

      return comments;
    }),

  // Create a new comment
  createComment: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      message: z.string().min(1),
      isInternal: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await getTicketById(input.ticketId);
      
      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      // Check if user has access to this ticket
      const isAdmin = ctx.user?.role === 'admin';
      const isOwner = ctx.user?.id === ticket.userId;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this ticket',
        });
      }

      // Only admins can create internal comments
      const isInternal = isAdmin && input.isInternal ? 1 : 0;

      const commentId = await createTicketComment({
        ticketId: input.ticketId,
        userId: ctx.user!.id,
        message: input.message,
        isInternal,
      });

      // Process @mentions in the message
      const mentionRegex = /@(\w+)/g;
      const mentions = input.message.match(mentionRegex);
      
      if (mentions && mentions.length > 0) {
        const { getDb } = await import('./db.js');
        const { users, mentions: mentionsTable } = await import('../drizzle/schema.js');
        const { eq } = await import('drizzle-orm');
        
        const db = await getDb();
        if (db) {
          for (const mention of mentions) {
            const username = mention.substring(1); // Remove @
            const [mentionedUser] = await db.select().from(users).where(eq(users.name, username)).limit(1);
            
            if (mentionedUser) {
              await db.insert(mentionsTable).values({
                commentId,
                ticketId: input.ticketId,
                mentionedUserId: mentionedUser.id,
                mentionedByUserId: ctx.user!.id,
                isRead: 0,
              });
            }
          }
        }
      }

      return {
        success: true,
        commentId,
      };
    }),

  // Get all attachments for a ticket
  getAttachments: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
    }))
    .query(async ({ input, ctx }) => {
      const ticket = await getTicketById(input.ticketId);
      
      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      // Check if user has access to this ticket
      const isAdmin = ctx.user?.role === 'admin';
      const isOwner = ctx.user?.id === ticket.userId;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this ticket',
        });
      }

      return await getAttachmentsByTicketId(input.ticketId);
    }),

  // Upload an attachment
  uploadAttachment: protectedProcedure
    .input(z.object({
      ticketId: z.number(),
      filename: z.string(),
      fileData: z.string(), // Base64 encoded file data
      mimeType: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const ticket = await getTicketById(input.ticketId);
      
      if (!ticket) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      // Check if user has access to this ticket
      const isAdmin = ctx.user?.role === 'admin';
      const isOwner = ctx.user?.id === ticket.userId;

      if (!isAdmin && !isOwner) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this ticket',
        });
      }

      // Decode base64 file data
      const fileBuffer = Buffer.from(input.fileData, 'base64');
      const fileSize = fileBuffer.length;

      // Check file size (max 10MB)
      if (fileSize > 10 * 1024 * 1024) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'File size exceeds 10MB limit',
        });
      }

      // Upload to S3
      const key = `tickets/${input.ticketId}/${Date.now()}-${input.filename}`;
      const uploadResult = await storagePut(key, fileBuffer, input.mimeType);

      // Save to database
      const attachmentId = await createTicketAttachment({
        ticketId: input.ticketId,
        userId: ctx.user!.id,
        filename: input.filename,
        fileUrl: uploadResult.url,
        fileSize,
        mimeType: input.mimeType,
      });

      return {
        success: true,
        attachmentId,
        fileUrl: uploadResult.url,
      };
    }),

  // Delete an attachment
  deleteAttachment: protectedProcedure
    .input(z.object({
      attachmentId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Only admins can delete attachments
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete attachments',
        });
      }

      await deleteAttachment(input.attachmentId);

      return {
        success: true,
      };
    }),
});
