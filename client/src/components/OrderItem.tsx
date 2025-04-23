import { Order, OrderItem as OrderItemType, OrderStatus } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderItemProps {
  order: Order;
  onView?: () => void;
  onEdit?: () => void;
}

export default function OrderItem({ order, onView, onEdit }: OrderItemProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      await apiRequest('PUT', `/api/orders/${order.id}/status`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Updated",
        description: `Order #${order.id} status updated successfully`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update order: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  const handleMarkAssembled = () => {
    updateStatusMutation.mutate(OrderStatus.Assembled);
  };
  
  const handleSendToDelivery = () => {
    updateStatusMutation.mutate(OrderStatus.Sent);
  };
  
  const handleMarkDelivered = () => {
    updateStatusMutation.mutate(OrderStatus.Finished);
  };
  
  const handleDelete = () => {
    updateStatusMutation.mutate(OrderStatus.Deleted);
  };
  
  // Style based on status
  const getCardStyle = () => {
    switch (order.status) {
      case OrderStatus.New:
        return "border-blue-200";
      case OrderStatus.Assembled:
        return "bg-amber-50 border-amber-200";
      case OrderStatus.Sent:
        return "bg-emerald-50 border-emerald-200";
      case OrderStatus.Finished:
        return "bg-teal-50 border-teal-200";
      default:
        return "";
    }
  };
  
  // Footer style based on status
  const getFooterStyle = () => {
    switch (order.status) {
      case OrderStatus.Assembled:
        return "bg-amber-50 border-t border-amber-200";
      case OrderStatus.Sent:
        return "bg-emerald-50 border-t border-emerald-200";
      case OrderStatus.Finished:
        return "bg-teal-50 border-t border-teal-200";
      default:
        return "bg-gray-50";
    }
  };
  
  const formatDateTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return format(date, "h:mm a");
  };
  
  return (
    <Card className={cn("overflow-hidden shadow-sm", getCardStyle())}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-medium">Order #{order.id}</h4>
          </div>
          <StatusBadge status={order.status as OrderStatus} />
        </div>
        
        <div className="mt-3 text-sm">
          <div className="flex">
            <span className="text-gray-500 w-16">From:</span>
            <span>{order.from}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 w-16">To:</span>
            <span>{order.to}</span>
          </div>
          <div className="flex">
            <span className="text-gray-500 w-16">Time:</span>
            <span>{formatDateTime(order.dateTime)}</span>
          </div>
          {(order.status === OrderStatus.Sent || order.status === OrderStatus.Finished) && (
            <div className="flex">
              <span className="text-gray-500 w-16">Address:</span>
              <span className="flex-1">{order.address}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className={cn("px-4 py-3 flex justify-end space-x-2", getFooterStyle())}>
        {onView && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-blue-600 hover:text-blue-800"
            onClick={onView}
          >
            View
          </Button>
        )}
        
        {order.status === OrderStatus.New && (
          <>
            <Button 
              variant="link" 
              size="sm" 
              className="text-amber-600 hover:text-amber-800"
              onClick={handleMarkAssembled}
              disabled={updateStatusMutation.isPending}
            >
              Mark Assembled
            </Button>
            
            {onEdit && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-gray-600 hover:text-gray-800"
                onClick={onEdit}
              >
                Edit
              </Button>
            )}
          </>
        )}
        
        {order.status === OrderStatus.Assembled && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-emerald-600 hover:text-emerald-800"
            onClick={handleSendToDelivery}
            disabled={updateStatusMutation.isPending}
          >
            Send to Delivery
          </Button>
        )}
        
        {order.status === OrderStatus.Sent && (
          <Button 
            variant="link" 
            size="sm" 
            className="text-teal-600 hover:text-teal-800"
            onClick={handleMarkDelivered}
            disabled={updateStatusMutation.isPending}
          >
            Mark as Delivered
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
