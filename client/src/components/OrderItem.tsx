import { Order, OrderStatus, OrderStatusType } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/status-badge";
import { MoreHorizontal, Edit, Eye, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface OrderItemProps {
  order: Order;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  currentTab?: string;
}

export default function OrderItem({ order, onView, onEdit, onDelete, currentTab }: OrderItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "d MMM yyyy", { locale: ru });
  };

  // Format time period for display
  const formatTimePeriod = (order: Order) => {
    if (order.timeFrom && order.timeTo) {
      return `${order.timeFrom} - ${order.timeTo}`;
    } else if (order.timeFrom) {
      return `с ${order.timeFrom}`;
    } else {
      // Fallback to the time from dateTime
      const date = new Date(order.dateTime);
      return format(date, "HH:mm", { locale: ru }); // Use HH for 24-hour format
    }
  };

  
  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest('PUT', `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Статус заказа",
        description: "Статус заказа был успешно обновлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить статус заказа",
        variant: "destructive",
      });
    }
  });

  // Add this mutation for deleting an order
  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: number) => {
      // Let the server handle inventory adjustments
      return await apiRequest('DELETE', `/api/orders/${orderId}`);
    },
    onSuccess: (orderId) => {
      // Invalidate and refetch both queries
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      
      // Force refetch the flowers data
      queryClient.refetchQueries({ queryKey: ['/api/flowers'] });
      
      toast({
        title: "Заказ удален",
        description: "Заказ был успешно удален и цветы возвращены на склад",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить заказ: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Determine available status transitions based on current status
  const getAvailableStatusTransitions = (): OrderStatusType[] => {
    switch (order.status) {
      case OrderStatus.New:
        // For pickup orders, skip "Собран" and go directly to "В доставке"
        if (order.pickup) {
          return [OrderStatus.Sent];
        }
        return [OrderStatus.Assembled];
      case OrderStatus.Assembled:
        return [OrderStatus.Sent];
      case OrderStatus.Sent:
        return [OrderStatus.Finished];
      default:
        return [];
    }
  };
  
  const availableTransitions = getAvailableStatusTransitions();
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-medium">
                {order.to} 
                {order.showcase && <span className="text-sm font-normal text-purple-600"> • Продан с витрины</span>}
              </h3>
              <p className="text-sm text-gray-500">{order.address}</p>
            </div>
            <StatusBadge status={order.status} pickup={order.pickup} showcase={order.showcase} />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm">
                <span className="text-gray-500">🗓 </span>
                <span>{formatDate(order.dateTime)}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">🕓 </span>
                <span>{formatTimePeriod(order)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {availableTransitions.length > 0 && (
                <div className="flex space-x-2">
                  {availableTransitions.map((status: OrderStatusType) => (
                    <Button 
                      key={status}
                      variant="outline" 
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ id: order.id, status })}
                      disabled={updateStatusMutation.isPending}
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onView && (
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="mr-2 h-4 w-4" />
                      <span>Просмотр</span>
                    </DropdownMenuItem>
                  )}
                  {onEdit && currentTab !== "completed" && (
                    // In OrderItem.tsx, modify the onEdit handler to navigate to the edit page
                    <DropdownMenuItem onClick={() => navigate(`/edit-order/${order.id}`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Редактировать</span>
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={() => {
                        if (order.id) {
                          deleteOrderMutation.mutate(order.id);
                        }
                      }}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>Удалить</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
