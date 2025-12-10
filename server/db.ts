import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2";
import { InsertUser, users, tickets, InsertTicket, Ticket, ticketComments, InsertTicketComment, TicketComment, ticketAttachments, InsertTicketAttachment, TicketAttachment } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db) {
    try {
      // Support both DATABASE_URL and separate DB components
      if (process.env.DATABASE_URL) {
        _db = drizzle(process.env.DATABASE_URL);
      } else if (process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME) {
        // Create connection with separate components (for passwords with special characters)
        const connection = mysql.createPool({
          host: process.env.DB_HOST,
          port: parseInt(process.env.DB_PORT || '3306'),
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });
        _db = drizzle(connection);
        console.log('[Database] Connected using separate DB components');
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values(user);
  return result;
}

// Ticket helpers
export async function createTicket(ticket: InsertTicket): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(tickets).values(ticket);
  return Number(result[0].insertId);
}

export async function getTicketsByUserId(userId: number): Promise<Ticket[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(tickets).where(eq(tickets.userId, userId));
}

export async function getAllTickets(): Promise<Ticket[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(tickets);
}

export async function getTicketById(id: number): Promise<Ticket | undefined> {
  const db = await getDb();
  if (!db) {
    return undefined;
  }

  const result = await db.select().from(tickets).where(eq(tickets.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateTicket(id: number, updates: Partial<InsertTicket>) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.update(tickets).set(updates).where(eq(tickets.id, id));
}

// Ticket comment helpers
export async function createTicketComment(comment: InsertTicketComment): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(ticketComments).values(comment);
  return Number(result[0].insertId);
}

export async function getCommentsByTicketId(ticketId: number): Promise<TicketComment[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  const comments = await db
    .select({
      id: ticketComments.id,
      ticketId: ticketComments.ticketId,
      userId: ticketComments.userId,
      message: ticketComments.message,
      isInternal: ticketComments.isInternal,
      createdAt: ticketComments.createdAt,
      userName: users.name,
    })
    .from(ticketComments)
    .leftJoin(users, eq(ticketComments.userId, users.id))
    .where(eq(ticketComments.ticketId, ticketId))
    .orderBy(ticketComments.createdAt);

  return comments as any;
}

// Ticket attachment helpers
export async function createTicketAttachment(attachment: InsertTicketAttachment): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(ticketAttachments).values(attachment);
  return Number(result[0].insertId);
}

export async function getAttachmentsByTicketId(ticketId: number): Promise<TicketAttachment[]> {
  const db = await getDb();
  if (!db) {
    return [];
  }

  return await db.select().from(ticketAttachments).where(eq(ticketAttachments.ticketId, ticketId));
}

export async function deleteAttachment(id: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return await db.delete(ticketAttachments).where(eq(ticketAttachments.id, id));
}
