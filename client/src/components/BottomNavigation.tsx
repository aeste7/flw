import { useLocation } from "wouter";
import { Home, PlusCircle, ListChecks, PackageOpen, FileText } from "lucide-react";

export default function BottomNavigation() {
  const [, navigate] = useLocation();
  
  const navItems = [
    { name: "Home", icon: <Home className="h-6 w-6" />, path: "/" },
    { name: "New Order", icon: <PlusCircle className="h-6 w-6" />, path: "/new-order" },
    { name: "Orders", icon: <ListChecks className="h-6 w-6" />, path: "/active-orders" },
    { name: "Warehouse", icon: <PackageOpen className="h-6 w-6" />, path: "/warehouse" },
    { name: "Notes", icon: <FileText className="h-6 w-6" />, path: "/notes" },
  ];
  
  return (
    <footer className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="max-w-3xl mx-auto grid grid-cols-5">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center py-3 ${
              item.path === "/" ? "text-blue-600" : "text-gray-500 hover:text-blue-600"
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
