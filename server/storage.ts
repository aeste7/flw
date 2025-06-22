import { 
  Warehouse, InsertWarehouse,
  Writeoff, InsertWriteoff,
  Note, InsertNote,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  Bouquet, InsertBouquet,
  BouquetItem, InsertBouquetItem,
  User, InsertUser,
  OrderStatus
} from "@shared/schema";
import { db } from "./db";
import { 
  warehouse as warehouseTable,
  writeoffs as writeoffsTable,
  notes as notesTable,
  orders as ordersTable,
  orderItems as orderItemsTable,
  bouquets as bouquetsTable,
  bouquetItems as bouquetItemsTable,
  users as usersTable
} from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Warehouse methods
  getFlowers(): Promise<Warehouse[]>;
  getFlower(id: number): Promise<Warehouse | undefined>;
  getFlowerByName(name: string): Promise<Warehouse | undefined>;
  addFlowers(flower: InsertWarehouse): Promise<Warehouse>;
  updateFlowers(id: number, flower: Partial<InsertWarehouse>): Promise<Warehouse | undefined>;
  deleteFlower(id: number): Promise<boolean>;
  
  // Writeoffs methods
  getWriteoffs(): Promise<Writeoff[]>;
  addWriteoff(writeoff: InsertWriteoff): Promise<Writeoff>;
  clearWriteoffs(): Promise<boolean>;

  // Notes methods
  getNotes(): Promise<Note[]>;
  getNote(id: number): Promise<Note | undefined>;
  addNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<InsertNote>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;

  // Orders methods
  getOrders(): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  updateOrder(id: number, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: number): Promise<boolean>;

  // Order Items methods
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  deleteOrderItem(id: number): Promise<boolean>;

  // Bouquets methods
  getBouquets(): Promise<Bouquet[]>;
  getBouquet(id: number): Promise<Bouquet | undefined>;
  createBouquet(bouquet: InsertBouquet, items: InsertBouquetItem[]): Promise<Bouquet>;
  updateBouquet(id: number, bouquet: Partial<InsertBouquet>): Promise<Bouquet | undefined>;
  deleteBouquet(id: number): Promise<boolean>;
  sellBouquet(id: number): Promise<boolean>;
  disassembleBouquet(id: number): Promise<boolean>;

  // Bouquet Items methods
  getBouquetItems(bouquetId: number): Promise<BouquetItem[]>;
  createBouquetItem(item: InsertBouquetItem): Promise<BouquetItem>;
  deleteBouquetItem(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private warehouse: Map<number, Warehouse>;
  private writeoffs: Map<number, Writeoff>;
  private notes: Map<number, Note>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private bouquets: Map<number, Bouquet>;
  private bouquetItems: Map<number, BouquetItem>;
  private currentUserId: number;
  private currentWarehouseId: number;
  private currentWriteoffId: number;
  private currentNoteId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;
  private currentBouquetId: number;
  private currentBouquetItemId: number;

  constructor() {
    this.users = new Map();
    this.warehouse = new Map();
    this.writeoffs = new Map();
    this.notes = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.bouquets = new Map();
    this.bouquetItems = new Map();
    this.currentUserId = 1;
    this.currentWarehouseId = 1;
    this.currentWriteoffId = 1;
    this.currentNoteId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentBouquetId = 1;
    this.currentBouquetItemId = 1;
    
    // Initialize with some sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Add some sample flowers to warehouse
    /*
    this.addFlowers({ flower: "Роза красная", amount: 24 });
    this.addFlowers({ flower: "Лилия белая", amount: 18 });
    this.addFlowers({ flower: "Пион розовый", amount: 30 });
    his.addFlowers({ flower: "Тюльпан жёлтый", amount: 15 });
    */
    
    // Add some sample notes
    /*
    this.addNote({ 
      title: "Weekly Supplier Meeting", 
      content: "Meeting with rose supplier scheduled for Friday at 2pm. Need to discuss increased orders for upcoming wedding season." 
    });
    this.addNote({ 
      title: "Store Closing Early", 
      content: "The store will be closing at 4pm next Monday for staff training. Ensure all deliveries are scheduled before 3pm." 
    });
    */
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Warehouse methods
  async getFlowers(): Promise<Warehouse[]> {
    return Array.from(this.warehouse.values());
  }

  async getFlower(id: number): Promise<Warehouse | undefined> {
    return this.warehouse.get(id);
  }

  async getFlowerByName(name: string): Promise<Warehouse | undefined> {
    return Array.from(this.warehouse.values()).find(
      (flower) => flower.flower === name,
    );
  }

  async addFlowers(insertFlower: InsertWarehouse): Promise<Warehouse> {
    // Check if flower already exists
    const existingFlower = await this.getFlowerByName(insertFlower.flower);
    
    if (existingFlower) {
      // Update existing flower
      const updatedFlower = {
        ...existingFlower,
        amount: existingFlower.amount + insertFlower.amount,
        dateTime: new Date(),
      };
      this.warehouse.set(existingFlower.id, updatedFlower);
      return updatedFlower;
    } 
    
    // Add new flower
    const id = this.currentWarehouseId++;
    const flower: Warehouse = { 
      ...insertFlower, 
      id, 
      dateTime: new Date() 
    };
    this.warehouse.set(id, flower);
    return flower;
  }

  async updateFlowers(id: number, flowerUpdate: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const flower = this.warehouse.get(id);
    if (!flower) return undefined;

    const updatedFlower = {
      ...flower,
      ...flowerUpdate,
      dateTime: new Date(),
    };
    
    this.warehouse.set(id, updatedFlower);
    return updatedFlower;
  }

  async deleteFlower(id: number): Promise<boolean> {
    return this.warehouse.delete(id);
  }

  // Writeoffs methods
  async getWriteoffs(): Promise<Writeoff[]> {
    return Array.from(this.writeoffs.values());
  }

  async addWriteoff(insertWriteoff: InsertWriteoff): Promise<Writeoff> {
    const id = this.currentWriteoffId++;
    const writeoff: Writeoff = { 
      ...insertWriteoff, 
      id, 
      dateTime: new Date() 
    };
    
    this.writeoffs.set(id, writeoff);
    
    // Update warehouse
    const flower = await this.getFlowerByName(insertWriteoff.flower);
    if (flower) {
      const updatedAmount = Math.max(0, flower.amount - insertWriteoff.amount);
      await this.updateFlowers(flower.id, { amount: updatedAmount });
    }
    
    return writeoff;
  }
  
  // Clear all writeoffs history
  async clearWriteoffs(): Promise<boolean> {
    this.writeoffs = new Map();
    return true;
  }

  // Notes methods
  async getNotes(): Promise<Note[]> {
    return Array.from(this.notes.values());
  }

  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async addNote(insertNote: InsertNote): Promise<Note> {
    const id = this.currentNoteId++;
    const note: Note = { 
      ...insertNote, 
      id, 
      dateTime: new Date() 
    };
    
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;

    const updatedNote = {
      ...note,
      ...noteUpdate,
      dateTime: new Date(),
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Orders methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const id = this.currentOrderId++;
    const order: Order = { 
      ...insertOrder, 
      id,
      status: insertOrder.status || OrderStatus.New,
      notes: insertOrder.notes || null,
      timeFrom: insertOrder.timeFrom || null,
      timeTo: insertOrder.timeTo || null,
      pickup: insertOrder.pickup || false
    };
    
    this.orders.set(id, order);
    
    // Add order items
    for (const item of items) {
      const itemId = this.currentOrderItemId++;
      const orderItem: OrderItem = {
        ...item,
        id: itemId,
        orderId: id
      };
      
      this.orderItems.set(itemId, orderItem);
      
      // Update warehouse inventory
      const flower = await this.getFlowerByName(item.flower);
      if (flower) {
        const updatedAmount = Math.max(0, flower.amount - item.amount);
        await this.updateFlowers(flower.id, { amount: updatedAmount });
      }
    }
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = {
      ...order,
      status,
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;

    const updatedOrder = {
      ...order,
      ...orderUpdate,
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: number): Promise<boolean> {
    const order = this.orders.get(id);
    if (!order) return false;
    
    // Mark as deleted instead of removing
    await this.updateOrderStatus(id, OrderStatus.Deleted);
    return true;
  }

  // Order Items methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(
      (item) => item.orderId === orderId
    );
  }
  
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    const orderItem: OrderItem = {
      ...item,
      id
    };
    
    this.orderItems.set(id, orderItem);
    
    // Update warehouse inventory
    const flower = await this.getFlowerByName(item.flower);
    if (flower) {
      const updatedAmount = Math.max(0, flower.amount - item.amount);
      await this.updateFlowers(flower.id, { amount: updatedAmount });
    }
    
    return orderItem;
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  // Bouquets methods
  async getBouquets(): Promise<Bouquet[]> {
    return Array.from(this.bouquets.values());
  }

  async getBouquet(id: number): Promise<Bouquet | undefined> {
    return this.bouquets.get(id);
  }

  async createBouquet(bouquet: InsertBouquet, items: InsertBouquetItem[]): Promise<Bouquet> {
    const id = this.currentBouquetId++;
    const newBouquet: Bouquet = {
      ...bouquet,
      id,
      dateTime: new Date(),
      photo: bouquet.photo || null
    };
    
    this.bouquets.set(id, newBouquet);
    
    // Create bouquet items and update warehouse
    for (const item of items) {
      const bouquetItem: BouquetItem = {
        ...item,
        bouquetId: id,
        id: this.currentBouquetItemId++
      };
      
      this.bouquetItems.set(bouquetItem.id, bouquetItem);
      
      // Update warehouse inventory
      const flower = await this.getFlowerByName(item.flower);
      if (flower) {
        const updatedAmount = Math.max(0, flower.amount - item.amount);
        await this.updateFlowers(flower.id, { amount: updatedAmount });
      }
    }
    
    return newBouquet;
  }

  async updateBouquet(id: number, bouquetUpdate: Partial<InsertBouquet>): Promise<Bouquet | undefined> {
    const bouquet = this.bouquets.get(id);
    if (!bouquet) return undefined;

    const updatedBouquet = {
      ...bouquet,
      ...bouquetUpdate,
    };
    
    this.bouquets.set(id, updatedBouquet);
    return updatedBouquet;
  }

  async deleteBouquet(id: number): Promise<boolean> {
    const bouquet = this.bouquets.get(id);
    if (!bouquet) return false;
    
    // Delete all bouquet items
    const items = await this.getBouquetItems(id);
    for (const item of items) {
      this.bouquetItems.delete(item.id);
    }
    
    this.bouquets.delete(id);
    return true;
  }

  async sellBouquet(id: number): Promise<boolean> {
    // Simply delete the bouquet (sold)
    return this.deleteBouquet(id);
  }

  async disassembleBouquet(id: number): Promise<boolean> {
    const bouquet = this.bouquets.get(id);
    if (!bouquet) return false;
    
    // Get all bouquet items
    const items = await this.getBouquetItems(id);
    
    // Return flowers to warehouse
    for (const item of items) {
      const flower = await this.getFlowerByName(item.flower);
      if (flower) {
        await this.updateFlowers(flower.id, { 
          amount: flower.amount + item.amount 
        });
      }
    }
    
    // Delete the bouquet
    return this.deleteBouquet(id);
  }

  // Bouquet Items methods
  async getBouquetItems(bouquetId: number): Promise<BouquetItem[]> {
    return Array.from(this.bouquetItems.values()).filter(
      (item) => item.bouquetId === bouquetId
    );
  }

  async createBouquetItem(item: InsertBouquetItem): Promise<BouquetItem> {
    const id = this.currentBouquetItemId++;
    const bouquetItem: BouquetItem = {
      ...item,
      id
    };
    
    this.bouquetItems.set(id, bouquetItem);
    
    // Update warehouse inventory
    const flower = await this.getFlowerByName(item.flower);
    if (flower) {
      const updatedAmount = Math.max(0, flower.amount - item.amount);
      await this.updateFlowers(flower.id, { amount: updatedAmount });
    }
    
    return bouquetItem;
  }

  async deleteBouquetItem(id: number): Promise<boolean> {
    return this.bouquetItems.delete(id);
  }
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(usersTable)
      .values(insertUser)
      .returning();
    return user;
  }

  // Warehouse methods
  async getFlowers(): Promise<Warehouse[]> {
    return await db.select().from(warehouseTable).orderBy(warehouseTable.id);
  }

  async getFlower(id: number): Promise<Warehouse | undefined> {
    const [flower] = await db.select().from(warehouseTable).where(eq(warehouseTable.id, id));
    return flower || undefined;
  }

  async getFlowerByName(name: string): Promise<Warehouse | undefined> {
    const [flower] = await db.select().from(warehouseTable).where(eq(warehouseTable.flower, name));
    return flower || undefined;
  }

  async addFlowers(insertFlower: InsertWarehouse): Promise<Warehouse> {
    // Check if flower already exists
    const existingFlower = await this.getFlowerByName(insertFlower.flower);
    
    if (existingFlower) {
      // Update existing flower
      const [updatedFlower] = await db
        .update(warehouseTable)
        .set({ 
          amount: existingFlower.amount + insertFlower.amount,
          dateTime: new Date()
        })
        .where(eq(warehouseTable.id, existingFlower.id))
        .returning();
      return updatedFlower;
    } 
    
    // Add new flower
    const [flower] = await db
      .insert(warehouseTable)
      .values({ 
        ...insertFlower,
        dateTime: new Date()
      })
      .returning();
    return flower;
  }

  async deleteFlower(id: number): Promise<boolean> {
    const result = await db
      .delete(warehouseTable)
      .where(eq(warehouseTable.id, id))
      .returning({ id: warehouseTable.id });
    
    return result.length > 0;
  }

  async updateFlowers(id: number, flowerUpdate: Partial<InsertWarehouse>): Promise<Warehouse | undefined> {
    const [updatedFlower] = await db
      .update(warehouseTable)
      .set({ 
        ...flowerUpdate,
        dateTime: new Date()
      })
      .where(eq(warehouseTable.id, id))
      .returning();
    
    return updatedFlower || undefined;
  }

  // Writeoffs methods
  async getWriteoffs(): Promise<Writeoff[]> {
    return await db.select().from(writeoffsTable).orderBy(desc(writeoffsTable.dateTime));
  }

  async addWriteoff(insertWriteoff: InsertWriteoff): Promise<Writeoff> {
    const [writeoff] = await db
      .insert(writeoffsTable)
      .values({ 
        ...insertWriteoff,
        dateTime: new Date()
      })
      .returning();
    
    // Update warehouse
    const flower = await this.getFlowerByName(insertWriteoff.flower);
    if (flower) {
      const updatedAmount = Math.max(0, flower.amount - insertWriteoff.amount);
      await this.updateFlowers(flower.id, { amount: updatedAmount });
    }
    
    return writeoff;
  }

  async clearWriteoffs(): Promise<boolean> {
    await db.delete(writeoffsTable);
    return true;
  }
  
  // Notes methods
  async getNotes(): Promise<Note[]> {
    return await db.select().from(notesTable).orderBy(desc(notesTable.dateTime));
  }

  async getNote(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notesTable).where(eq(notesTable.id, id));
    return note || undefined;
  }

  async addNote(insertNote: InsertNote): Promise<Note> {
    const [note] = await db
      .insert(notesTable)
      .values({ 
        ...insertNote,
        dateTime: new Date()
      })
      .returning();
    return note;
  }

  async updateNote(id: number, noteUpdate: Partial<InsertNote>): Promise<Note | undefined> {
    const [updatedNote] = await db
      .update(notesTable)
      .set({ 
        ...noteUpdate,
        dateTime: new Date()
      })
      .where(eq(notesTable.id, id))
      .returning();
    
    return updatedNote || undefined;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db
      .delete(notesTable)
      .where(eq(notesTable.id, id))
      .returning({ id: notesTable.id });
    
    return result.length > 0;
  }

  // Orders methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(ordersTable).orderBy(desc(ordersTable.dateTime));
  }

  async getOrder(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
    return order || undefined;
  }

  async createOrder(insertOrder: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    // Create the order
    const [order] = await db
      .insert(ordersTable)
      .values({
        ...insertOrder, 
        status: insertOrder.status || OrderStatus.New
      })
      .returning();
    
    // Add order items
    for (const item of items) {
      await db
        .insert(orderItemsTable)
        .values({
          ...item,
          orderId: order.id
        });
      
      // Update warehouse inventory
      const flower = await this.getFlowerByName(item.flower);
      if (flower) {
        const updatedAmount = Math.max(0, flower.amount - item.amount);
        await this.updateFlowers(flower.id, { amount: updatedAmount });
      }
    }
    
    return order;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();
    
    return updatedOrder || undefined;
  }

  async updateOrder(id: number, orderUpdate: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(ordersTable)
      .set(orderUpdate)
      .where(eq(ordersTable.id, id))
      .returning();
    
    return updatedOrder || undefined;
  }

  async deleteOrder(id: number): Promise<boolean> {
    // Mark as deleted instead of removing
    const result = await this.updateOrderStatus(id, OrderStatus.Deleted);
    return !!result;
  }

  // Order Items methods
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, orderId));
  }
  
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [orderItem] = await db
      .insert(orderItemsTable)
      .values(item)
      .returning();
    
    // Update warehouse inventory
    const flower = await this.getFlowerByName(item.flower);
    if (flower) {
      const updatedAmount = Math.max(0, flower.amount - item.amount);
      await this.updateFlowers(flower.id, { amount: updatedAmount });
    }
    
    return orderItem;
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    const result = await db
      .delete(orderItemsTable)
      .where(eq(orderItemsTable.id, id))
      .returning({ id: orderItemsTable.id });
    
    return result.length > 0;
  }

  // Bouquets methods
  async getBouquets(): Promise<Bouquet[]> {
    return await db.select().from(bouquetsTable).orderBy(desc(bouquetsTable.dateTime));
  }

  async getBouquet(id: number): Promise<Bouquet | undefined> {
    const [bouquet] = await db.select().from(bouquetsTable).where(eq(bouquetsTable.id, id));
    return bouquet || undefined;
  }

  async createBouquet(bouquet: InsertBouquet, items: InsertBouquetItem[]): Promise<Bouquet> {
    // Create the bouquet
    const [newBouquet] = await db
      .insert(bouquetsTable)
      .values({
        ...bouquet,
        dateTime: new Date(),
        photo: bouquet.photo || null
      })
      .returning();
    
    // Add bouquet items
    for (const item of items) {
      await db
        .insert(bouquetItemsTable)
        .values({
          ...item,
          bouquetId: newBouquet.id
        });
      
      // Update warehouse inventory
      const flower = await this.getFlowerByName(item.flower);
      if (flower) {
        const updatedAmount = Math.max(0, flower.amount - item.amount);
        await this.updateFlowers(flower.id, { amount: updatedAmount });
      }
    }
    
    return newBouquet;
  }

  async updateBouquet(id: number, bouquetUpdate: Partial<InsertBouquet>): Promise<Bouquet | undefined> {
    const [updatedBouquet] = await db
      .update(bouquetsTable)
      .set({ 
        ...bouquetUpdate,
      })
      .where(eq(bouquetsTable.id, id))
      .returning();
    
    return updatedBouquet || undefined;
  }

  async deleteBouquet(id: number): Promise<boolean> {
    // Delete all bouquet items first
    await db
      .delete(bouquetItemsTable)
      .where(eq(bouquetItemsTable.bouquetId, id));
    
    // Delete the bouquet
    const result = await db
      .delete(bouquetsTable)
      .where(eq(bouquetsTable.id, id))
      .returning({ id: bouquetsTable.id });
    
    return result.length > 0;
  }

  async sellBouquet(id: number): Promise<boolean> {
    // Simply delete the bouquet (sold)
    return this.deleteBouquet(id);
  }

  async disassembleBouquet(id: number): Promise<boolean> {
    // Get all bouquet items
    const items = await this.getBouquetItems(id);
    
    // Return flowers to warehouse
    for (const item of items) {
      const flower = await this.getFlowerByName(item.flower);
      if (flower) {
        await this.updateFlowers(flower.id, { 
          amount: flower.amount + item.amount 
        });
      }
    }
    
    // Delete the bouquet
    return this.deleteBouquet(id);
  }

  // Bouquet Items methods
  async getBouquetItems(bouquetId: number): Promise<BouquetItem[]> {
    return await db
      .select()
      .from(bouquetItemsTable)
      .where(eq(bouquetItemsTable.bouquetId, bouquetId));
  }

  async createBouquetItem(item: InsertBouquetItem): Promise<BouquetItem> {
    const [bouquetItem] = await db
      .insert(bouquetItemsTable)
      .values(item)
      .returning();
    
    // Update warehouse inventory
    const flower = await this.getFlowerByName(item.flower);
    if (flower) {
      const updatedAmount = Math.max(0, flower.amount - item.amount);
      await this.updateFlowers(flower.id, { amount: updatedAmount });
    }
    
    return bouquetItem;
  }

  async deleteBouquetItem(id: number): Promise<boolean> {
    const result = await db
      .delete(bouquetItemsTable)
      .where(eq(bouquetItemsTable.id, id))
      .returning({ id: bouquetItemsTable.id });
    
    return result.length > 0;
  }
}

// Use the database storage instead of memory storage
export const storage = new DatabaseStorage();
