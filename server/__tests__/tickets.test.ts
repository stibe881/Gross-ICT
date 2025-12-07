import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers';
import type { TrpcContext } from '../_core/context';

describe('Ticket System', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockContext: TrpcContext;

  beforeAll(() => {
    // Create a mock context for testing
    mockContext = {
      user: {
        id: 1,
        openId: 'test-user',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        loginMethod: 'local',
        createdAt: new Date(),
        lastSignedIn: new Date(),
      },
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

  describe('Ticket Creation', () => {
    it('should create a ticket without account creation', async () => {
      const result = await caller.tickets.create({
        customerName: 'Test Customer',
        customerEmail: 'customer@test.com',
        subject: 'Test Ticket',
        message: 'This is a test ticket message',
        priority: 'medium',
        createAccount: false,
      });

      expect(result.success).toBe(true);
      expect(result.ticketId).toBeDefined();
      expect(result.accountCreated).toBe(false);
    });

    it('should create a ticket with account creation', async () => {
      const uniqueEmail = `newuser-${Date.now()}@test.com`;
      
      const result = await caller.tickets.create({
        customerName: 'New User',
        customerEmail: uniqueEmail,
        subject: 'Test Ticket with Account',
        message: 'This ticket should create a new account',
        priority: 'high',
        createAccount: true,
        password: 'testpassword123',
      });

      expect(result.success).toBe(true);
      expect(result.ticketId).toBeDefined();
      expect(result.accountCreated).toBe(true);
    });

    it('should validate required fields', async () => {
      await expect(
        caller.tickets.create({
          customerName: '',
          customerEmail: 'test@test.com',
          subject: 'Test',
          message: 'Test message',
          priority: 'medium',
        })
      ).rejects.toThrow();
    });
  });

  describe('Ticket Retrieval', () => {
    it('should retrieve user tickets', async () => {
      const tickets = await caller.tickets.myTickets();
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should require authentication for myTickets', async () => {
      const unauthenticatedCaller = appRouter.createCaller({
        user: undefined,
        req: {
          headers: { 'x-forwarded-proto': 'https' },
          protocol: 'https',
        } as any,
        res: {
          cookie: () => {},
          clearCookie: () => {},
        } as any,
      });

      await expect(unauthenticatedCaller.tickets.myTickets()).rejects.toThrow();
    });
  });

  describe('Admin Operations', () => {
    let adminCaller: ReturnType<typeof appRouter.createCaller>;

    beforeAll(() => {
      const adminContext: TrpcContext = {
        user: {
          id: 999,
          openId: 'admin-user',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          loginMethod: 'local',
          createdAt: new Date(),
          lastSignedIn: new Date(),
        },
        req: {
          headers: { 'x-forwarded-proto': 'https' },
          protocol: 'https',
        } as any,
        res: {
          cookie: () => {},
          clearCookie: () => {},
        } as any,
      };

      adminCaller = appRouter.createCaller(adminContext);
    });

    it('should allow admin to view all tickets', async () => {
      const tickets = await adminCaller.tickets.all();
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should allow admin to view ticket statistics', async () => {
      const stats = await adminCaller.tickets.stats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('open');
      expect(stats).toHaveProperty('inProgress');
      expect(stats).toHaveProperty('resolved');
      expect(stats).toHaveProperty('byPriority');
    });

    it('should prevent non-admin from viewing all tickets', async () => {
      await expect(caller.tickets.all()).rejects.toThrow('Admin access required');
    });
  });
});
