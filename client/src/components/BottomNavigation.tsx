import { useLocation } from "wouter";
import { Home, PlusCircle, ListChecks, PackageOpen, FileText } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query"; // Add this import

export default function BottomNavigation() {
  const [location, navigate] = useLocation();
  const queryClient = useQueryClient(); // Add this hook
  
  // Create a custom navigation function for the warehouse page
  const navigateToWarehouse = async () => {
    // Force refetch flowers data before navigation
    await queryClient.refetchQueries({ queryKey: ['/api/flowers'] });
    navigate("/warehouse");
  };
  
  const navItems = [
    { name: "Домашняя", icon: <Home className="h-6 w-6" />, path: "/" },
    { name: "Новый заказ", icon: <PlusCircle className="h-6 w-6" />, path: "/new-order" },
    { name: "Активные заказы", icon: <ListChecks className="h-6 w-6" />, path: "/active-orders" },
    { name: "Склад", icon: <PackageOpen className="h-6 w-6" />, path: "/warehouse", customNavigate: navigateToWarehouse },
    { name: "Заметки", icon: <FileText className="h-6 w-6" />, path: "/notes" },
  ];
  
  return (
    <footer className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-3xl mx-auto grid grid-cols-5">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => {
              if (item.customNavigate) {
                item.customNavigate();
              } else {
                navigate(item.path);
              }
            }}
            className={`flex flex-col items-center justify-center py-3 ${
              location === item.path ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.name}</span>
          </button>
        ))}
      </div>
    </footer>
  );
}
