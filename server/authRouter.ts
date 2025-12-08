import bcrypt from 'bcrypt';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { publicProcedure, router, protectedProcedure } from './_core/trpc';
import { getUserByEmail, createUser } from './db';
import { SignJWT } from 'jose';
import { ENV } from './_core/env';
import { COOKIE_NAME } from '@shared/const';
import { getSessionCookieOptions } from './_core/cookies';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || ENV.cookieSecret);

export const authRouter = router({
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
    }))
    .mutation(async ({ input, ctx }) => {
      const user = await getUserByEmail(input.email);

      if (!user || !user.password) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const isValid = await bcrypt.compare(input.password, user.password);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      // Create JWT token
      const token = await new SignJWT({
        openId: user.openId,
        email: user.email,
        role: user.role,
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(JWT_SECRET);

      // Set cookie
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

      return {
        success: true,
        user: {
          id: String(user.id),
          email: user.email || '',
          name: user.name || '',
          role: user.role || 'user',
        },
      };
    }),

  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const existing = await getUserByEmail(input.email);

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already registered',
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      await createUser({
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role: 'user',
        loginMethod: 'local',
        openId: `local-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      });

      return {
        success: true,
        message: 'Account created successfully',
      };
    }),

  me: publicProcedure.query(({ ctx }) => ctx.user),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return {
      success: true,
    } as const;
  }),
});
