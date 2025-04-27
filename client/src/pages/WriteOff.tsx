import { useEffect } from "react";
import { useParams, useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Warehouse } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function WriteOff() {
  const { id } = useParams<{ id: string }>();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const writeOffAll = searchParams.get('all') === 'true';
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query for flower details
  const { data: flower, isLoading } = useQuery<Warehouse>({
    queryKey: [`/api/flowers/${id}`],
    enabled: !!id,
  });
  
  // Form schema
  const formSchema = z.object({
    amount: z.coerce.number()
      .min(1, "Минимальное количество 1 штука"),
    reason: z.string().min(1, "Укажите причину списания"),
  });
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: writeOffAll && flower ? flower.amount : 1,
      reason: "",
    },
  });
  
  // Update form when flower data loads or writeOffAll changes
  useEffect(() => {
    if (flower) {
      const maxAmount = flower.amount;
      form.setValue('amount', writeOffAll ? maxAmount : 1);
      
      // Add validation for maximum amount
      const newResolver = zodResolver(
        formSchema.refine(
          data => data.amount <= maxAmount,
          {
            message: `Не возможно списать более чем ${maxAmount} цветов`,
            path: ['amount'],
          }
        )
      );
      
      form.clearErrors();
    }
  }, [flower, writeOffAll, form]);
  
  // Write-off mutation
  const writeOffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!flower) return;
      
      await apiRequest('POST', '/api/writeoffs', {
        flower: flower.flower,
        amount: data.amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/writeoffs'] });
      toast({
        title: "Списание цветов",
        description: "Цветы были успешно списаны",
      });
      navigate("/warehouse");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось списать цветы: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!flower) return;
    
    // Check if amount is valid
    if (values.amount > flower.amount) {
      form.setError("amount", {
        type: "manual",
        message: `Не возможно списать более чем ${flower.amount} цветов`,
      });
      return;
    }
    
    writeOffMutation.mutate(values);
  };
  
  return (
    <section className="max-w-3xl mx-auto p-4">
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader>
          <CardTitle>
            Write-Off {isLoading ? "Цветов" : `${flower?.flower}`}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !flower ? (
            <div className="text-center py-4">
              <p className="text-red-500">цветы не найдены</p>
              <Button className="mt-4" onClick={() => navigate("/warehouse")}>
                Вернуть к складу
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Актуальное количество</Label>
                  <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    {flower.amount}
                  </div>
                </div>
                
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество к списанию</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          max={flower.amount}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Причина</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={2} 
                          placeholder="Укажите причину списания"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-2 justify-end pt-2">
                  <Button 
                    variant="outline"
                    onClick={() => navigate("/warehouse")}
                  >
                    Отмена
                  </Button>
                  <Button 
                    type="submit" 
                    variant="destructive"
                    disabled={writeOffMutation.isPending}
                  >
                    Списать
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
