import { sql } from "drizzle-orm";
import { db } from "../db";

export async function addPickupToOrders() {
  try {
    console.log("Running migration: Adding pickup column to orders table");
    
    // Add the pickup column with a default value of false
    await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS pickup BOOLEAN NOT NULL DEFAULT false`.execute(db);
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}
