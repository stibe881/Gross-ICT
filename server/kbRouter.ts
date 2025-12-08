import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { kbArticles } from "../drizzle/schema";
import { eq, like, or, and, sql } from "drizzle-orm";

export const kbRouter = router({
  // Get all KB articles (filtered by visibility for non-staff)
  all: publicProcedure
    .input(
      z.object({
        category: z.string().optional(),
        search: z.string().optional(),
        visibility: z.enum(["internal", "public"]).optional(),
      }).optional()
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const user = ctx.user;
      const isStaff = user?.role === "admin" || user?.role === "support";

      let query = db!.select().from(kbArticles);
      const conditions = [];

      // Non-staff can only see public articles
      if (!isStaff) {
        conditions.push(eq(kbArticles.visibility, "public"));
      } else if (input?.visibility) {
        conditions.push(eq(kbArticles.visibility, input.visibility));
      }

      if (input?.category) {
        conditions.push(eq(kbArticles.category, input.category));
      }

      if (input?.search) {
        conditions.push(
          or(
            like(kbArticles.title, `%${input.search}%`),
            like(kbArticles.content, `%${input.search}%`),
            like(kbArticles.tags, `%${input.search}%`)
          )!
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)!) as typeof query;
      }

      const articles = await query as any[];
      return articles.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }),

  // Get single KB article by ID
  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      const user = ctx.user;
      const isStaff = user?.role === "admin" || user?.role === "support";

      const [article] = await db!
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.id, input.id));

      if (!article) {
        throw new Error("Article not found");
      }

      // Non-staff can only see public articles
      if (!isStaff && article.visibility === "internal") {
        throw new Error("Access denied");
      }

      // Increment view count
      await db!
        .update(kbArticles)
        .set({ viewCount: article.viewCount + 1 })
        .where(eq(kbArticles.id, input.id));

      return { ...article, viewCount: article.viewCount + 1 };
    }),

  // Create KB article (staff only)
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().min(1),
        tags: z.string().optional(),
        visibility: z.enum(["internal", "public"]),
        sourceTicketId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (user.role !== "admin" && user.role !== "support") {
        throw new Error("Access denied");
      }

      const db = await getDb();
      const result = await db!.insert(kbArticles).values({
        title: input.title,
        content: input.content,
        category: input.category,
        tags: input.tags || "",
        visibility: input.visibility,
        sourceTicketId: input.sourceTicketId,
        authorId: user.id,
      });

      return { success: true, articleId: Number((result as any).insertId) };
    }),

  // Update KB article (staff only)
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        category: z.string().min(1).optional(),
        tags: z.string().optional(),
        visibility: z.enum(["internal", "public"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (user.role !== "admin" && user.role !== "support") {
        throw new Error("Access denied");
      }

      const db = await getDb();
      const { id, ...updates } = input;

      await db!
        .update(kbArticles)
        .set(updates)
        .where(eq(kbArticles.id, id));

      return { success: true };
    }),

  // Delete KB article (admin only)
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const user = ctx.user;
      if (user.role !== "admin") {
        throw new Error("Access denied - admin only");
      }

      const db = await getDb();
      await db!.delete(kbArticles).where(eq(kbArticles.id, input.id));

      return { success: true };
    }),

  // Mark article as helpful
  markHelpful: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [article] = await db!
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.id, input.id));

      if (!article) {
        throw new Error("Article not found");
      }

      await db!
        .update(kbArticles)
        .set({ helpfulCount: article.helpfulCount + 1 })
        .where(eq(kbArticles.id, input.id));

      return { success: true, helpfulCount: article.helpfulCount + 1 };
    }),

  // Mark article as not helpful
  markNotHelpful: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      const [article] = await db!
        .select()
        .from(kbArticles)
        .where(eq(kbArticles.id, input.id));

      if (!article) {
        throw new Error("Article not found");
      }

      await db!
        .update(kbArticles)
        .set({ notHelpfulCount: article.notHelpfulCount + 1 })
        .where(eq(kbArticles.id, input.id));

      return { success: true, notHelpfulCount: article.notHelpfulCount + 1 };
    }),

  // Get categories
  categories: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const user = ctx.user;
    const isStaff = user?.role === "admin" || user?.role === "support";

    let query = db!
      .select({ category: kbArticles.category })
      .from(kbArticles)
      .groupBy(kbArticles.category);

    if (!isStaff) {
      query = query.where(eq(kbArticles.visibility, "public")) as typeof query;
    }

    const categories = await query as any[];
    return categories.map((c) => c.category);
  }),
});
