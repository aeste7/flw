import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import NewOrder from "@/pages/NewOrder";
import EditOrder from "./pages/EditOrder";
import ActiveOrders from "@/pages/ActiveOrders";
import Warehouse from "@/pages/Warehouse";
import Notes from "@/pages/Notes";
import WriteOff from "@/pages/WriteOff";
import Bouquets from "@/pages/Bouquets";
import NewBouquet from "@/pages/NewBouquet";
import BouquetDetail from "@/pages/BouquetDetail";
import Layout from "@/components/Layout";
import { ThemeProvider } from "next-themes";
import { useEffect } from "react";


function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/new-order" component={NewOrder} />
        <Route path="/active-orders" component={ActiveOrders} />
        <Route path="/warehouse" component={Warehouse} />
        <Route path="/notes" component={Notes} />
        <Route path="/write-off/:id" component={WriteOff} />
        <Route path="/edit-order/:id" component={EditOrder} />
        <Route path="/bouquets" component={Bouquets} />
        <Route path="/new-bouquet" component={NewBouquet} />
        <Route path="/bouquet/:id" component={BouquetDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  useEffect(() => {
    // Set HTML lang attribute to force 24-hour time format
    document.documentElement.lang = 'en-GB'; // Use a locale that defaults to 24h format
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
