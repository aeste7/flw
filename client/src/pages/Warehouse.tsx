import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Warehouse as WarehouseType, Writeoff as WriteoffType } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FlowerItem from "@/components/FlowerItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Warehouse() {
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "available");
  const [, navigate] = useLocation();
  const [showAddFlowerModal, setShowAddFlowerModal] = useState(false);
  const [isAddingNewType, setIsAddingNewType] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Update URL when tab changes
  useEffect(() => {
    navigate(`/warehouse${activeTab !== "available" ? `?tab=${activeTab}` : ""}`, { replace: true });
  }, [activeTab, navigate]);
  
  // Query for available flowers - add better error handling and response parsing
  const { data: flowers = [], isLoading, error } = useQuery<WarehouseType[]>({
    queryKey: ['/api/flowers'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/flowers');
        
        if (response instanceof Response) {
          const data = await response.json();
          return Array.isArray(data) ? data : [];
        }
        
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Error fetching flowers:", error);
        throw error; // Let React Query handle the error
      }
    },
    retry: 2, // Retry failed requests up to 2 times
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });
  
  // Query for writeoffs
  const { data: writeoffs = [], isLoading: isWriteoffsLoading, refetch } = useQuery<WriteoffType[]>({
    queryKey: ['/api/writeoffs'],
  });
  
  // Form schema
  const formSchema = z.object({
    flower: z.string().min(1, "Укажите вид цветов"),
    flowerType: z.string().optional(),
    amount: z.coerce.number().min(1, "Количество должно как минимум 1"),
  });
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      flower: "",
      flowerType: "",
      amount: 1,
    },
  });
  
  // Add flower mutation
  const addFlowerMutation = useMutation({
    mutationFn: async (data: { flower: string; amount: number }) => {
      await apiRequest('POST', '/api/flowers', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      setShowAddFlowerModal(false);
      form.reset();
      setIsAddingNewType(false);
      toast({
        title: "Добавление цветов",
        description: "Цветы были успешно добавлены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Ошибка добавления цветов: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const flowerName = isAddingNewType ? values.flowerType : values.flower;
    
    if (!flowerName) {
      form.setError("flowerType", {
        type: "manual",
        message: "Flower type is required",
      });
      return;
    }
    
    addFlowerMutation.mutate({
      flower: flowerName,
      amount: values.amount,
    });
  };
  
  // Handle flower type change
  const handleFlowerTypeChange = (value: string) => {
    if (value === "add_new") {
      setIsAddingNewType(true);
      form.setValue("flower", "add_new");
    } else {
      setIsAddingNewType(false);
      form.setValue("flower", value);
    }
  };
  
  // Add writeoff mutation
  const addWriteoffMutation = useMutation({
    mutationFn: async (data: { flower: string; amount: number }) => {
      await apiRequest('POST', '/api/writeoffs', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/writeoffs'] });
      toast({
        title: "Списание цветов",
        description: "Цветы были успешно списаны",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось списать цветы: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!orderId) throw new Error("Order ID is required");
      
      // Just send the update to the server - no client-side inventory adjustments
      const orderResponse = await apiRequest('PUT', `/api/orders/${orderId}`, data);
      return orderResponse;
    },
    onSuccess: async () => {
      // Invalidate and refetch queries in sequence
      await queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      
      // Force refetch the flowers data
      await queryClient.refetchQueries({ queryKey: ['/api/flowers'] });
      
      toast({
        title: "Обновление заказа",
        description: "Заказ был успешно обновлён",
      });
      
      // Add a delay to ensure data is refreshed before navigation
      setTimeout(() => {
        navigate("/active-orders");
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить заказ, пожалуйста, повторите попытку",
        variant: "destructive",
      });
      console.error("Error updating order:", error);
    }
  });
  
  
  
  const clearWriteoffsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('DELETE', '/api/writeoffs');
    },
    onSuccess: async (data) => {
      console.log("Clear writeoffs success:", data);
      // Try multiple approaches to ensure the UI updates
      queryClient.invalidateQueries({ queryKey: ['/api/writeoffs'] });
      queryClient.refetchQueries({ queryKey: ['/api/writeoffs'] });
      await refetch(); // Directly refetch the data
      setShowClearConfirm(false);
      toast({
        title: "Очистка истории",
        description: "История списаний была успешно очищена.",
      });
    },
    onError: (error) => {
      console.error("Clear writeoffs error:", error);
      toast({
        title: "Ошибка",
        description: `Не удалось очистить историю списаний: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  

  // Format date for display
  const formatDate = (dateTime: string | Date) => {
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };

  // Handle write-off
  const handleWriteOff = (flowerId: number, flowerName: string) => {
    const flower = flowers.find(f => f.id === flowerId);
    if (!flower) return;
    
    const amount = 1; // Default to 1 for simplicity, in a real app you'd want to prompt for an amount
    
    addWriteoffMutation.mutate({
      flower: flowerName,
      amount: amount,
    });
  };
  
  return (
    <section className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Склад цветов</h2>
        <Button
          onClick={() => setShowAddFlowerModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Добавить цветы
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full rounded-none mb-4">
          <TabsTrigger value="available">Доступны</TabsTrigger>
          <TabsTrigger value="writeoff">Журнал списаний</TabsTrigger>
        </TabsList>
        
        {/* Available Tab */}
        <TabsContent value="available" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
          {isLoading ? (
            // Loading skeleton
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-500 mb-2">Ошибка загрузки данных</p>
              <Button 
                onClick={() => queryClient.refetchQueries({ queryKey: ['/api/flowers'] })}
                variant="outline"
              >
                Попробовать снова
              </Button>
            </div>
          ) : !flowers || !Array.isArray(flowers) ? (
            <div className="p-6 text-center text-gray-500">
              <p>Ошибка данных. Пожалуйста, обновите страницу.</p>
              <Button 
                onClick={() => queryClient.refetchQueries({ queryKey: ['/api/flowers'] })}
                variant="outline"
                className="mt-2"
              >
                Обновить данные
              </Button>
            </div>
          ) : flowers.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Нет доступных, добавьте новые цветы.
            </div>
          ) : (
            flowers.map(flower => (
              <FlowerItem key={flower.id} flower={flower} />
            ))
          )}
          </div>
        </TabsContent>

        
        {/* Write Off Tab */}
        <TabsContent value="writeoff" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-medium">История списания цветов</h3>
            
            <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  disabled={writeoffs.length === 0}
                >
                  Очистить историю
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Подтверждение очистки</AlertDialogTitle>
                  <AlertDialogDescription>
                    История списаний будет очищена. Подтвердите, пожалуйста.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      clearWriteoffsMutation.mutate();
                    }}
                    disabled={clearWriteoffsMutation.isPending}
                  >
                    {clearWriteoffsMutation.isPending ? "Очистка..." : "Очистить"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

          </div>
          
          {isWriteoffsLoading ? (
            // Loading skeleton
            <div className="space-y-3">
              {Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : writeoffs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              История списаний пуста.
            </div>
          ) : (
            <div className="space-y-3">
              {writeoffs.map(writeoff => (
                <Card key={writeoff.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{writeoff.flower}</h4>
                        <p className="text-sm text-gray-600">{formatDate(writeoff.dateTime)}</p>
                      </div>
                      <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-xs font-medium">
                        -{writeoff.amount} шт.
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Flower Modal */}
      <Dialog open={showAddFlowerModal} onOpenChange={setShowAddFlowerModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить цветы</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="flower"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вид цветов</FormLabel>
                    <Select
                      onValueChange={handleFlowerTypeChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select flower type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {flowers.map(flower => (
                          <SelectItem key={flower.id} value={flower.flower}>
                            {flower.flower}
                          </SelectItem>
                        ))}
                        <SelectItem value="add_new">Добавить новый вид...</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isAddingNewType && (
                <FormField
                  control={form.control}
                  name="flowerType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Новый вид цветов</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите новый вид" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={addFlowerMutation.isPending}
                >
                  Добавить цветы
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
