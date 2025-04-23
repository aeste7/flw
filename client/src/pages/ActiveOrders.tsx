import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { Order, OrderStatus } from "@shared/schema";
import { groupBy, format } from "date-fns";
import OrderItem from "@/components/OrderItem";
import { Skeleton } from "@/components/ui/skeleton";

export default function ActiveOrders() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "orders");
  const [, navigate] = useLocation();
  
  // Update URL when tab changes
  useEffect(() => {
    navigate(`/active-orders${activeTab !== "orders" ? `?tab=${activeTab}` : ""}`, { replace: true });
  }, [activeTab, navigate]);
  
  // Query for orders
  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
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
    
    const groupedOrders: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      const date = new Date(order.dateTime);
      const dateKey = format(date, "yyyy-MM-dd");
      
      if (!groupedOrders[dateKey]) {
        groupedOrders[dateKey] = [];
      }
      
      groupedOrders[dateKey].push(order);
    });
    
    // Sort orders within each date by time
    Object.keys(groupedOrders).forEach(key => {
      groupedOrders[key].sort((a, b) => {
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      });
    });
    
    return groupedOrders;
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
                        // In a real app, this would navigate to order detail view
                        // For now, we'll just log to console
                        console.log("View order:", order);
                      }}
                      onEdit={() => {
                        // In a real app, this would navigate to order edit view
                        // For now, we'll just log to console
                        console.log("Edit order:", order);
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
                    // In a real app, this would navigate to order detail view
                    // For now, we'll just log to console
                    console.log("View order:", order);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
