import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use standard pg Pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

export const db = drizzle(pool, { schema });

// Seed the database with initial data
export async function seedDatabase() {
  try {
    // Check if the database already has data
    const flowers = await db.select().from(schema.warehouse);
    if (flowers.length === 0) {
      // Add some sample flowers to warehouse
      await db.insert(schema.warehouse).values([
        { flower: "Лилия белая", amount: 30, dateTime: new Date() },
        { flower: "Пион розовый", amount: 24, dateTime: new Date() },
        { flower: "Роза красная", amount: 18, dateTime: new Date() },
        { flower: "Тюльпан жёлтый", amount: 15, dateTime: new Date() },
      ]);
      
      // Add some sample notes
      await db.insert(schema.notes).values([
        { 
          title: "Забрать крафтовую бумагу", 
          content: "Забрать 500 листов крафтовой бумаги до конца недели.",
          dateTime: new Date()
        },
        { 
          title: "Заказать декоративную ленту", 
          content: "Выбрать цвет и длину ленты. Заказать в ближайшем магазине.",
          dateTime: new Date()
        }
      ]);
      
      // Add a sample pickup order
      const pickupOrder = await db.insert(schema.orders).values({
        from: "Магазин",
        to: "Иван Петров",
        address: "ул. Цветочная, 15",
        dateTime: new Date(Date.now() + 86400000), // Tomorrow
        notes: "Клиент заберет заказ сам",
        status: schema.OrderStatus.New,
        pickup: true
      }).returning();
      
      if (pickupOrder.length > 0) {
        // Add some flowers to the pickup order
        await db.insert(schema.orderItems).values([
          { orderId: pickupOrder[0].id, flower: "Роза красная", amount: 5 },
          { orderId: pickupOrder[0].id, flower: "Лилия белая", amount: 3 }
        ]);
      }

      
      console.log("Database seeded with initial data");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
