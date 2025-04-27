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
        return res.status(404).json({ message: 'Заказ не найден' });
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
      console.error('Ошибка обновления заказа', error);
      return res.status(500).json({ message: 'Не удалось обновить заказ' });  
    }
  });

  app.delete('/api/orders/:id', async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteOrder(Number(req.params.id));
      
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
      console.error('EОшибка очистки списаний:', error);
      return res.status(500).json({ message: 'Не удалось очистить списания' });
    }
  });
  


  const httpServer = createServer(app);
  return httpServer;
}
