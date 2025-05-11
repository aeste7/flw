import { Badge } from "@/components/ui/badge";
import { OrderStatusType, OrderStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: OrderStatusType;
  pickup?: boolean; // Add pickup as an optional boolean prop
  className?: string;
}

export function StatusBadge({ status, pickup, className }: StatusBadgeProps) {
  const getStatusStyles = () => {
    switch (status) {
      case OrderStatus.New:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case OrderStatus.Assembled:
        return "bg-amber-100 text-amber-800 hover:bg-amber-100";
      case OrderStatus.Sent:
        return "bg-emerald-100 text-emerald-800 hover:bg-emerald-100";
      case OrderStatus.Finished:
        return "bg-teal-100 text-teal-800 hover:bg-teal-100";
      case OrderStatus.Deleted:
        return "bg-red-100 text-red-800 hover:bg-red-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  return (
    <div className="flex gap-2">
      <Badge 
        variant="outline" 
        className={cn(
          "rounded-full font-medium py-0.5", 
          getStatusStyles(),
          className
        )}
      >
        {status}
      </Badge>
      {pickup && (
        <Badge 
          variant="outline" 
          className="rounded-full font-medium py-0.5 bg-amber-100 text-amber-800 hover:bg-amber-100"
        >
          Самовывоз
        </Badge>
      )}
    </div>
  );
}
