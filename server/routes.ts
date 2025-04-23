import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertNoteSchema, 
  insertOrderSchema, 
  insertOrderItemSchema,
  insertWarehouseSchema,
  insertWriteoffSchema,
  OrderStatus
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Warehouse routes
  app.get('/api/flowers', async (req: Request, res: Response) => {
    try {
      const flowers = await storage.getFlowers();
      return res.json(flowers);
    } catch (error) {
      console.error('Error fetching flowers:', error);
      return res.status(500).json({ message: 'Failed to fetch flowers' });
    }
  });

  app.get('/api/flowers/:id', async (req: Request, res: Response) => {
    try {
      const flower = await storage.getFlower(Number(req.params.id));
      if (!flower) {
        return res.status(404).json({ message: 'Flower not found' });
      }
      return res.json(flower);
    } catch (error) {
      console.error('Error fetching flower:', error);
      return res.status(500).json({ message: 'Failed to fetch flower' });
    }
  });

  app.post('/api/flowers', async (req: Request, res: Response) => {
    try {
      const validatedData = insertWarehouseSchema.parse(req.body);
      const flower = await storage.addFlowers(validatedData);
      return res.status(201).json(flower);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error adding flowers:', error);
      return res.status(500).json({ message: 'Failed to add flowers' });
    }
  });

  app.put('/api/flowers/:id', async (req: Request, res: Response) => {
    try {
      const validatedData = insertWarehouseSchema.partial().parse(req.body);
      const updatedFlower = await storage.updateFlowers(Number(req.params.id), validatedData);
      if (!updatedFlower) {
        return res.status(404).json({ message: 'Flower not found' });
      }
      return res.json(updatedFlower);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating flower:', error);
      return res.status(500).json({ message: 'Failed to update flower' });
    }
  });

  // Writeoffs routes
  app.get('/api/writeoffs', async (req: Request, res: Response) => {
    try {
      const writeoffs = await storage.getWriteoffs();
      return res.json(writeoffs);
    } catch (error) {
      console.error('Error fetching writeoffs:', error);
      return res.status(500).json({ message: 'Failed to fetch writeoffs' });
    }
  });

  app.post('/api/writeoffs', async (req: Request, res: Response) => {
    try {
      const validatedData = insertWriteoffSchema.parse(req.body);
      const writeoff = await storage.addWriteoff(validatedData);
      return res.status(201).json(writeoff);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error adding writeoff:', error);
      return res.status(500).json({ message: 'Failed to add writeoff' });
    }
  });

  // Notes routes
  app.get('/api/notes', async (req: Request, res: Response) => {
    try {
      const notes = await storage.getNotes();
      return res.json(notes);
    } catch (error) {
      console.error('Error fetching notes:', error);
      return res.status(500).json({ message: 'Failed to fetch notes' });
    }
  });

  app.get('/api/notes/:id', async (req: Request, res: Response) => {
    try {
      const note = await storage.getNote(Number(req.params.id));
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      return res.json(note);
    } catch (error) {
      console.error('Error fetching note:', error);
      return res.status(500).json({ message: 'Failed to fetch note' });
    }
  });

  app.post('/api/notes', async (req: Request, res: Response) => {
    try {
      const validatedData = insertNoteSchema.parse(req.body);
      const note = await storage.addNote(validatedData);
      return res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error adding note:', error);
      return res.status(500).json({ message: 'Failed to add note' });
    }
  });

  app.put('/api/notes/:id', async (req: Request, res: Response) => {
    try {
      const validatedData = insertNoteSchema.partial().parse(req.body);
      const updatedNote = await storage.updateNote(Number(req.params.id), validatedData);
      if (!updatedNote) {
        return res.status(404).json({ message: 'Note not found' });
      }
      return res.json(updatedNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating note:', error);
      return res.status(500).json({ message: 'Failed to update note' });
    }
  });

  app.delete('/api/notes/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteNote(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Note not found' });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({ message: 'Failed to delete note' });
    }
  });

  // Orders routes
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      return res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      return res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      return res.status(500).json({ message: 'Failed to fetch order' });
    }
  });

  app.get('/api/orders/:id/items', async (req: Request, res: Response) => {
    try {
      const items = await storage.getOrderItems(Number(req.params.id));
      return res.json(items);
    } catch (error) {
      console.error('Error fetching order items:', error);
      return res.status(500).json({ message: 'Failed to fetch order items' });
    }
  });

  const createOrderSchema = z.object({
    order: insertOrderSchema.extend({
      dateTime: z.string().transform(val => new Date(val)),
    }),
    items: z.array(insertOrderItemSchema.omit({ orderId: true })),
  });

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const validatedData = createOrderSchema.parse(req.body);
      const order = await storage.createOrder(
        validatedData.order, 
        validatedData.items.map(item => ({ ...item, orderId: 0 }))
      );
      return res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error creating order:', error);
      return res.status(500).json({ message: 'Failed to create order' });
    }
  });

  app.put('/api/orders/:id/status', async (req: Request, res: Response) => {
    try {
      const statusSchema = z.object({
        status: z.enum([
          OrderStatus.New,
          OrderStatus.Assembled,
          OrderStatus.Sent,
          OrderStatus.Finished,
          OrderStatus.Deleted
        ])
      });
      
      const { status } = statusSchema.parse(req.body);
      const updatedOrder = await storage.updateOrderStatus(Number(req.params.id), status);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      return res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating order status:', error);
      return res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  app.put('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const updateOrderSchema = z.object({
        order: insertOrderSchema.partial().extend({
          dateTime: z.string().transform(val => new Date(val)).optional(),
        }),
        items: z.array(z.object({
          flower: z.string(),
          amount: z.number().min(1)
        })).optional()
      });
      
      const { order: validatedOrder, items } = updateOrderSchema.parse(req.body);
      const updatedOrder = await storage.updateOrder(Number(req.params.id), validatedOrder);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Update the items if provided
      if (items && items.length > 0) {
        // First delete existing items
        const orderId = Number(req.params.id);
        const currentItems = await storage.getOrderItems(orderId);
        for (const item of currentItems) {
          await storage.deleteOrderItem(item.id);
        }
        
        // Then add new items
        for (const item of items) {
          await storage.createOrderItem({
            orderId,
            flower: item.flower,
            amount: item.amount
          });
        }
      }
      
      return res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Error updating order:', error);
      return res.status(500).json({ message: 'Failed to update order' });
    }
  });

  app.delete('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteOrder(Number(req.params.id));
      
      if (!success) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting order:', error);
      return res.status(500).json({ message: 'Failed to delete order' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
