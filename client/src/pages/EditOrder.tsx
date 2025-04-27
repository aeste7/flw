import { useState, useEffect } from "react";
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

export default function EditOrder() {
  const [match, params] = useRoute("/edit-order/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderId = params?.id ? parseInt(params.id) : null;
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());

  console.log("Route match:", match, "Params:", params, "Order ID:", orderId);
  
  // Form state
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    address: '',
    dateTime: '',
    notes: '',
  });
  
// Query for the order
const { data: order, isLoading: isOrderLoading } = useQuery<Order>({
    queryKey: ['/api/orders', orderId],
    queryFn: async () => {
      if (!orderId) return null;
      console.log("Fetching order with ID:", orderId);
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      
      // Check if response is a Response object that needs to be parsed
      if (response instanceof Response) {
        const data = await response.json();
        console.log("Parsed order data:", data);
        return data;
      }
      
      console.log("Order data received:", response);
      return response;
    },
    enabled: !!orderId,
  });
  
  // Similarly for order items
  const { data: orderItems = [], isLoading: isItemsLoading } = useQuery<OrderItemType[]>({
    queryKey: ['/api/orders', orderId, 'items'],
    queryFn: async () => {
      if (!orderId) return [];
      console.log("Fetching order items for order ID:", orderId);
      const response = await apiRequest('GET', `/api/orders/${orderId}/items`);
      
      // Check if response is a Response object that needs to be parsed
      if (response instanceof Response) {
        const data = await response.json();
        console.log("Parsed order items:", data);
        return data;
      }
      
      console.log("Order items received:", response);
      return response;
    },
    enabled: !!orderId,
  });
  
  // Query for available flowers
  const { data: flowers = [], isLoading: isFlowersLoading } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
  });
  
  // Set form data when order data is loaded
  useEffect(() => {
    console.log("Order data changed:", order);
    if (order) {
      try {
        // Try to create a valid date object
        const dateObj = new Date(order.dateTime);
        
        // Check if the date is valid before calling toISOString()
        if (!isNaN(dateObj.getTime())) {
          // Format the date for the datetime-local input
          // This format is YYYY-MM-DDThh:mm
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          const hours = String(dateObj.getHours()).padStart(2, '0');
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          
          const localDateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
          
          console.log("Setting form data:", {
            from: order.from,
            to: order.to,
            address: order.address,
            dateTime: localDateStr,
            notes: order.notes || '',
          });
          

          setFormData({
            from: order.from,
            to: order.to,
            address: order.address,
            dateTime: localDateStr,
            notes: order.notes || '',
          });
        } else {
          // Handle invalid date
          console.error("Invalid date value:", order.dateTime);
          
          // Set form data with current date/time
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const hours = String(now.getHours()).padStart(2, '0');
          const minutes = String(now.getMinutes()).padStart(2, '0');
          
          const localDateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
          
          console.log("Setting form data:", {
            from: order.from,
            to: order.to,
            address: order.address,
            dateTime: localDateStr,
            notes: order.notes || '',
          });
          

          setFormData({
            from: order.from,
            to: order.to,
            address: order.address,
            dateTime: localDateStr,
            notes: order.notes || '',
          });
          
          toast({
            title: "Внимание",
            description: "Ошибка поля дата. Было установлено текущее время",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error processing order date:", error);
        
        // Set form data with current date/time as fallback
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        const localDateStr = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        console.log("Setting form data:", {
            from: order.from,
            to: order.to,
            address: order.address,
            dateTime: localDateStr,
            notes: order.notes || '',
          });
          

        setFormData({
          from: order.from,
          to: order.to,
          address: order.address,
          dateTime: localDateStr,
          notes: order.notes || '',
        });
      }
    }
  }, [order, toast]);
  
  // Set selected flowers when order items are loaded
  useEffect(() => {
    console.log("Order items or flowers changed:", { orderItems, flowers });
    if (orderItems && orderItems.length > 0 && flowers.length > 0) {
      // Initialize the selectedFlowers map from the order items
      const newSelectedFlowers = new Map<number, number>();
      
      orderItems.forEach((item: OrderItemType) => {
        // Find the flower in the available flowers
        const flower = flowers.find(f => f.flower === item.flower);
        if (flower) {
          newSelectedFlowers.set(flower.id, item.amount);
        }
      });
      
      console.log("Setting selected flowers:", newSelectedFlowers);
      setSelectedFlowers(newSelectedFlowers);
    }
  }, [orderItems, flowers]);
  
  // Handle flower selection
  const handleSelectFlower = (flowerId: number, amount: number) => {
    const newSelectedFlowers = new Map(selectedFlowers);
    
    if (amount === 0) {
      newSelectedFlowers.delete(flowerId);
    } else {
      newSelectedFlowers.set(flowerId, amount);
    }
    
    setSelectedFlowers(newSelectedFlowers);
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };
  
  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!orderId) throw new Error("Order ID is required");
      return await apiRequest('PUT', `/api/orders/${orderId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Обновление заказа",
        description: "Заказ был успешно обновлён",
      });
      navigate("/active-orders");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ, пожалуйста, повторите попытку",
        variant: "destructive",
      });
      console.error("Error updating order:", error);
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderId) return;
    
    const dateTime = new Date(formData.dateTime);
    
    // Prepare order items
    const items = Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
      const flower = flowers.find(f => f.id === flowerId);
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
    
    updateOrderMutation.mutate({
      order: {
        from: formData.from,
        to: formData.to,
        address: formData.address,
        dateTime: dateTime.toISOString(),
        notes: formData.notes || null,
      },
      items,
    });
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate("/active-orders");
  };
  
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
            <Label htmlFor="from">От</Label>
            <Input
              id="from"
              name="from"
              value={formData.from}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="to">К</Label>
            <Input
              id="to"
              name="to"
              value={formData.to}
              onChange={handleInputChange}
              required
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
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="dateTime">Дата и время</Label>
          <Input
            id="dateTime"
            name="dateTime"
            type="datetime-local"
            value={formData.dateTime}
            onChange={handleInputChange}
            required
          />
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
            />
          )}
          {selectedFlowers.size > 0 && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="text-sm font-medium mb-2">Выбранные цветы</h4>
                <ul className="space-y-2">
                  {Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
                    const flower = flowers.find(f => f.id === flowerId);
                    return (
                      <li key={flowerId} className="text-sm">
                        <div className="flex justify-between">
                          <span>{flower?.flower}</span>
                          <span>{amount} pcs</span>
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
