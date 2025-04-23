import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus, Warehouse } from "@shared/schema";
import { useLocation } from "wouter";
import { Home as HomeIcon, PlusCircle, ListChecks, PackageOpen, FileText } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  
  // Query for orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });
  
  // Count orders by status
  const newOrders = orders.filter(order => order.status === OrderStatus.New).length;
  const assembledOrders = orders.filter(order => order.status === OrderStatus.Assembled).length;
  const sentOrders = orders.filter(order => order.status === OrderStatus.Sent).length;
  
  const menuItems = [
    { name: "New Order", icon: <PlusCircle className="h-10 w-10 text-blue-500 mb-2" />, path: "/new-order" },
    { name: "Active Orders", icon: <ListChecks className="h-10 w-10 text-amber-500 mb-2" />, path: "/active-orders" },
    { name: "Warehouse", icon: <PackageOpen className="h-10 w-10 text-emerald-500 mb-2" />, path: "/warehouse" },
    { name: "Notes", icon: <FileText className="h-10 w-10 text-indigo-500 mb-2" />, path: "/notes" },
  ];
  
  return (
    <section className="max-w-3xl mx-auto p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        {menuItems.map((item) => (
          <Button
            key={item.name}
            variant="outline"
            className="flex flex-col items-center justify-center p-6 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow h-auto"
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            <span className="font-medium">{item.name}</span>
          </Button>
        ))}
      </div>
      
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Today's Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex items-center">
              <div className="bg-blue-500 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                {newOrders}
              </div>
              <span className="ml-3">New Orders</span>
            </div>
            <Button 
              variant="link" 
              className="text-blue-600"
              onClick={() => navigate("/active-orders")}
            >
              View
            </Button>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-amber-50 rounded-md border border-amber-100">
            <div className="flex items-center">
              <div className="bg-amber-500 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                {assembledOrders}
              </div>
              <span className="ml-3">Assembled Orders</span>
            </div>
            <Button 
              variant="link" 
              className="text-amber-600"
              onClick={() => navigate("/active-orders")}
            >
              View
            </Button>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-md border border-emerald-100">
            <div className="flex items-center">
              <div className="bg-emerald-500 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                {sentOrders}
              </div>
              <span className="ml-3">Sent for Delivery</span>
            </div>
            <Button 
              variant="link" 
              className="text-emerald-600"
              onClick={() => navigate("/active-orders?tab=delivery")}
            >
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
