import bcrypt from 'bcrypt';
import { drizzle } from 'drizzle-orm/mysql2';
import { users } from '../drizzle/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = 'stefan.gross@hotmail.ch';
const ADMIN_PASSWORD = '!LeliBist.1561!';
const ADMIN_NAME = 'Stefan Gross';

async function seedAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  try {
    // Check if admin already exists
    const existing = await db.select().from(users).where(eq(users.email, ADMIN_EMAIL)).limit(1);

    if (existing.length > 0) {
      console.log('✓ Admin user already exists:', ADMIN_EMAIL);
      
      // Update password if needed
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await db.update(users)
        .set({ 
          password: hashedPassword,
          role: 'admin',
          name: ADMIN_NAME,
          loginMethod: 'local'
        })
        .where(eq(users.email, ADMIN_EMAIL));
      
      console.log('✓ Admin user updated with new password and role');
    } else {
      // Create new admin user
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
      
      await db.insert(users).values({
        email: ADMIN_EMAIL,
        password: hashedPassword,
        name: ADMIN_NAME,
        role: 'admin',
        loginMethod: 'local',
        openId: `local-${Date.now()}`, // Generate unique openId for local auth
      });

      console.log('✓ Admin user created successfully:', ADMIN_EMAIL);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
}

seedAdmin();
