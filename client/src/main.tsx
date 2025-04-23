import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { useToast } from "@/hooks/use-toast";

// Create a custom error handler to show errors in toast
window.addEventListener('error', (event) => {
  const toast = useToast();
  
  // Only show toasts in production
  if (process.env.NODE_ENV === 'production') {
    toast({
      title: "An error occurred",
      description: event.message,
      variant: "destructive",
    });
  }
  
  // Don't prevent default to allow normal error handling
  return false;
});

createRoot(document.getElementById("root")!).render(<App />);
