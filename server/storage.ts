import { 
  Warehouse, InsertWarehouse,
  Writeoff, InsertWriteoff,
  Note, InsertNote,
  Order, InsertOrder,
  OrderItem, InsertOrderItem,
  User, InsertUser,
  OrderStatus
} from "@shared/schema";

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
  
  // Writeoffs methods
  getWriteoffs(): Promise<Writeoff[]>;
  addWriteoff(writeoff: InsertWriteoff): Promise<Writeoff>;

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private warehouse: Map<number, Warehouse>;
  private writeoffs: Map<number, Writeoff>;
  private notes: Map<number, Note>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem>;
  private currentUserId: number;
  private currentWarehouseId: number;
  private currentWriteoffId: number;
  private currentNoteId: number;
  private currentOrderId: number;
  private currentOrderItemId: number;

  constructor() {
    this.users = new Map();
    this.warehouse = new Map();
    this.writeoffs = new Map();
    this.notes = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentUserId = 1;
    this.currentWarehouseId = 1;
    this.currentWriteoffId = 1;
    this.currentNoteId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    
    // Initialize with some sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Add some sample flowers to warehouse
    this.addFlowers({ flower: "Red Roses", amount: 24 });
    this.addFlowers({ flower: "White Lilies", amount: 18 });
    this.addFlowers({ flower: "Pink Carnations", amount: 30 });
    this.addFlowers({ flower: "Yellow Tulips", amount: 15 });
    
    // Add some sample notes
    this.addNote({ 
      title: "Weekly Supplier Meeting", 
      content: "Meeting with rose supplier scheduled for Friday at 2pm. Need to discuss increased orders for upcoming wedding season." 
    });
    this.addNote({ 
      title: "Store Closing Early", 
      content: "The store will be closing at 4pm next Monday for staff training. Ensure all deliveries are scheduled before 3pm." 
    });
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
      id 
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
}

export const storage = new MemStorage();
