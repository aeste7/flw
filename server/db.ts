import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });

// Seed the database with initial data
export async function seedDatabase() {
  // Check if the database already has data
  const flowers = await db.select().from(schema.warehouse);
  if (flowers.length === 0) {
    // Add some sample flowers to warehouse
    await db.insert(schema.warehouse).values([
      { flower: "Red Roses", amount: 24, dateTime: new Date() },
      { flower: "White Lilies", amount: 18, dateTime: new Date() },
      { flower: "Pink Carnations", amount: 30, dateTime: new Date() },
      { flower: "Yellow Tulips", amount: 15, dateTime: new Date() },
    ]);
    
    // Add some sample notes
    await db.insert(schema.notes).values([
      { 
        title: "Weekly Supplier Meeting", 
        content: "Meeting with rose supplier scheduled for Friday at 2pm. Need to discuss increased orders for upcoming wedding season.",
        dateTime: new Date()
      },
      { 
        title: "Store Closing Early", 
        content: "The store will be closing at 4pm next Monday for staff training. Ensure all deliveries are scheduled before 3pm.",
        dateTime: new Date()
      }
    ]);
    
    console.log("Database seeded with initial data");
  }
}
