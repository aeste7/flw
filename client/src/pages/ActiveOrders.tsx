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

export default function ActiveOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "orders");
  const [, navigate] = useLocation();
  
  // State for view and edit dialogs
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());
  
  // Form state for editing
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    address: '',
    dateTime: '',
    notes: '',
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
      });
    }
  }, [editOrder]);
  
  // Update URL when tab changes
  useEffect(() => {
    navigate(`/active-orders${activeTab !== "orders" ? `?tab=${activeTab}` : ""}`, { replace: true });
  }, [activeTab, navigate]);
  
  // Query for orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });
  
  // Query for order items when viewing
  const { data: orderItems = [], isLoading: isItemsLoading } = useQuery<OrderItemType[]>({
    queryKey: ['/api/orders', viewOrder?.id, 'items'],
    enabled: !!viewOrder,
  });
  
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
        title: "Order updated",
        description: "The order has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating order:", error);
    }
  });
  
  // Filter orders based on tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === "orders") {
      return order.status === OrderStatus.New || order.status === OrderStatus.Assembled;
    } else if (activeTab === "delivery") {
      return order.status === OrderStatus.Sent || order.status === OrderStatus.Finished;
    }
    return false;
  });
  
  // Group orders by date
  const groupOrdersByDate = (orders: Order[]) => {
    if (orders.length === 0) return {};
    
    // First, sort all orders by date (closest to future first)
    const sortedOrders = [...orders].sort((a, b) => {
      return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
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
    
    // Sort the date keys so most recent dates appear first
    const sortedKeys = Object.keys(groupedOrders).sort((a, b) => {
      return new Date(a).getTime() - new Date(b).getTime();
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
        title: "Error",
        description: "Please select at least one flower for the order",
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
        <TabsList className="grid grid-cols-2 w-full rounded-none">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
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
              <p className="text-gray-500">No orders found</p>
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
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>
        
        {/* Delivery Tab Content */}
        <TabsContent value="delivery" className="p-4">
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
              <p className="text-gray-500">No deliveries found</p>
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
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              View order information and flower details.
            </DialogDescription>
          </DialogHeader>
          
          {viewOrder && (
            <div className="py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Order #{viewOrder.id}</h4>
                  <div className="grid grid-cols-[80px_1fr] gap-1 text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span>{viewOrder.status}</span>
                    
                    <span className="text-gray-500">From:</span>
                    <span>{viewOrder.from}</span>
                    
                    <span className="text-gray-500">To:</span>
                    <span>{viewOrder.to}</span>
                    
                    <span className="text-gray-500">Address:</span>
                    <span>{viewOrder.address}</span>
                    
                    <span className="text-gray-500">Date:</span>
                    <span>{formatDateTime(viewOrder.dateTime)}</span>
                    
                    {viewOrder.notes && (
                      <>
                        <span className="text-gray-500">Notes:</span>
                        <span>{viewOrder.notes}</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Flowers</h4>
                  {isItemsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : orderItems.length === 0 ? (
                    <p className="text-sm text-gray-500">No flowers added to this order.</p>
                  ) : (
                    <ul className="space-y-2">
                      {orderItems.map(item => (
                        <li key={item.id} className="text-sm">
                          <div className="flex justify-between">
                            <span>{item.flower}</span>
                            <span>{item.amount} pcs</span>
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
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Order Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              Make changes to the order details.
            </DialogDescription>
          </DialogHeader>
          
          {editOrder && (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  name="from"
                  value={formData.from}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateTime">Date and Time</Label>
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Flowers</Label>
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
                      <h4 className="text-sm font-medium mb-2">Selected Flowers</h4>
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
              
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  disabled={updateOrderMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateOrderMutation.isPending}
                >
                  {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
