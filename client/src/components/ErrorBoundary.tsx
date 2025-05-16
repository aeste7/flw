import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-4">Что-то пошло не так</h2>
          <p className="mb-4 text-gray-600">Произошла ошибка при загрузке данных.</p>
          <Button 
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
          >
            Обновить страницу
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;