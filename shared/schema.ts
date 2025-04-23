import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for order status
export const OrderStatus = {
  New: "New",
  Assembled: "Assembled",
  Sent: "Sent",
  Finished: "Finished",
  Deleted: "Deleted",
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
  notes: text("notes"),
  status: text("status").notNull().default(OrderStatus.New),
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
