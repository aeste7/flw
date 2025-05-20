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
  console.log("EditOrder component rendering");
  
  // Router and navigation
  const [match, params] = useRoute("/edit-order/:id");
  const [, navigate] = useLocation();

 // Add this line to check the current route
 console.log("🔴 Current route:", window.location.pathname, "Match:", match, "Params:", params);

  const orderId = params?.id ? parseInt(params.id) : null;
  
  // Hooks
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const timeFromRef = useRef<HTMLInputElement>(null);
  const timeToRef = useRef<HTMLInputElement>(null);
  
  // State
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());
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
      if (response instanceof Response) {
        return await response.json();
      }
      return response;
    },
    enabled: !!orderId,
  });
  
  const { 
    data: orderItems = [], 
    isLoading: isItemsLoading 
  } = useQuery<OrderItemType[]>({
    queryKey: ['/api/orders', orderId, 'items'],
    queryFn: async () => {
      if (!orderId) return [];
      const response = await apiRequest('GET', `/api/orders/${orderId}/items`);
      if (response instanceof Response) {
        return await response.json();
      }
      return response;
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
      if (response instanceof Response) {
        return await response.json();
      }
      return response;
    },
  });
  
  // Set form data when order data is loaded
  useEffect(() => {
    if (!order) return;
    
    try {
      // Parse date
      const dateObj = new Date(order.dateTime);
      
      if (!isNaN(dateObj.getTime())) {
        // Format date for input
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
        // Handle invalid date
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
      console.error("Error processing order date:", error);
      
      // Fallback to current date
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
  }, [orderItems, flowers]);
  
  // Calculate projected inventory
// Add this useEffect to calculate projected inventory whenever selectedFlowers changes
useEffect(() => {
  console.log(`🔢 CALCULATING PROJECTED INVENTORY`);
  console.log(`🔢 Selected flowers:`, Array.from(selectedFlowers.entries()));
  console.log(`🔢 Order items:`, orderItems);
  console.log(`🔢 Flowers:`, flowers);
  
  if (!orderItems || orderItems.length === 0 || !flowers || !Array.isArray(flowers) || flowers.length === 0) {
    console.log(`🔢 Missing data, skipping calculation`);
    return;
  }

  // Create a map of original flower quantities from order items
  const originalFlowerQuantities = new Map<string, number>();
  orderItems.forEach(item => {
    originalFlowerQuantities.set(item.flower, item.amount);
    console.log(`🔢 Original quantity for ${item.flower}: ${item.amount}`);
  });

  // Create a map of current flower IDs to their names
  const flowerIdToName = new Map<number, string>();
  const flowerNameToId = new Map<string, number>();
  
  // Make sure flowers is an array before using forEach
  if (Array.isArray(flowers)) {
    flowers.forEach(flower => {
      flowerIdToName.set(flower.id, flower.flower);
      flowerNameToId.set(flower.flower, flower.id);
      console.log(`🔢 Mapping flower ID ${flower.id} to name "${flower.flower}"`);
    });
  } else {
    console.error("🔢 flowers is not an array:", flowers);
    return; // Exit early if flowers is not an array
  }

  // Calculate projected inventory
  const newProjectedInventory = new Map<number, number>();
  
  // Start with current inventory
  if (Array.isArray(flowers)) {
    flowers.forEach(flower => {
      newProjectedInventory.set(flower.id, flower.amount);
      console.log(`🔢 Starting inventory for ${flower.flower} (ID: ${flower.id}): ${flower.amount}`);
    });
  }

  // Return original quantities to inventory (add back)
  originalFlowerQuantities.forEach((amount, flowerName) => {
    const flowerId = flowerNameToId.get(flowerName);
    if (flowerId !== undefined) {
      const currentAmount = newProjectedInventory.get(flowerId) || 0;
      const newAmount = currentAmount + amount;
      newProjectedInventory.set(flowerId, newAmount);
      console.log(`🔢 Adding back ${amount} of ${flowerName} (ID: ${flowerId}). ${currentAmount} → ${newAmount}`);
    } else {
      console.log(`🔢 Could not find ID for flower "${flowerName}"`);
    }
  });

  // Subtract new quantities from inventory
  selectedFlowers.forEach((amount, flowerId) => {
    const currentAmount = newProjectedInventory.get(flowerId) || 0;
    const newAmount = currentAmount - amount;
    newProjectedInventory.set(flowerId, newAmount);
    const flowerName = flowerIdToName.get(flowerId) || `Unknown (ID: ${flowerId})`;
    console.log(`🔢 Subtracting ${amount} of ${flowerName}. ${currentAmount} → ${newAmount}`);
  });

  console.log(`🔢 Final projected inventory:`, Array.from(newProjectedInventory.entries()));
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
        
        // Format time input
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
  

  // Mount and unmount component log
  useEffect(() => {
    console.log("🔴 EDIT_ORDER: Component mounted");
    
    return () => {
      console.log("🔴 EDIT_ORDER: Component unmounted");
    };
  }, []);
  

// Update order mutation
const updateOrderMutation = useMutation({
  mutationFn: async (data: {
    order: Partial<Order>;
    items: { flower: string; amount: number }[];
    inventoryAdjustments: { flower: string; amount: number; action: 'take' | 'return' }[];
  }) => {
    if (!orderId) throw new Error("Order ID is required");
    
    console.log("=== UPDATE ORDER MUTATION STARTED ===");
    console.log("Data received:", JSON.stringify(data, null, 2));
    
    try {
      // First update the order with both order data and items
      // Instead of separate calls, include items in the order update
      console.log("Updating order details and items...");
      const orderResponse = await apiRequest('PUT', `/api/orders/${orderId}`, {
        order: data.order,
        items: data.items
      });
      console.log("Order update response:", orderResponse);
      
      // Then handle inventory adjustments
      if (data.inventoryAdjustments && data.inventoryAdjustments.length > 0) {
        console.log(`Processing ${data.inventoryAdjustments.length} inventory adjustments...`);
        
        // Get fresh flower data
        console.log("Fetching current flower inventory...");
        const flowersResponse = await apiRequest('GET', '/api/flowers');
        const currentFlowers = flowersResponse instanceof Response 
          ? await flowersResponse.json() 
          : flowersResponse;
        
        console.log("Current flower inventory:", currentFlowers);
        
        // Process each adjustment
        for (const adjustment of data.inventoryAdjustments) {
          console.log(`Processing adjustment: ${adjustment.action} ${adjustment.amount} of ${adjustment.flower}`);
          
          // Find the flower in the warehouse
          const flowerToAdjust = Array.isArray(currentFlowers) 
            ? currentFlowers.find(f => f.flower === adjustment.flower) 
            : undefined;
          
          console.log("Found flower in warehouse:", flowerToAdjust);
          
          if (flowerToAdjust) {
            // Calculate new amount
            let newAmount = flowerToAdjust.amount;
            
            if (adjustment.action === 'return') {
              // Return flowers to inventory
              newAmount += adjustment.amount;
              console.log(`Returning ${adjustment.amount} of ${adjustment.flower} to inventory. Current: ${flowerToAdjust.amount}, New: ${newAmount}`);
            } else if (adjustment.action === 'take') {
              // Take flowers from inventory
              newAmount = Math.max(0, newAmount - adjustment.amount);
              console.log(`Taking ${adjustment.amount} of ${adjustment.flower} from inventory. Current: ${flowerToAdjust.amount}, New: ${newAmount}`);
            }
            
            // Update flower inventory
            console.log(`Updating flower ${flowerToAdjust.id} (${flowerToAdjust.flower}) inventory to ${newAmount}`);
            const updateResponse = await apiRequest('PUT', `/api/flowers/${flowerToAdjust.id}`, {
              amount: newAmount
            });
            console.log("Flower update response:", updateResponse);
          } else if (adjustment.action === 'return') {
            // If flower doesn't exist but we need to return it to inventory, create it
            console.log(`Flower ${adjustment.flower} not found in warehouse. Creating new entry with amount ${adjustment.amount}`);
            const createResponse = await apiRequest('POST', '/api/flowers', {
              flower: adjustment.flower,
              amount: adjustment.amount
            });
            console.log("Flower creation response:", createResponse);
          } else {
            console.error(`Flower ${adjustment.flower} not found in warehouse and action is ${adjustment.action}`);
          }
        }
      } else {
        console.log("No inventory adjustments to process");
      }
      
      console.log("Order update completed successfully");
      return orderResponse;
    } catch (error) {
      console.error("Error updating order:", error);
      throw error;
    }
  },
  onSuccess: async () => {
    console.log("=== UPDATE ORDER MUTATION SUCCEEDED ===");
    
    // Invalidate and refetch queries
    console.log("Invalidating queries...");
    await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
    
    // Force refetch
    console.log("Refetching queries...");
    await queryClient.refetchQueries({ queryKey: ['/api/flowers'] });
    
    toast({
      title: "Обновление заказа",
      description: "Заказ был успешно обновлён",
    });
    
    console.log("Navigating to active orders...");
    setTimeout(() => {
      navigate("/active-orders");
    }, 500);
  },
  onError: (error) => {
    console.error("=== UPDATE ORDER MUTATION FAILED ===", error);
    
    toast({
      title: "Ошибка",
      description: "Не удалось обновить заказ: " + (error instanceof Error ? error.message : String(error)),
      variant: "destructive",
    });
  }
});



  
  // Event handlers
  // Handle flower selection
  const handleSelectFlower = (flowerId: number, amount: number) => {
    console.log(`🌸 FLOWER SELECTION CHANGED: ID=${flowerId}, New Amount=${amount}`);
    
    // Get the previous amount for comparison
    const previousAmount = selectedFlowers.get(flowerId) || 0;
    console.log(`🌸 Previous amount was: ${previousAmount}`);
    
    const newSelectedFlowers = new Map(selectedFlowers);
    
    if (amount === 0) {
      console.log(`🌸 Removing flower ID=${flowerId} from selection`);
      newSelectedFlowers.delete(flowerId);
    } else {
      console.log(`🌸 Setting flower ID=${flowerId} to amount=${amount}`);
      newSelectedFlowers.set(flowerId, amount);
    }
    
    // Log the flower name for better context
    const flowerName = Array.isArray(flowers) 
      ? flowers.find(f => f.id === flowerId)?.flower 
      : undefined;
    console.log(`🌸 Flower name: ${flowerName || 'Unknown'}`);
    
    setSelectedFlowers(newSelectedFlowers);
    
    // Log the updated selection
    console.log(`🌸 Updated selection:`, Array.from(newSelectedFlowers.entries()));
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
  
// Add this state to store the initial flower selection
const [initialFlowerSelection, setInitialFlowerSelection] = useState<Map<number, number>>(new Map());

// Modify the useEffect that sets selected flowers to also set the initial selection
useEffect(() => {
  console.log("Order items or flowers changed:", { 
    orderItems, 
    orderItemsLength: orderItems?.length || 0,
    flowers, 
    flowersLength: flowers?.length || 0 
  });
  
  if (orderItems && orderItems.length > 0 && flowers.length > 0) {
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
    
    // Also set the initial flower selection for comparison later
    console.log("Setting initial flower selection:", newSelectedFlowers);
    setInitialFlowerSelection(new Map(newSelectedFlowers));
  } else {
    console.log("Not setting selected flowers because:", {
      orderItemsExist: !!orderItems,
      orderItemsLength: orderItems?.length || 0,
      flowersExist: !!flowers,
      flowersLength: flowers?.length || 0
    });
  }
}, [orderItems, flowers]);

// Now update the handleSubmit function to compare with initial selection
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  
  console.log("🔴 EDIT_ORDER: handleSubmit called");
  
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
  
  if (hasNegativeInventory) {
    return;
  }
  
  // Parse date
  const dateTime = new Date(formData.dateTime);
  
  // Prepare updated order items
  const items = Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
    const flower = Array.isArray(flowers) 
      ? flowers.find(f => f.id === flowerId) 
      : undefined;
    
    const flowerName = flower?.flower || "";
    console.log(`📋 Updated order item: ${flowerName} = ${amount}`);
    
    return {
      flower: flowerName,
      amount,
    };
  });
  
  console.log("Updated order items:", items);
  
  // Check if any flowers are selected
  if (items.length === 0) {
    toast({
      title: "Ошибка",
      description: "Пожалуйста, выберите хотя бы один цветок",
      variant: "destructive",
    });
    return;
  }
  
  // IMPORTANT: Check if there are any actual changes to the flower selection
  let hasChanges = false;
  
  // Compare current selection with initial selection
  console.log("Comparing current selection with initial selection:");
  console.log("Initial selection:", Array.from(initialFlowerSelection.entries()));
  console.log("Current selection:", Array.from(selectedFlowers.entries()));
  
  // First check if the number of selected flowers has changed
  if (initialFlowerSelection.size !== selectedFlowers.size) {
    console.log(`Number of selected flowers changed: initial=${initialFlowerSelection.size}, current=${selectedFlowers.size}`);
    hasChanges = true;
  } else {
    // Check each flower for quantity changes
    for (const [flowerId, currentAmount] of selectedFlowers.entries()) {
      const initialAmount = initialFlowerSelection.get(flowerId) || 0;
      
      if (currentAmount !== initialAmount) {
        const flower = Array.isArray(flowers) ? flowers.find(f => f.id === flowerId) : undefined;
        console.log(`Flower ${flower?.flower || flowerId} changed: initial=${initialAmount}, current=${currentAmount}`);
        hasChanges = true;
        break;
      }
    }
    
    // Check if any initially selected flowers were removed
    if (!hasChanges) {
      for (const [flowerId] of initialFlowerSelection.entries()) {
        if (!selectedFlowers.has(flowerId)) {
          const flower = Array.isArray(flowers) ? flowers.find(f => f.id === flowerId) : undefined;
          console.log(`Flower ${flower?.flower || flowerId} was removed`);
          hasChanges = true;
          break;
        }
      }
    }
  }
  
  // Only calculate inventory adjustments if there are changes
  const inventoryAdjustments: { flower: string; amount: number; action: 'take' | 'return' }[] = [];
  
  if (hasChanges) {
    console.log("Changes detected, calculating inventory adjustments");
    
    // Create a map of the original order items for comparison
    const originalOrderItems = new Map<string, number>();
    if (Array.isArray(orderItems)) {
      orderItems.forEach(item => {
        originalOrderItems.set(item.flower, item.amount);
        console.log(`📋 Original order item: ${item.flower} = ${item.amount}`);
      });
    }
    
    // Check for reduced quantities (return to inventory)
    originalOrderItems.forEach((originalAmount, flowerName) => {
      const updatedItem = items.find(item => item.flower === flowerName);
      const updatedAmount = updatedItem ? updatedItem.amount : 0;
      
      if (updatedAmount < originalAmount) {
        // Flower quantity was reduced, return to inventory
        const returnAmount = originalAmount - updatedAmount;
        console.log(`Returning ${returnAmount} of ${flowerName} to inventory`);
        
        inventoryAdjustments.push({
          flower: flowerName,
          amount: returnAmount,
          action: 'return'
        });
      } else if (updatedAmount > originalAmount) {
        // Flower quantity was increased, take from inventory
        const takeAmount = updatedAmount - originalAmount;
        console.log(`Taking ${takeAmount} of ${flowerName} from inventory`);
        
        inventoryAdjustments.push({
          flower: flowerName,
          amount: takeAmount,
          action: 'take'
        });
      }
    });
    
    // Check for new flowers (take from inventory)
    items.forEach(item => {
      if (!originalOrderItems.has(item.flower)) {
        // New flower added to order, take from inventory
        console.log(`Taking ${item.amount} of ${item.flower} from inventory (new flower)`);
        
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
        console.log(`Returning ${amount} of ${flowerName} to inventory (flower removed)`);
        
        inventoryAdjustments.push({
          flower: flowerName,
          amount,
          action: 'return'
        });
      }
    });
  } else {
    console.log("No changes detected, skipping inventory adjustments");
  }
  
  console.log("Final inventory adjustments:", inventoryAdjustments);
  
  // Submit the order update
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
    // Only include inventory adjustments if there are changes
    inventoryAdjustments: hasChanges ? inventoryAdjustments : [],
  });
};

   
  
  
  
  // Render loading state
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
  
  // Render form
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
              placeholder="HH:MM"
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
              placeholder="HH:MM"
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
          ) : !Array.isArray(flowers) || flowers.length === 0 ? (
            <div className="p-4 border rounded-md bg-gray-50 text-gray-500 text-center">
              Нет доступных цветов
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
            Отмена
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

