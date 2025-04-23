import { ReactNode } from "react";
import BottomNavigation from "./BottomNavigation";
import { useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

interface HeaderTitles {
  [key: string]: string;
}

const headerTitles: HeaderTitles = {
  "/": "Bloom Manager",
  "/new-order": "New Order",
  "/active-orders": "Active Orders",
  "/warehouse": "Warehouse",
  "/notes": "Notes",
};

export default function Layout({ children }: LayoutProps) {
  const [location, navigate] = useLocation();
  
  // Extract the base route for write-off
  const baseRoute = location.startsWith('/write-off') ? '/write-off' : location;
  
  // Set title for write-off route
  if (baseRoute === '/write-off') {
    headerTitles[baseRoute] = 'Write-Off';
  }
  
  const isHome = location === "/";
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-2 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-800">
            {headerTitles[baseRoute] || "Bloom Manager"}
          </h1>
          
          {!isHome && (
            <button
              onClick={() => navigate("/")}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Go back to home"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 pt-14 pb-20">
        {children}
      </main>
      
      {/* Bottom Navigation (only on home screen) */}
      {isHome && <BottomNavigation />}
    </div>
  );
}
