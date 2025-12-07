import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';
import { getUserByEmail } from '../db';

describe('Authentication System', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockContext: TrpcContext;

  beforeAll(() => {
    mockContext = {
      user: undefined,
      req: {
        headers: { 'x-forwarded-proto': 'https' },
        protocol: 'https',
      } as any,
      res: {
        cookie: () => {},
        clearCookie: () => {},
      } as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  describe('User Registration', () => {
    it('should register a new user', async () => {
      const uniqueEmail = `testuser-${Date.now()}@test.com`;
      
      const result = await caller.auth.register({
        email: uniqueEmail,
        password: 'testpassword123',
        name: 'Test User',
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe('Account created successfully');

      // Verify user was created in database
      const user = await getUserByEmail(uniqueEmail);
      expect(user).toBeDefined();
      expect(user?.email).toBe(uniqueEmail);
      expect(user?.name).toBe('Test User');
      expect(user?.role).toBe('user');
    });

    it('should prevent duplicate email registration', async () => {
      const email = `duplicate-${Date.now()}@test.com`;
      
      // Register first time
      await caller.auth.register({
        email,
        password: 'password123',
        name: 'First User',
      });

      // Try to register again with same email
      await expect(
        caller.auth.register({
          email,
          password: 'password456',
          name: 'Second User',
        })
      ).rejects.toThrow('Email already registered');
    });

    it('should validate password length', async () => {
      await expect(
        caller.auth.register({
          email: 'test@test.com',
          password: '12345', // Too short
          name: 'Test User',
        })
      ).rejects.toThrow();
    });
  });

  describe('User Login', () => {
    const testEmail = `logintest-${Date.now()}@test.com`;
    const testPassword = 'testpassword123';

    beforeAll(async () => {
      // Create a test user
      await caller.auth.register({
        email: testEmail,
        password: testPassword,
        name: 'Login Test User',
      });
    });

    it('should login with correct credentials', async () => {
      const result = await caller.auth.login({
        email: testEmail,
        password: testPassword,
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
    });

    it('should reject login with wrong password', async () => {
      await expect(
        caller.auth.login({
          email: testEmail,
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should reject login with non-existent email', async () => {
      await expect(
        caller.auth.login({
          email: 'nonexistent@test.com',
          password: 'password123',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('Admin User', () => {
    it('should verify admin user exists', async () => {
      const adminEmail = 'stefan.gross@hotmail.ch';
      const admin = await getUserByEmail(adminEmail);

      expect(admin).toBeDefined();
      expect(admin?.email).toBe(adminEmail);
      expect(admin?.role).toBe('admin');
      expect(admin?.password).toBeDefined();
    });

    it('should allow admin login', async () => {
      const result = await caller.auth.login({
        email: 'stefan.gross@hotmail.ch',
        password: '!LeliBist.1561!',
      });

      expect(result.success).toBe(true);
      expect(result.user.role).toBe('admin');
    });
  });
});
