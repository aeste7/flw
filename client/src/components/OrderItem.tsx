import { Order, OrderStatus } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
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
}

export default function OrderItem({ order, onView, onEdit, onDelete }: OrderItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  
  // Format date for display
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return format(date, "h:mm a");
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
  
  // Handle status change
  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ id: order.id, status });
  };
  
  // Determine available status transitions based on current status
  const getAvailableStatusTransitions = () => {
    switch (order.status) {
      case OrderStatus.New:
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
                {order.to} {order.pickup && "• Самовывоз"}
              </h3>
              <p className="text-sm text-gray-500">{order.address}</p>
            </div>
            <StatusBadge status={order.status} pickup={order.pickup} />
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm">
              <span className="text-gray-500">Время: </span>
              <span>{formatDate(order.dateTime)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              {availableTransitions.length > 0 && (
                <div className="flex space-x-2">
                  {availableTransitions.map((status) => (
                    <Button 
                      key={status}
                      variant="outline" 
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                      disabled={updateStatusMutation.isPending}
                    >
                      {status === OrderStatus.Assembled && "Собран"}
                      {status === OrderStatus.Sent && "В доставке"}
                      {status === OrderStatus.Finished && "Доставлен"}
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
                  {onEdit && (
                    // In OrderItem.tsx, modify the onEdit handler to navigate to the edit page
                    <DropdownMenuItem onClick={() => navigate(`/edit-order/${order.id}`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Редактировать</span>
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem 
                      onClick={onDelete}
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
