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
      console.error('Ошибка при получении списка  цветов:', error);
      return res.status(500).json({ message: 'Не удалось получить список цветов' });
    }
  });

  app.get('/api/flowers/:id', async (req: Request, res: Response) => {
    try {
      const flower = await storage.getFlower(Number(req.params.id));
      if (!flower) {
        return res.status(404).json({ message: 'Цветы не найдены' });
      }
      return res.json(flower);
    } catch (error) {
      console.error('Ошибка при получении цветка:', error);
      return res.status(500).json({ message: 'Не удалось получить данные по цветам' });
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
      console.error('Ошибка при добавлении цветов:', error);
      return res.status(500).json({ message: 'Не удалось добавить цветы' });
    }
  });

  app.put('/api/flowers/:id', async (req: Request, res: Response) => {
    try {
      const validatedData = insertWarehouseSchema.partial().parse(req.body);
      const updatedFlower = await storage.updateFlowers(Number(req.params.id), validatedData);
      if (!updatedFlower) {
        return res.status(404).json({ message: 'Цветы не найдены' });
      }
      return res.json(updatedFlower);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Ошибка обновления цветов:', error);
      return res.status(500).json({ message: 'Не удалось обновить цветы' });
    }
  });

  // Writeoffs routes
  app.get('/api/writeoffs', async (req: Request, res: Response) => {
    try {
      const writeoffs = await storage.getWriteoffs();
      return res.json(writeoffs);
    } catch (error) {
      console.error('Ошибка при получении списока списаний', error);
      return res.status(500).json({ message: 'Не удалось получить список списаний' });
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
      console.error('Ошибка при списании:', error);
      return res.status(500).json({ message: 'Не удалось произвести списание' });
    }
  });

  // Notes routes
  app.get('/api/notes', async (req: Request, res: Response) => {
    try {
      const notes = await storage.getNotes();
      return res.json(notes);
    } catch (error) {
      console.error('Ошибка при получении списока заметок', error);
      return res.status(500).json({ message: 'Не удалось получить список заметок' });
    }
  });

  app.get('/api/notes/:id', async (req: Request, res: Response) => {
    try {
      const note = await storage.getNote(Number(req.params.id));
      if (!note) {
        return res.status(404).json({ message: 'Заметка не найдена' });
      }
      return res.json(note);
    } catch (error) {
      console.error('Ошибка при получении заметки', error);
      return res.status(500).json({ message: 'Не удалось получить данные по заметке' });
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
      console.error('Ошибка при добавлении заметки', error);
      return res.status(500).json({ message: 'Не удалось добавить заметку' });
    }
  });

  app.put('/api/notes/:id', async (req: Request, res: Response) => {
    try {
      const validatedData = insertNoteSchema.partial().parse(req.body);
      const updatedNote = await storage.updateNote(Number(req.params.id), validatedData);
      if (!updatedNote) {
        return res.status(404).json({ message: 'Заметка не найдена' });
      }
      return res.json(updatedNote);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Ошибка при обновлении заметки', error);
      return res.status(500).json({ message: 'Не удалось обновить заметку' });
    }
  });

  app.delete('/api/notes/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteNote(Number(req.params.id));
      if (!success) {
        return res.status(404).json({ message: 'Заметка не найдена' });
      }
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting note:', error);
      return res.status(500).json({ message: 'Не удалось удалить заметку' });
    }
  });

  // Orders routes
  app.get('/api/orders', async (req: Request, res: Response) => {
    try {
      const orders = await storage.getOrders();
      return res.json(orders);
    } catch (error) {
      console.error('Ошибка при получении списка заказов', error);
      return res.status(500).json({ message: 'Не удалось получить список заказов' });
    }
  });

  app.get('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const order = await storage.getOrder(Number(req.params.id));
      if (!order) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }
      return res.json(order);
    } catch (error) {
      console.error('Ошибка при получении заказа', error);
      return res.status(500).json({ message: 'Не удалось получить заказ' });
    }
  });

  app.get('/api/orders/:id/items', async (req: Request, res: Response) => {
    try {
      const items = await storage.getOrderItems(Number(req.params.id));
      return res.json(items);
    } catch (error) {
      console.error('Ошибка при получении данных заказа:', error);
      return res.status(500).json({ message: 'Не удалось получить данные заказа' });
    }
  });

  const createOrderSchema = z.object({
    order: insertOrderSchema.extend({
      dateTime: z.string().transform(val => new Date(val)),
      pickup: z.boolean().default(false),
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
      console.error('Ошибка создания заказа', error);
      return res.status(500).json({ message: 'Не удалось создать заказ' });
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
        return res.status(404).json({ message: 'Заказ не найден' });
      }
      
      return res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error('Ошибка обновления статуса заказа', error);
      return res.status(500).json({ message: 'Не удалось обновить статус заказа' });
    }
  });

  app.put('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      console.log("=== START ORDER UPDATE ===");
      const orderId = Number(req.params.id);
      console.log(`Updating order ID: ${orderId}`);
      
      const validatedData = insertOrderSchema.partial().extend({
        dateTime: z.string().transform(val => new Date(val)).optional(),
      }).parse(req.body.order);
      
      console.log("Validated order data:", validatedData);
      
      const newItems = req.body.items || [];
      console.log("New items from request:", newItems);
      
      // First, get the current order items
      const currentItems = await storage.getOrderItems(orderId);
      console.log("Current items in order:", currentItems);
      
      // Update the order details
      const updatedOrder = await storage.updateOrder(orderId, validatedData);
      if (!updatedOrder) {
        console.log("Order not found");
        return res.status(404).json({ message: 'Заказ не найден' });
      }
      
      // Log the current inventory state
      const beforeInventory = await storage.getFlowers();
      console.log("Inventory BEFORE adjustments:", beforeInventory);
      
      console.log("=== PROCESSING INVENTORY ADJUSTMENTS ===");
      
      // STEP 1: Return all current items to inventory
      for (const item of currentItems) {
        console.log(`Returning ${item.amount} of ${item.flower} to inventory`);
        
        const flower = await storage.getFlowerByName(item.flower);
        if (flower) {
          const updatedAmount = flower.amount + item.amount;
          console.log(`Updating inventory for ${item.flower}. New amount: ${updatedAmount}`);
          await storage.updateFlowers(flower.id, { amount: updatedAmount });
        } else {
          console.log(`Flower ${item.flower} not found in inventory, creating new entry with amount ${item.amount}`);
          await storage.addFlowers({ flower: item.flower, amount: item.amount });
        }
        
        // Delete the order item
        console.log(`Deleting order item ID: ${item.id}`);
        await storage.deleteOrderItem(item.id);
      }
      
      // STEP 2: Take all new items from inventory and create new order items
      for (const item of newItems) {
        if (item.amount > 0) {
          console.log(`Processing new item: ${item.flower}, amount: ${item.amount}`);
          
          // Take from inventory
          const flower = await storage.getFlowerByName(item.flower);
          if (flower) {
            if (flower.amount >= item.amount) {
              const updatedAmount = flower.amount - item.amount;
              console.log(`Taking ${item.amount} of ${item.flower} from inventory. New amount: ${updatedAmount}`);
              await storage.updateFlowers(flower.id, { amount: updatedAmount });
              
              // Create the new order item
              console.log(`Creating new order item: ${item.flower}, amount: ${item.amount}`);
              
              // IMPORTANT: We need to use a direct database operation to avoid automatic inventory adjustments
              // Since we don't have access to modify the storage implementation, we'll use a workaround
              
              // First, add the amount back to inventory to compensate for the automatic deduction
              await storage.updateFlowers(flower.id, { amount: updatedAmount + item.amount });
              console.log(`Compensated inventory for ${item.flower}. Temporary amount: ${updatedAmount + item.amount}`);
              
              // Then create the order item (which will automatically deduct from inventory)
              await storage.createOrderItem({
                orderId,
                flower: item.flower,
                amount: item.amount
              });
            } else {
              console.log(`Not enough ${item.flower} in inventory. Required: ${item.amount}, Available: ${flower.amount}`);
              
              // Rollback all inventory changes
              console.log("Rolling back inventory changes...");
              
              // Return all items to inventory
              for (const newItem of newItems) {
                const newFlower = await storage.getFlowerByName(newItem.flower);
                if (newFlower) {
                  await storage.updateFlowers(newFlower.id, { 
                    amount: newFlower.amount + newItem.amount 
                  });
                }
              }
              
              return res.status(400).json({ 
                message: `Недостаточно цветов: ${item.flower}` 
              });
            }
          } else {
            console.log(`Flower ${item.flower} not found in inventory`);
            return res.status(400).json({ 
              message: `Цветы не найдены: ${item.flower}` 
            });
          }
        }
      }
      
      // Log the final inventory state
      const afterInventory = await storage.getFlowers();
      console.log("Inventory AFTER adjustments:", afterInventory);
      
      // Get the updated order with items
      const updatedOrderWithItems = await storage.getOrder(orderId);
      console.log("Updated order:", updatedOrderWithItems);
      
      console.log("=== END ORDER UPDATE ===");
      return res.json(updatedOrderWithItems);
    } catch (error) {
      console.error('Ошибка обновления заказа', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      return res.status(500).json({ message: 'Не удалось обновить заказ' });  
    }
  });
    
  

  app.delete('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const orderId = Number(req.params.id);
      
      // Get the order items before deleting the order
      const orderItems = await storage.getOrderItems(orderId);
      
      // Return flowers to inventory
      for (const item of orderItems) {
        const flower = await storage.getFlowerByName(item.flower);
        if (flower) {
          // Return flowers to inventory
          await storage.updateFlowers(flower.id, { 
            amount: flower.amount + item.amount 
          });
        } else {
          // Flower doesn't exist in inventory, create it
          await storage.addFlowers({ 
            flower: item.flower, 
            amount: item.amount 
          });
        }
      }
      
      // Now delete the order
      const success = await storage.deleteOrder(orderId);
      
      if (!success) {
        return res.status(404).json({ message: 'Заказ не найден' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Ошибка удаления заказа', error);
      return res.status(500).json({ message: 'Не удалось удалить заказ' });
    }
  });
  

  // Add a new endpoint to delete all writeoffs
  app.delete('/api/writeoffs', async (req: Request, res: Response) => {
    try {
      console.log("Очистка списаний...");
      const success = await storage.clearWriteoffs();
      console.log("Списания очищены:", success);
      return res.json({ success });
    } catch (error) {
      console.error('Ошибка очистки списаний:', error);
      return res.status(500).json({ message: 'Не удалось очистить списания' });
    }
  });

  app.delete('/api/flowers/:id', async (req: Request, res: Response) => {
    try {
      console.log("Deleting flower with ID:", req.params.id);
      
      const success = await storage.deleteFlower(Number(req.params.id));
      
      console.log("Delete result:", success);
      
      if (!success) {
        return res.status(404).json({ message: 'Цветы не найдены' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Ошибка при удалении цветов:', error);
      return res.status(500).json({ message: 'Не удалось удалить цветы' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
