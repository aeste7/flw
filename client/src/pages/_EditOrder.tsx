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
  const [match, params] = useRoute("/edit-order/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const orderId = params?.id ? parseInt(params.id) : null;
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());

  const timeFromRef = useRef<HTMLInputElement>(null);
  const timeToRef = useRef<HTMLInputElement>(null);

  // Add this state to track projected inventory changes
  const [projectedInventory, setProjectedInventory] = useState<Map<number, number>>(new Map());

  console.log("Route match:", match, "Params:", params, "Order ID:", orderId);
  
  // Form state
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
      if (!orderId) {
        console.log("No order ID provided, returning empty array");
        return [];
      }

      console.log("Fetching order items for order ID:", orderId);
      try {
        const response = await apiRequest('GET', `/api/orders/${orderId}/items`);
        console.log("Raw API response for items:", response);
        
        // Check if response is a Response object that needs to be parsed
        if (response instanceof Response) {
          const data = await response.json();
          console.log("Parsed order items:", data);
          return data;
        }
        
        console.log("Order items received:", response);
        return response;
      } catch (error) {
        console.error("Error fetching order items:", error);
        return [];
      }
    },
    enabled: !!orderId,
  });
  
  // Query for available flowers
  const { data: flowers = [], isLoading: isFlowersLoading } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
    queryFn: async () => {
      console.log("Fetching available flowers");
      try {
        const response = await apiRequest('GET', '/api/flowers');
        console.log("Available flowers response:", response);
        return response;
      } catch (error) {
        console.error("Error fetching flowers:", error);
        return [];
      }
    }
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
          //const hours = String(dateObj.getHours()).padStart(2, '0');
          //const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          
          const localDateStr = `${year}-${month}-${day}`;
          
          setFormData({
            from: order.from,
            to: order.to,
            address: order.address,
            dateTime: localDateStr,
            timeFrom: order.timeFrom || '',
            timeTo: order.timeTo || '',
            notes: order.notes || '',
            pickup: order.pickup || false,
          });
        } else {
          // Handle invalid date
          console.error("Invalid date value:", order.dateTime);
          
          // Set form data with current date/time
          const now = new Date();
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          
          const localDateStr = `${year}-${month}-${day}`;
          
          setFormData({
            from: order.from,
            to: order.to,
            address: order.address,
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
        console.error("Error processing order date:", error);
        
        // Set form data with current date/time as fallback
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        
        const localDateStr = `${year}-${month}-${day}`;
        
       
        setFormData({
          from: order.from,
          to: order.to,
          address: order.address,
          dateTime: localDateStr,
          timeFrom: order.timeFrom || '',
          timeTo: order.timeTo || '',
          notes: order.notes || '',
          pickup: order.pickup || false, // Set pickup value
        });
      }
    }
  }, [order, toast]);


  // Add this effect to handle the time input formatting
  useEffect(() => {
    const setupTimeInput = (inputElement: HTMLInputElement | null) => {
      if (!inputElement) return;
      
      inputElement.classList.add('time-input');
      
      const handleTimeInput = (e: Event) => {
        const input = e.target as HTMLInputElement;
        const cursorPosition = input.selectionStart || 0;
        let value = input.value.replace(/[^0-9:]/g, "");
        
        // If there's already a colon in the input
        if (value.includes(':')) {
          const [hours, minutes] = value.split(':');
          
          // Validate hours (0-23)
          let formattedHours = hours;
          if (parseInt(hours) > 23) formattedHours = '23';
          
          // Validate minutes (0-59)
          let formattedMinutes = minutes;
          if (minutes.length > 0 && parseInt(minutes) > 59) formattedMinutes = '59';
          
          // Combine hours and minutes
          input.value = `${formattedHours}:${formattedMinutes}`;
          
          // Restore cursor position
          const newPosition = cursorPosition + (input.value.length - value.length);
          input.setSelectionRange(newPosition, newPosition);
          return;
        }
        
        // If no colon yet, but we have at least 2 digits, add a colon
        if (value.length >= 2) {
          // Validate hours
          let hours = value.substring(0, 2);
          if (parseInt(hours) > 23) hours = '23';
          
          // Format with colon
          if (value.length === 2) {
            input.value = `${hours}:`;
          } else {
            // We have minutes too
            let minutes = value.substring(2);
            if (minutes.length > 0 && parseInt(minutes) > 59) minutes = '59';
            input.value = `${hours}:${minutes}`;
          }
          
          // Restore cursor position, accounting for the added colon
          const newPosition = cursorPosition + (input.value.length - value.length);
          input.setSelectionRange(newPosition, newPosition);
        } else {
          // Just 1 digit, no formatting needed yet
          input.value = value;
        }
      };
      
      const handleBlur = (e: Event) => {
        const input = e.target as HTMLInputElement;
        let value = input.value.trim();
        
        // If empty, leave it empty
        if (!value) return;
        
        // If only has hours (e.g., "14:")
        if (value.endsWith(':')) {
          value = value.slice(0, -1) + ":00";
        }
        
        // If only has hours without colon (e.g., "14")
        if (!value.includes(':') && value.length <= 2) {
          value = value.padStart(2, '0') + ":00";
        }
        
        // If has hours and minutes
        if (value.includes(':')) {
          const [hours, minutes] = value.split(':');
          const formattedHours = hours.padStart(2, '0');
          const formattedMinutes = (minutes || '00').padStart(2, '0');
          value = `${formattedHours}:${formattedMinutes}`;
        }
        
        input.value = value;
        
        // Update the form state to ensure the formatted value is saved
        const name = input.name;
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      };
      
      inputElement.addEventListener("input", handleTimeInput);
      inputElement.addEventListener("blur", handleBlur);
      
      // Return cleanup function
      return () => {
        inputElement.removeEventListener("input", handleTimeInput);
        inputElement.removeEventListener("blur", handleBlur);
      };
    };
    
    // Setup both time inputs
    const cleanupTimeFrom = setupTimeInput(timeFromRef.current);
    const cleanupTimeTo = setupTimeInput(timeToRef.current);
    
    return () => {
      if (cleanupTimeFrom) cleanupTimeFrom();
      if (cleanupTimeTo) cleanupTimeTo();
    };
  }, []);

// Set selected flowers when order items are loaded
useEffect(() => {
  console.log("Order items or flowers changed:", { 
    orderItems, 
    orderItemsLength: orderItems?.length || 0,
    flowers, 
    flowersLength: Array.isArray(flowers) ? flowers.length : 0 
  });
  
  if (Array.isArray(orderItems) && orderItems.length > 0 && Array.isArray(flowers) && flowers.length > 0) {
    // Initialize the selectedFlowers map from the order items
    const newSelectedFlowers = new Map<number, number>();
    
    orderItems.forEach((item: OrderItemType) => {
      // Find the flower in the available flowers
      console.log("Processing item:", item);
      const flower = flowers.find(f => f.flower === item.flower);
      console.log("Found flower:", flower);
      
      if (flower) {
        newSelectedFlowers.set(flower.id, item.amount);
      } else {
        console.warn(`Flower not found for item: ${item.flower}`);
      }
    });
    
    console.log("Setting selected flowers:", newSelectedFlowers);
    setSelectedFlowers(newSelectedFlowers);
  } else {
    console.log("Not setting selected flowers because:", {
      orderItemsExist: Array.isArray(orderItems),
      orderItemsLength: Array.isArray(orderItems) ? orderItems.length : 0,
      flowersExist: Array.isArray(flowers),
      flowersLength: Array.isArray(flowers) ? flowers.length : 0
    });
  }
}, [orderItems, flowers]);


  
// Add this useEffect to calculate projected inventory whenever selectedFlowers changes
// Add this useEffect to calculate projected inventory whenever selectedFlowers changes
useEffect(() => {
  if (!orderItems || orderItems.length === 0 || !flowers || !Array.isArray(flowers) || flowers.length === 0) {
    return;
  }

  // Create a map of original flower quantities from order items
  const originalFlowerQuantities = new Map<string, number>();
  orderItems.forEach(item => {
    originalFlowerQuantities.set(item.flower, item.amount);
  });

  // Create a map of current flower IDs to their names
  const flowerIdToName = new Map<number, string>();
  const flowerNameToId = new Map<string, number>();
  
  // Make sure flowers is an array before using forEach
  if (Array.isArray(flowers)) {
    flowers.forEach(flower => {
      flowerIdToName.set(flower.id, flower.flower);
      flowerNameToId.set(flower.flower, flower.id);
    });
  } else {
    console.error("flowers is not an array:", flowers);
    return; // Exit early if flowers is not an array
  }

  // Calculate projected inventory
  const newProjectedInventory = new Map<number, number>();
  
  // Start with current inventory
  if (Array.isArray(flowers)) {
    flowers.forEach(flower => {
      newProjectedInventory.set(flower.id, flower.amount);
    });
  }

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

// Create a custom navigation function
const navigateToWarehouse = async () => {
  // Force refetch flowers data before navigation
  await queryClient.refetchQueries({ queryKey: ['/api/flowers'] });
  navigate("/warehouse");
};
  
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
  
  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      pickup: checked,
      // If pickup is checked, we can set default values for disabled fields
      // but we'll keep the original values in case pickup is unchecked again
    });
  };
  
  
  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!orderId) throw new Error("Order ID is required");
      
      try {
        console.log("Updating order with data:", data);
        
        // First update the order
        const orderResponse = await apiRequest('PUT', `/api/orders/${orderId}`, data);
        
        // Then handle inventory adjustments
        if (data.inventoryAdjustments && data.inventoryAdjustments.length > 0) {
          console.log("Processing inventory adjustments:", data.inventoryAdjustments);
          
          // Process each adjustment
          for (const adjustment of data.inventoryAdjustments) {
            // Find the flower in the warehouse
            const flowersResponse = await apiRequest('GET', '/api/flowers');
            let warehouseFlowers = [];
            
            if (flowersResponse instanceof Response) {
              warehouseFlowers = await flowersResponse.json();
            } else {
              warehouseFlowers = Array.isArray(flowersResponse) ? flowersResponse : [];
            }
            
            const flowerToAdjust = warehouseFlowers.find(f => f.flower === adjustment.flower);
            
            if (flowerToAdjust) {
              // Calculate new amount
              let newAmount = flowerToAdjust.amount;
              
              if (adjustment.action === 'return') {
                // Return flowers to inventory
                newAmount += adjustment.amount;
                console.log(`Returning ${adjustment.amount} of ${adjustment.flower} to inventory. New amount: ${newAmount}`);
              } else if (adjustment.action === 'take') {
                // Take flowers from inventory
                newAmount = Math.max(0, newAmount - adjustment.amount);
                console.log(`Taking ${adjustment.amount} of ${adjustment.flower} from inventory. New amount: ${newAmount}`);
              }
              
              // Update flower inventory
              await apiRequest('PUT', `/api/flowers/${flowerToAdjust.id}`, {
                amount: newAmount
              });
            } else {
              console.error(`Flower not found in warehouse: ${adjustment.flower}`);
            }
          }
        } else {
          console.log("No inventory adjustments to process");
        }
        
        return orderResponse;
      } catch (error) {
        console.error("Error in updateOrderMutation:", error);
        throw error;
      }
    },
    onSuccess: async () => {
      try {
        // Invalidate and refetch queries in sequence
        await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
        
        // Force refetch the flowers data
        await queryClient.refetchQueries({ queryKey: ['/api/flowers'] });
        
        toast({
          title: "Обновление заказа",
          description: "Заказ был успешно обновлён",
        });
        
        // Add a delay to ensure data is refreshed before navigation
        setTimeout(() => {
          navigate("/active-orders");
        }, 500);
      } catch (error) {
        console.error("Error in onSuccess callback:", error);
      }
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
// Handle form submission
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!orderId) return;
  
  // Check if any projected inventory is negative
  let hasNegativeInventory = false;
  projectedInventory.forEach((amount, flowerId) => {
    if (amount < 0) {
      hasNegativeInventory = true;
      const flower = Array.isArray(flowers) ? flowers.find(f => f.id === flowerId) : undefined;
      toast({
        title: "Ошибка",
        description: `Недостаточно цветов: ${flower?.flower}`,
        variant: "destructive",
      });
    }
  });
  
  if (hasNegativeInventory) {
    return;
  }
  
  const dateTime = new Date(formData.dateTime);
  
  // Create a map of the original order items for comparison
  const originalOrderItems = new Map<string, number>();
  if (Array.isArray(orderItems)) {
    orderItems.forEach(item => {
      originalOrderItems.set(item.flower, item.amount);
    });
  }
  
  // Prepare order items and track changes for inventory updates
  const items = Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
    const flower = Array.isArray(flowers) ? flowers.find(f => f.id === flowerId) : undefined;
    const flowerName = flower?.flower || "";
    return {
      flower: flowerName,
      amount,
    };
  });
  
  // Calculate inventory adjustments
  const inventoryAdjustments = [];
  
  // Check for reduced quantities (return to inventory)
  originalOrderItems.forEach((originalAmount, flowerName) => {
    const updatedItem = items.find(item => item.flower === flowerName);
    const updatedAmount = updatedItem ? updatedItem.amount : 0;
    
    if (updatedAmount < originalAmount) {
      // Flower quantity was reduced, return to inventory
      const returnAmount = originalAmount - updatedAmount;
      inventoryAdjustments.push({
        flower: flowerName,
        amount: returnAmount,
        action: 'return'
      });
    }
  });
  
  // Check for increased quantities (take from inventory)
  items.forEach(item => {
    const originalAmount = originalOrderItems.get(item.flower) || 0;
    
    if (item.amount > originalAmount) {
      // Flower quantity was increased, take from inventory
      const takeAmount = item.amount - originalAmount;
      inventoryAdjustments.push({
        flower: item.flower,
        amount: takeAmount,
        action: 'take'
      });
    }
  });
  
  // Check for new flowers (take from inventory)
  items.forEach(item => {
    if (!originalOrderItems.has(item.flower)) {
      // New flower added to order, take from inventory
      inventoryAdjustments.push({
        flower: item.flower,
        amount: item.amount,
        action: 'take'
      });
    }
  });
  
  // Check for removed flowers (return to inventory)
  originalOrderItems.forEach((amount, flowerName) => {
    if (!items.some(item => item.flower === flowerName)) {
      // Flower removed from order, return to inventory
      inventoryAdjustments.push({
        flower: flowerName,
        amount,
        action: 'return'
      });
    }
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
  
  // Check if there are any changes to the order
  const hasChanges = inventoryAdjustments.length > 0 || 
                    formData.from !== order.from ||
                    formData.to !== order.to ||
                    formData.address !== order.address ||
                    formData.timeFrom !== order.timeFrom ||
                    formData.timeTo !== order.timeTo ||
                    formData.notes !== order.notes ||
                    formData.pickup !== order.pickup;
  
  // If no changes, just navigate back
  if (!hasChanges) {
    toast({
      title: "Информация",
      description: "Изменений не обнаружено",
    });
    navigate("/active-orders");
    return;
  }
  
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
    inventoryAdjustments, // Pass inventory adjustments to the backend
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
              type="text" // Change to text for custom handling
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
              type="text" // Change to text for custom handling
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
        
        {/* Add pickup checkbox */}
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
                  // Add a check to ensure flowers is an array before using find
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
