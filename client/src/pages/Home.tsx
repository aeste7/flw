import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order, OrderStatus, Bouquet } from "@shared/schema";
import { useLocation } from "wouter";
import { Home as HomeIcon, PlusCircle, ListChecks, PackageOpen, FileText, Plus, Flower } from "lucide-react";

export default function Home() {
  const [, navigate] = useLocation();
  
  // Query for orders
  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
  });

  // Query for bouquets
  const { data: bouquets = [] } = useQuery<Bouquet[]>({
    queryKey: ['/api/bouquets'],
  });
  
  // Count orders by status
  const newOrders = orders.filter(order => order.status === OrderStatus.New).length;
  const assembledOrders = orders.filter(order => order.status === OrderStatus.Assembled).length;
  const sentOrders = orders.filter(order => order.status === OrderStatus.Sent).length;
  
  const menuItems = [
    { name: "Новый заказ", icon: <PlusCircle className="h-10 w-10 text-blue-500 mb-2" />, path: "/new-order" },
    { name: "Активные заказы", icon: <ListChecks className="h-10 w-10 text-amber-500 mb-2" />, path: "/active-orders" },
    { name: "Витрина", icon: <Flower className="h-10 w-10 text-pink-500 mb-2" />, path: "/bouquets" },
    { name: "Склад", icon: <PackageOpen className="h-10 w-10 text-emerald-500 mb-2" />, path: "/warehouse" },
    { name: "Заметки", icon: <FileText className="h-10 w-10 text-indigo-500 mb-2" />, path: "/notes" },
  ];
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  return (
    <section className="max-w-3xl mx-auto p-4">
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Витрина</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => navigate("/new-bouquet")}
            >
              <Plus className="h-4 w-4" />
              Добавить букет
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {bouquets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Нет букетов</p>
                <p className="text-sm">Создайте первый букет из цветов со склада</p>
              </div>
            ) : (
              bouquets.slice(0, 5).map((bouquet) => (
                <div
                  key={bouquet.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      Букет #{bouquet.id}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {bouquet.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(bouquet.dateTime)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/bouquet/${bouquet.id}`)}
                  >
                    Просмотр
                  </Button>
                </div>
              ))
            )}
            {bouquets.length > 5 && (
              <div className="text-center pt-2">
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => navigate("/bouquets")}
                >
                  Показать все букеты ({bouquets.length})
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      

      
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">На сегодня</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-md border border-blue-100">
            <div className="flex items-center">
              <div className="bg-blue-500 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                {newOrders}
              </div>
              <span className="ml-3">Новые заказы</span>
            </div>
            <Button 
              variant="link" 
              className="text-blue-600"
              onClick={() => navigate("/active-orders")}
            >
              Просмотреть
            </Button>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-amber-50 rounded-md border border-amber-100">
            <div className="flex items-center">
              <div className="bg-amber-500 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                {assembledOrders}
              </div>
              <span className="ml-3">Собранные заказы</span>
            </div>
            <Button 
              variant="link" 
              className="text-amber-600"
              onClick={() => navigate("/active-orders")}
            >
              Просмотреть
            </Button>
          </div>
          
          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-md border border-emerald-100">
            <div className="flex items-center">
              <div className="bg-emerald-500 h-8 w-8 rounded-full flex items-center justify-center text-white font-medium">
                {sentOrders}
              </div>
              <span className="ml-3">На доставке</span>
            </div>
            <Button 
              variant="link" 
              className="text-emerald-600"
              onClick={() => navigate("/active-orders?tab=delivery")}
            >
              Просмотреть
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
