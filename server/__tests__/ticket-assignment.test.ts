import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from '../routers.js';

describe('Ticket Assignment & Statistics', () => {
  let adminCaller: any;
  let supportCaller: any;

  beforeAll(async () => {
    // Create admin caller
    adminCaller = appRouter.createCaller({
      user: {
        id: 1,
        openId: 'admin-test',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
    });

    // Create support caller
    supportCaller = appRouter.createCaller({
      user: {
        id: 2,
        openId: 'support-test',
        name: 'Support User',
        email: 'support@test.com',
        role: 'support',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
    });

  });

  it('should get support staff list (admin)', async () => {
    const staff = await adminCaller.tickets.supportStaff();
    expect(Array.isArray(staff)).toBe(true);
    expect(staff.length).toBeGreaterThan(0);
    expect(staff.some((s: any) => s.role === 'admin' || s.role === 'support')).toBe(true);
  });

  it('should get support staff list (support)', async () => {
    const staff = await supportCaller.tickets.supportStaff();
    expect(Array.isArray(staff)).toBe(true);
  });

  it('should assign ticket to support staff (admin)', async () => {
    // Create a test ticket
    const createResult = await adminCaller.tickets.create({
      customerName: 'Test Customer',
      customerEmail: 'customer@test.com',
      subject: 'Test Ticket for Assignment',
      message: 'This is a test ticket for assignment testing',
      priority: 'medium',
      category: 'network',
    });

    const result = await adminCaller.tickets.assign({
      ticketId: createResult.ticketId,
      assignedTo: 2, // Assign to support user
    });
    expect(result.success).toBe(true);

    // Verify assignment
    const updatedTicket = await adminCaller.tickets.byId({ id: createResult.ticketId });
    expect(updatedTicket.assignedTo).toBe(2);
  });

  it('should unassign ticket (admin)', async () => {
    // Create and assign a ticket first
    const createResult = await adminCaller.tickets.create({
      customerName: 'Test Customer 2',
      customerEmail: 'customer2@test.com',
      subject: 'Test Ticket for Unassignment',
      message: 'This is a test ticket for unassignment testing',
      priority: 'high',
      category: 'security',
    });

    await adminCaller.tickets.assign({
      ticketId: createResult.ticketId,
      assignedTo: 2,
    });

    // Now unassign
    const result = await adminCaller.tickets.assign({
      ticketId: createResult.ticketId,
      assignedTo: null,
    });
    expect(result.success).toBe(true);

    // Verify unassignment
    const updatedTicket = await adminCaller.tickets.byId({ id: createResult.ticketId });
    expect(updatedTicket.assignedTo).toBeNull();
  });

  it('should get detailed statistics', async () => {
    const stats = await adminCaller.tickets.detailedStats();
    
    expect(stats).toHaveProperty('avgResolutionTimeMs');
    expect(stats).toHaveProperty('avgResolutionTimeHours');
    expect(stats).toHaveProperty('ticketsLast7Days');
    expect(stats).toHaveProperty('ticketsLast30Days');
    expect(stats).toHaveProperty('ticketsByDay');
    
    expect(typeof stats.avgResolutionTimeMs).toBe('number');
    expect(typeof stats.avgResolutionTimeHours).toBe('number');
    expect(typeof stats.ticketsLast7Days).toBe('number');
    expect(typeof stats.ticketsLast30Days).toBe('number');
    expect(Array.isArray(stats.ticketsByDay)).toBe(true);
    
    // Check ticketsByDay structure
    if (stats.ticketsByDay.length > 0) {
      const dayData = stats.ticketsByDay[0];
      expect(dayData).toHaveProperty('date');
      expect(dayData).toHaveProperty('network');
      expect(dayData).toHaveProperty('security');
      expect(dayData).toHaveProperty('hardware');
      expect(dayData).toHaveProperty('software');
      expect(dayData).toHaveProperty('email');
      expect(dayData).toHaveProperty('other');
    }
  });

  it('should support user access detailed statistics', async () => {
    const stats = await supportCaller.tickets.detailedStats();
    expect(stats).toHaveProperty('avgResolutionTimeMs');
    expect(stats).toHaveProperty('ticketsByDay');
  });

  it('should prevent non-admin from assigning tickets', async () => {
    // Create a test ticket
    const createResult = await adminCaller.tickets.create({
      customerName: 'Test Customer 3',
      customerEmail: 'customer3@test.com',
      subject: 'Test Ticket for Permission Test',
      message: 'This is a test ticket for permission testing',
      priority: 'low',
      category: 'other',
    });

    const userCaller = appRouter.createCaller({
      user: {
        id: 3,
        openId: 'user-test',
        name: 'Regular User',
        email: 'user@test.com',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
    });

    await expect(
      userCaller.tickets.assign({
        ticketId: createResult.ticketId,
        assignedTo: 2,
      })
    ).rejects.toThrow();
  });
});
