import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, OrderStatus, OrderItem as OrderItemType, Warehouse } from "@shared/schema";
import { format } from "date-fns";
import OrderItem from "@/components/OrderItem";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import FlowerSelector from "@/components/FlowerSelector";
import { Checkbox } from "@/components/ui/checkbox"; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function ActiveOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "orders");
  const [, navigate] = useLocation();
  const [showFinishedOrders, setShowFinishedOrders] = useState(false);
  
  // State for view and edit dialogs
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());
  
  // Form state for editing
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    address: '',
    dateTime: '',
    notes: '',
    pickup: false, // Add pickup field
  });
  
  // Query for available flowers
  const { data: flowers = [] } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
  });
  
  // Set form data when edit dialog opens
  useEffect(() => {
    if (editOrder) {
      const dateObj = new Date(editOrder.dateTime);
      const localDateStr = dateObj.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
      
      setFormData({
        from: editOrder.from,
        to: editOrder.to,
        address: editOrder.address,
        dateTime: localDateStr,
        notes: editOrder.notes || '',
        pickup: editOrder.pickup || false, // Set pickup value
      });
    }
  }, [editOrder]);
  
  // Update URL when tab changes
  useEffect(() => {
    navigate(`/active-orders${activeTab !== "orders" ? `?tab=${activeTab}` : ""}`, { replace: true });
  }, [activeTab, navigate]);
    
  // Then, define your queries
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Query for order items when viewing
  const { data: orderItems = [], isLoading: isItemsLoading } = useQuery<OrderItemType[]>({
    queryKey: ['/api/orders', viewOrder?.id, 'items'],
    queryFn: async () => {
      if (!viewOrder) return [];
      try {
        // Make the API request
        const response = await fetch(`/api/orders/${viewOrder.id}/items`);
        console.log("API Response for items:", response);
        
        // Check if the response is ok
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }
        
        // Parse the response as JSON
        const data = await response.json();
        console.log("Parsed response data:", data);
        
        // Ensure the data is an array
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error("Error fetching order items:", error);
        return [];
      }
    },
    enabled: !!viewOrder,
  });
  
  // Now you can use useEffect with orderItems
  useEffect(() => {
    if (orderItems) {
      console.log("Order items type:", typeof orderItems);
      console.log("Order items value:", orderItems);
    }
  }, [orderItems]);
    
  // Query for order items when editing
  const { data: editOrderItems = [], isLoading: isEditItemsLoading } = useQuery<OrderItemType[]>({
    queryKey: ['/api/orders', editOrder?.id, 'items'],
    enabled: !!editOrder
  });
  
  // Effect to set selected flowers when edit items are loaded
  useEffect(() => {
    if (editOrderItems && editOrderItems.length > 0 && flowers.length > 0) {
      // Initialize the selectedFlowers map from the order items
      const newSelectedFlowers = new Map<number, number>();
      
      editOrderItems.forEach((item: OrderItemType) => {
        // Find the flower in the available flowers
        const flower = flowers.find(f => f.flower === item.flower);
        if (flower) {
          newSelectedFlowers.set(flower.id, item.amount);
        }
      });
      
      setSelectedFlowers(newSelectedFlowers);
    }
  }, [editOrderItems, flowers]);
  
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
  
  // Mutation for updating order
  const updateOrderMutation = useMutation({
    mutationFn: async (updatedOrder: {id: number, data: any}) => {
      return await apiRequest('PUT', `/api/orders/${updatedOrder.id}`, updatedOrder.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setIsEditOpen(false);
      setEditOrder(null);
      toast({
        title: "Обновление заказа",
        description: "Заказ был успешно обновлён",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
      console.error("Ошибка обновления заказа:", error);
    }
  });

  // Add delete order mutation
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      return await apiRequest('DELETE', `/api/orders/${orderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Удаление заказа",
        description: "Заказ был успешно удалён",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить заказ. Пожалуйста, попробуйте снова.",
        variant: "destructive",
      });
      console.error("Ошибка удаления заказа:", error);
    }
  });
  
  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    if (deleteOrderId) {
      deleteOrderMutation.mutate(deleteOrderId);
    }
  };
  
  // Handle delete click
  const handleDeleteClick = (orderId: number) => {
    setDeleteOrderId(orderId);
    setIsDeleteDialogOpen(true);
  };
  
  // Add debugging to check orders data
  useEffect(() => {
    if (orders.length > 0) {
      console.log("Все заказы:", orders);
      console.log("Заказы со статусом Новый:", orders.filter(o => o.status === OrderStatus.New));
      console.log("Заказы со статусом Собран:", orders.filter(o => o.status === OrderStatus.Assembled));
    }
  }, [orders]);

  
  const filteredOrders = orders.filter(order => {
    // Add debugging
    console.log(`Фильтруем заказ #${order.id} со статусом ${order.status} для вкладки ${activeTab}`);
    
    if (activeTab === "orders") {
      // Keep pickup orders in the "orders" tab until they are sent
      return (order.status === OrderStatus.New || order.status === OrderStatus.Assembled);
    } else if (activeTab === "delivery") {
      if (showFinishedOrders) {
        return (order.status === OrderStatus.Sent || order.status === OrderStatus.Finished) && !order.pickup;
      } else {
        return order.status === OrderStatus.Sent && !order.pickup;
      }
    } else if (activeTab === "pickup") {
      // Only show pickup orders in the "pickup" tab when they are sent or finished
      if (showFinishedOrders) {
        return order.pickup && (order.status === OrderStatus.Sent || order.status === OrderStatus.Finished);
      } else {
        return order.pickup && order.status === OrderStatus.Sent;
      }
    }
    return false;
  });
  

  // Log the filtered results
  useEffect(() => {
    console.log("Отфильтрованные заказы:", filteredOrders);
  }, [filteredOrders]);

  // Group orders by date
  const groupOrdersByDate = (orders: Order[]) => {
    if (orders.length === 0) return {};
    
    // Sort orders based on the active tab
    // For delivery tab: oldest to newest (ascending)
    // For orders tab: closest to future first (ascending)
    const sortedOrders = [...orders].sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      
      // For delivery tab, sort from oldest to newest
      if (activeTab === "delivery") {
        return dateA - dateB; // Ascending order (oldest first)
      }
      
      // For orders tab, keep the existing sort (closest to future first)
      return dateA - dateB; // Already in ascending order
    });
    
    const groupedOrders: { [key: string]: Order[] } = {};
    
    sortedOrders.forEach(order => {
      const date = new Date(order.dateTime);
      const dateKey = format(date, "yyyy-MM-dd");
      
      if (!groupedOrders[dateKey]) {
        groupedOrders[dateKey] = [];
      }
      
      groupedOrders[dateKey].push(order);
    });
    
    // Sort the date keys
    // For delivery tab: oldest dates first
    // For orders tab: closest dates first
    const sortedKeys = Object.keys(groupedOrders).sort((a, b) => {
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      
      // For delivery tab, sort from oldest to newest
      if (activeTab === "delivery") {
        return dateB - dateA; // Ascending order (oldest first)
      }
      
      // For orders tab, keep the existing sort (closest dates first)
      return dateA - dateB; // Already in ascending order
    });
    
    // Create a new object with sorted keys
    const result: { [key: string]: Order[] } = {};
    sortedKeys.forEach(key => {
      result[key] = groupedOrders[key];
    });
    
    return result;
  };
  
  // Group orders
  const groupedOrders = groupOrdersByDate(filteredOrders);
  
  // Format date for display
  const formatDateHeading = (dateString: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const date = new Date(dateString);
    
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
      return `Today - ${format(date, "MMMM d, yyyy")}`;
    } else if (format(date, "yyyy-MM-dd") === format(tomorrow, "yyyy-MM-dd")) {
      return `Tomorrow - ${format(date, "MMMM d, yyyy")}`;
    } else {
      return format(date, "MMMM d, yyyy");
    }
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
    });
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editOrder) return;
    
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
      id: editOrder.id, 
      data: {
        order: {
          from: formData.from,
          to: formData.to,
          address: formData.address,
          dateTime: dateTime.toISOString(),
          notes: formData.notes || null,
          pickup: formData.pickup,
        },
        items,
      }
    });
  };
  
  // Format date time for display
  const formatDateTime = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };
  
  return (
    <section className="max-w-3xl mx-auto">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full rounded-none">
          <TabsTrigger value="orders">Заказы</TabsTrigger>
          <TabsTrigger value="delivery">Доставка</TabsTrigger>
          <TabsTrigger value="pickup">Самовывоз</TabsTrigger>
        </TabsList>
        
        {/* Orders Tab Content */}
        <TabsContent value="orders" className="p-4">
          {isLoading ? (
            // Loading skeleton
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="mb-6">
                <Skeleton className="h-4 w-40 mb-3" />
                <div className="space-y-3">
                  <Skeleton className="h-[120px] w-full rounded-lg" />
                  <Skeleton className="h-[120px] w-full rounded-lg" />
                </div>
              </div>
            ))
          ) : Object.keys(groupedOrders).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Заказы не найдены</p>
            </div>
          ) : (
            Object.keys(groupedOrders).map(dateKey => (
              <div key={dateKey} className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">
                  {formatDateHeading(dateKey)}
                </h3>
                
                <div className="space-y-3">
                  {groupedOrders[dateKey].map(order => (
                    <OrderItem
                      key={order.id}
                      order={order}
                      onView={() => {
                        setViewOrder(order);
                        setIsViewOpen(true);
                      }}
                      onEdit={() => {
                        setEditOrder(order);
                        setIsEditOpen(true);
                      }}
                      onDelete={() => handleDeleteClick(order.id)} 
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
        
        {/* Delivery Tab Content */}
        <TabsContent value="delivery" className="p-4">
          {/* Add the checkbox for showing finished orders */}
          <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="showFinishedOrders" 
              checked={showFinishedOrders}
              onCheckedChange={(checked) => setShowFinishedOrders(checked === true)}
            />
            <Label 
              htmlFor="showFinishedOrders" 
              className="text-sm font-medium cursor-pointer"
            >
              Показывать завершённые заказы
            </Label>
          </div>
          
          {isLoading ? (
            // Loading skeleton
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[120px] w-full rounded-lg" />
                <Skeleton className="h-[120px] w-full rounded-lg" />
              </div>
            ))
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Доставки не найдены</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderItem
                  key={order.id}
                  order={order}
                  onView={() => {
                    setViewOrder(order);
                    setIsViewOpen(true);
                  }}
                  onDelete={() => handleDeleteClick(order.id)} 
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Pickup Tab Content */}
        <TabsContent value="pickup" className="p-4">
        <div className="flex items-center space-x-2 mb-4">
            <Checkbox 
              id="showFinishedOrders" 
              checked={showFinishedOrders}
              onCheckedChange={(checked) => setShowFinishedOrders(checked === true)}
            />
            <Label 
              htmlFor="showFinishedOrders" 
              className="text-sm font-medium cursor-pointer"
            >
              Показывать завершённые заказы
            </Label>
          </div>

          {isLoading ? (
            // Loading skeleton
            Array(2).fill(0).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[120px] w-full rounded-lg" />
                <Skeleton className="h-[120px] w-full rounded-lg" />
              </div>
            ))
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Заказы на самовывоз не найдены</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <OrderItem
                  key={order.id}
                  order={order}
                  onView={() => {
                    setViewOrder(order);
                    setIsViewOpen(true);
                  }}
                  // onEdit={() => {
                  //   setEditOrder(order);
                  //   setIsEditOpen(true);
                  // }}
                  onDelete={() => handleDeleteClick(order.id)} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* View Order Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Детали заказа</DialogTitle>
            <DialogDescription>
              Посмотреть детали заказа
            </DialogDescription>
          </DialogHeader>
          
          {viewOrder && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Заказ №{viewOrder.id}</h4>
                  <div className="grid grid-cols-[80px_1fr] gap-1 text-sm">
                    <span className="text-gray-500">Статус:</span>
                    <span>{viewOrder.status}</span>
                    
                    <span className="text-gray-500">От:</span>
                    <span>{viewOrder.from}</span>
                    
                    <span className="text-gray-500">К:</span>
                    <span>{viewOrder.to}</span>
                    
                    <span className="text-gray-500">Адрес:</span>
                    <span>{viewOrder.address}</span>
                    
                    <span className="text-gray-500">Дата:</span>
                    <span>{formatDateTime(viewOrder.dateTime)}</span>
                    
                    <span className="text-gray-500">Тип:</span>
                    <span>{viewOrder.pickup ? "Самовывоз" : "Доставка"}</span>
                    
                    {viewOrder.notes && (
                      <>
                        <span className="text-gray-500">Заметки:</span>
                        <span>{viewOrder.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Цветы</h4>
                  {isItemsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                                    ) : !Array.isArray(orderItems) || orderItems.length === 0 ? (
                    <p className="text-sm text-gray-500">В заказе нет цветов.</p>
                  ) : (
                    <ul className="space-y-2">
                      {orderItems.map(item => (
                        <li key={item.id} className="text-sm">
                          <div className="flex justify-between">
                            <span>{item.flower}</span>
                            <span>{item.amount} шт.</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Редактировать заказ</DialogTitle>
            <DialogDescription>
              Внести изменения в заказ
            </DialogDescription>
          </DialogHeader>
          
          {editOrder && (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
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
              
              {/* Add pickup checkbox to edit dialog */}
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
                <Label>Выберите цветы</Label>
                {isEditItemsLoading ? (
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
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={updateOrderMutation.isPending}
                >
                  Отмена
                </Button>
                <Button 
                  type="submit"
                  disabled={updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? "Сохранение..." : "Применить изменения"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить заказ</AlertDialogTitle>
            <AlertDialogDescription>
              Подтвердите, пожалуйста, удаление заказа.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? "Удаление..." : "Удалить"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}


