import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, OrderItem as OrderItemType, Warehouse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FlowerSelector from "@/components/FlowerSelector";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export default function EditOrder() {
  // Router and navigation
  const [, params] = useRoute("/edit-order/:id");
  const [, navigate] = useLocation();
  const orderId = params?.id ? parseInt(params.id) : null;
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const timeFromRef = useRef<HTMLInputElement>(null);
  const timeToRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());
  const [initialFlowerSelection, setInitialFlowerSelection] = useState<Map<number, number>>(new Map());
  const [projectedInventory, setProjectedInventory] = useState<Map<number, number>>(new Map());
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    address: '',
    dateTime: '',
    timeFrom: '',
    timeTo: '',
    notes: '',
    pickup: false,
  });
  
  // Queries
  const { 
    data: order, 
    isLoading: isOrderLoading 
  } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      return response instanceof Response ? await response.json() : response;
    },
    enabled: !!orderId,
  });
  
  const { 
    data: orderItems = []
  } = useQuery<OrderItemType[]>({
    queryKey: ['/api/orders', orderId, 'items'],
    queryFn: async () => {
      if (!orderId) return [];
      const response = await apiRequest('GET', `/api/orders/${orderId}/items`);
      return response instanceof Response ? await response.json() : response;
    },
    enabled: !!orderId,
  });
  
  const { 
    data: flowers = [], 
    isLoading: isFlowersLoading 
  } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/flowers');
      return response instanceof Response ? await response.json() : response;
    },
  });
  
  // Set form data when order data is loaded
  useEffect(() => {
    if (!order) return;
    
    try {
      const dateObj = new Date(order.dateTime);
      
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        
        setFormData({
          from: order.from || '',
          to: order.to || '',
          address: order.address || '',
          dateTime: localDateStr,
          timeFrom: order.timeFrom || '',
          timeTo: order.timeTo || '',
          notes: order.notes || '',
          pickup: order.pickup || false,
        });
      } else {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const localDateStr = `${year}-${month}-${day}`;
        
        setFormData({
          from: order.from || '',
          to: order.to || '',
          address: order.address || '',
          dateTime: localDateStr,
          timeFrom: order.timeFrom || '',
          timeTo: order.timeTo || '',
          notes: order.notes || '',
          pickup: order.pickup || false,
        });
        
        toast({
          title: "Внимание",
          description: "Ошибка поля дата. Было установлено текущее время",
          variant: "destructive",
        });
      }
    } catch (error) {
      const now = new Date();
      const localDateStr = now.toISOString().split('T')[0];
      
      setFormData({
        from: order.from || '',
        to: order.to || '',
        address: order.address || '',
        dateTime: localDateStr,
        timeFrom: order.timeFrom || '',
        timeTo: order.timeTo || '',
        notes: order.notes || '',
        pickup: order.pickup || false,
      });
    }
  }, [order, toast]);
  
  // Set selected flowers when order items and flowers are loaded
  useEffect(() => {
    if (!Array.isArray(orderItems) || orderItems.length === 0 || 
        !Array.isArray(flowers) || flowers.length === 0) {
      return;
    }
    
    const newSelectedFlowers = new Map<number, number>();
    
    orderItems.forEach(item => {
      const flower = flowers.find(f => f.flower === item.flower);
      if (flower) {
        newSelectedFlowers.set(flower.id, item.amount);
      }
    });
    
    setSelectedFlowers(newSelectedFlowers);
    setInitialFlowerSelection(new Map(newSelectedFlowers));
  }, [orderItems, flowers]);
  
  // Calculate projected inventory
  useEffect(() => {
    if (!orderItems || !flowers || !Array.isArray(flowers)) return;
    
    // Create maps for lookup
    const originalFlowerQuantities = new Map<string, number>();
    orderItems.forEach(item => {
      originalFlowerQuantities.set(item.flower, item.amount);
    });

    const flowerIdToName = new Map<number, string>();
    const flowerNameToId = new Map<string, number>();
    flowers.forEach(flower => {
      flowerIdToName.set(flower.id, flower.flower);
      flowerNameToId.set(flower.flower, flower.id);
    });

    // Calculate projected inventory
    const newProjectedInventory = new Map<number, number>();
    
    // Start with current inventory
    flowers.forEach(flower => {
      newProjectedInventory.set(flower.id, flower.amount);
    });

    // Return original quantities to inventory (add back)
    originalFlowerQuantities.forEach((amount, flowerName) => {
      const flowerId = flowerNameToId.get(flowerName);
      if (flowerId !== undefined) {
        const currentAmount = newProjectedInventory.get(flowerId) || 0;
        newProjectedInventory.set(flowerId, currentAmount + amount);
      }
    });

    // Subtract new quantities from inventory
    selectedFlowers.forEach((amount, flowerId) => {
      const currentAmount = newProjectedInventory.get(flowerId) || 0;
      newProjectedInventory.set(flowerId, currentAmount - amount);
    });

    setProjectedInventory(newProjectedInventory);
  }, [selectedFlowers, orderItems, flowers]);
  
  // Handle time input formatting
  useEffect(() => {
    const setupTimeInput = (inputElement: HTMLInputElement | null) => {
      if (!inputElement) return;
      
      inputElement.classList.add('time-input');
      
      const handleTimeInput = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const cursorPosition = input.selectionStart || 0;
        let value = input.value.replace(/[^0-9:]/g, "");
        
        if (value.includes(':')) {
          const [hours, minutes] = value.split(':');
          let formattedHours = hours;
          if (parseInt(hours) > 23) formattedHours = '23';
          
          let formattedMinutes = minutes;
          if (minutes.length > 0 && parseInt(minutes) > 59) formattedMinutes = '59';
          
          input.value = `${formattedHours}:${formattedMinutes}`;
          
          const newPosition = cursorPosition + (input.value.length - value.length);
          input.setSelectionRange(newPosition, newPosition);
          return;
        }
        
        if (value.length >= 2) {
          let hours = value.substring(0, 2);
          if (parseInt(hours) > 23) hours = '23';
          
          if (value.length === 2) {
            input.value = `${hours}:`;
          } else {
            let minutes = value.substring(2);
            if (minutes.length > 0 && parseInt(minutes) > 59) minutes = '59';
            input.value = `${hours}:${minutes}`;
          }
          
          const newPosition = cursorPosition + (input.value.length - value.length);
          input.setSelectionRange(newPosition, newPosition);
        } else {
          input.value = value;
        }
      };
      
      const handleBlur = (e: Event) => {
        const input = e.target as HTMLInputElement;
        let value = input.value.trim();
        
        if (!value) return;
        
        if (value.endsWith(':')) {
          value = value.slice(0, -1) + ":00";
        }
        
        if (!value.includes(':') && value.length <= 2) {
          value = value.padStart(2, '0') + ":00";
        }
        
        if (value.includes(':')) {
          const [hours, minutes] = value.split(':');
          const formattedHours = hours.padStart(2, '0');
          const formattedMinutes = (minutes || '00').padStart(2, '0');
          value = `${formattedHours}:${formattedMinutes}`;
        }
        
        input.value = value;
        
        const name = input.name;
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      };
      
      inputElement.addEventListener("input", handleTimeInput);
      inputElement.addEventListener("blur", handleBlur);
      
      return () => {
        inputElement.removeEventListener("input", handleTimeInput);
        inputElement.removeEventListener("blur", handleBlur);
      };
    };
    
    const cleanupTimeFrom = setupTimeInput(timeFromRef.current);
    const cleanupTimeTo = setupTimeInput(timeToRef.current);
    
    return () => {
      if (cleanupTimeFrom) cleanupTimeFrom();
      if (cleanupTimeTo) cleanupTimeTo();
    };
  }, []);
  
  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: {
      order: Partial<Order>;
      items: { flower: string; amount: number }[];
    }) => {
      if (!orderId) throw new Error("Order ID is required");
      
      // Send the update to the server - the server will handle inventory adjustments
      const orderResponse = await apiRequest('PUT', `/api/orders/${orderId}`, data);
      return orderResponse;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      await queryClient.refetchQueries({ queryKey: ['/api/flowers'] });
      
      toast({
        title: "Обновление заказа",
        description: "Заказ был успешно обновлён",
      });
      
      setTimeout(() => {
        navigate("/active-orders");
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
    }
  });

  
  // Event handlers
  const handleSelectFlower = (flowerId: number, amount: number) => {
    const newSelectedFlowers = new Map(selectedFlowers);
    
    if (amount === 0) {
      newSelectedFlowers.delete(flowerId);
    } else {
      newSelectedFlowers.set(flowerId, amount);
    }
    
    setSelectedFlowers(newSelectedFlowers);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      pickup: checked,
    });
  };
  
  const handleCancel = () => {
    navigate("/active-orders");
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId) return;
    
    // Check if any projected inventory is negative
    let hasNegativeInventory = false;
    projectedInventory.forEach((amount, flowerId) => {
      if (amount < 0) {
        hasNegativeInventory = true;
        const flower = Array.isArray(flowers) 
          ? flowers.find(f => f.id === flowerId) 
          : undefined;
        
        toast({
          title: "Ошибка",
          description: `Недостаточно цветов: ${flower?.flower}`,
          variant: "destructive",
        });
      }
    });
    
    if (hasNegativeInventory) return;
    
    // Parse date
    const dateTime = new Date(formData.dateTime);
    
    // Prepare updated order items
    const items = Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
      const flower = Array.isArray(flowers) 
        ? flowers.find(f => f.id === flowerId) 
        : undefined;
      
      return {
        flower: flower?.flower || "",
        amount,
      };
    });
    
    // Check if any flowers are selected
    if (items.length === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите хотя бы один цветок",
        variant: "destructive",
      });
      return;
    }
    
    // Submit the order update - the server will handle the differential update
    updateOrderMutation.mutate({
      order: {
        from: formData.from,
        to: formData.pickup ? "Самовывоз" : formData.to,
        address: formData.pickup ? "Магазин" : formData.address,
        dateTime: dateTime.toISOString(),
        timeFrom: formData.timeFrom,
        timeTo: formData.timeTo,
        notes: formData.notes || null,
        pickup: formData.pickup,
      },
      items,
    });
  };
  
  // Loading state
  if (isOrderLoading || !order) {
    return (
      <div className="max-w-3xl mx-auto p-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }
  
  // Render
  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="mb-2 pl-0 flex items-center text-gray-500 hover:text-gray-700"
          onClick={handleCancel}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Вернуться к заказам
        </Button>
        <h1 className="text-2xl font-bold">Редактировать заказ №{orderId}</h1>
        <p className="text-gray-500">Обновить данные выбранного заказа</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="from">Отправитель</Label>
            <Input
              id="from"
              name="from"
              value={formData.from}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="to">Получатель</Label>
            <Input
              id="to"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              disabled={formData.pickup}
              required={!formData.pickup}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Адрес</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            disabled={formData.pickup}
            required={!formData.pickup}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateTime">Дата доставки</Label>
          <Input
            id="dateTime"
            name="dateTime"
            type="date"
            value={formData.dateTime}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeFrom">Время с</Label>
            <Input
              id="timeFrom"
              name="timeFrom"
              type="text"
              value={formData.timeFrom}
              onChange={handleInputChange}
              ref={timeFromRef}
              className="time-input"
              placeholder="чч:мм"
              maxLength={5}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="timeTo">Время до</Label>
            <Input
              id="timeTo"
              name="timeTo"
              type="text"
              value={formData.timeTo}
              onChange={handleInputChange}
              ref={timeToRef}
              className="time-input"
              placeholder="чч:мм"
              maxLength={5}
              required
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="pickup" 
            checked={formData.pickup}
            onCheckedChange={handleCheckboxChange}
          />
          <Label 
            htmlFor="pickup" 
            className="text-sm font-medium cursor-pointer"
          >
            Самовывоз
          </Label>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="notes">Заметки</Label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label>Выбрать цветы</Label>
          {isFlowersLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <FlowerSelector
              flowers={flowers}
              selectedFlowers={selectedFlowers}
              onSelectFlower={handleSelectFlower}
              projectedInventory={projectedInventory} 
            />
          )}
          {selectedFlowers.size > 0 && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-2">Выбранные цветы</h4>
                <ul className="space-y-2">
                {Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
                  const flower = Array.isArray(flowers) 
                    ? flowers.find(f => f.id === flowerId) 
                    : undefined;
                  
                  return (
                    <li key={flowerId} className="text-sm">
                      <div className="flex justify-between">
                        <span>{flower?.flower || `Flower ID: ${flowerId}`}</span>
                        <span>{amount} шт.</span>
                      </div>
                    </li>
                  );
                })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={updateOrderMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={updateOrderMutation.isPending}
          >
            {updateOrderMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </div>
      </form>
    </div>
  );
}
