import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import NewOrder from "@/pages/NewOrder";
import ActiveOrders from "@/pages/ActiveOrders";
import Warehouse from "@/pages/Warehouse";
import Notes from "@/pages/Notes";
import WriteOff from "@/pages/WriteOff";
import Layout from "@/components/Layout";
import { ThemeProvider } from "next-themes";

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
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
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
