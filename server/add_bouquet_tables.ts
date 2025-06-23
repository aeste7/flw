import { sql } from "drizzle-orm";
import { db } from "./db";

export async function addBouquetTables() {
  try {
    console.log("Running migration: Adding bouquet tables");
    
    // Create bouquets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bouquets (
        id SERIAL PRIMARY KEY,
        description TEXT NOT NULL,
        date_time TIMESTAMP NOT NULL DEFAULT NOW(),
        photo TEXT
      )
    `);
    
    // Create bouquet_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bouquet_items (
        id SERIAL PRIMARY KEY,
        bouquet_id INTEGER NOT NULL,
        flower TEXT NOT NULL,
        amount INTEGER NOT NULL
      )
    `);
    
    // Add showcase column to orders table
    await db.execute(sql`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS showcase BOOLEAN NOT NULL DEFAULT false
    `);
    
    console.log("Bouquet tables migration completed successfully");
  } catch (error) {
    console.error("Bouquet tables migration failed:", error);
    throw error;
  }
} 