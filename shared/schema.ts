import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for order status
export const OrderStatus = {
  New: "Новый",
  Assembled: "Собран",
  Sent: "В доставке",
  Finished: "Доставлен",
  Deleted: "Удалён",
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];

// Warehouse Table
export const warehouse = pgTable("warehouse", {
  id: serial("id").primaryKey(),
  flower: text("flower").notNull(),
  amount: integer("amount").notNull(),
  dateTime: timestamp("date_time").notNull().defaultNow(),
});

export const insertWarehouseSchema = createInsertSchema(warehouse).omit({
  id: true,
  dateTime: true,
});

export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type Warehouse = typeof warehouse.$inferSelect;

// Writeoffs Table
export const writeoffs = pgTable("writeoffs", {
  id: serial("id").primaryKey(),
  flower: text("flower").notNull(),
  amount: integer("amount").notNull(),
  dateTime: timestamp("date_time").notNull().defaultNow(),
});

export const insertWriteoffSchema = createInsertSchema(writeoffs).omit({
  id: true,
  dateTime: true,
});

export type InsertWriteoff = z.infer<typeof insertWriteoffSchema>;
export type Writeoff = typeof writeoffs.$inferSelect;

// Notes Table
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  dateTime: timestamp("date_time").notNull().defaultNow(),
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  dateTime: true,
});

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

// Orders Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  address: text("address").notNull(),
  dateTime: timestamp("date_time").notNull(),
  timeFrom: text("time_from"), // Start time of delivery period
  timeTo: text("time_to"),     // End time of delivery period
  notes: text("notes"),
  status: text("status").notNull().default(OrderStatus.New),
  pickup: boolean("pickup").default(false).notNull(),
  showcase: boolean("showcase").default(false).notNull(),
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
});

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order Items (flowers in an order)
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  flower: text("flower").notNull(),
  amount: integer("amount").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// Bouquets Table
export const bouquets = pgTable("bouquets", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  dateTime: timestamp("date_time").notNull().defaultNow(),
  photo: text("photo"), // Base64 encoded photo data
});

export const insertBouquetSchema = createInsertSchema(bouquets).omit({
  id: true,
  dateTime: true,
});

export type InsertBouquet = z.infer<typeof insertBouquetSchema>;
export type Bouquet = typeof bouquets.$inferSelect;

// Bouquet Items (flowers in a bouquet)
export const bouquetItems = pgTable("bouquet_items", {
  id: serial("id").primaryKey(),
  bouquetId: integer("bouquet_id").notNull(),
  flower: text("flower").notNull(),
  amount: integer("amount").notNull(),
});

export const insertBouquetItemSchema = createInsertSchema(bouquetItems).omit({
  id: true,
});

export type InsertBouquetItem = z.infer<typeof insertBouquetItemSchema>;
export type BouquetItem = typeof bouquetItems.$inferSelect;

// Users table for completeness
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
