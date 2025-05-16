import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Warehouse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import FlowerSelector from "@/components/FlowerSelector";
import { useLocation } from "wouter";
import { Checkbox } from "@/components/ui/checkbox";

export default function NewOrder() {
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const timeFromRef = useRef<HTMLInputElement>(null);
  const timeToRef = useRef<HTMLInputElement>(null);
  
  // Fetch available flowers
  const { data: flowers = [], isLoading } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
  });
  
  // Form schema
  const formSchema = z.object({
    from: z.string().min(1, "Укажите имя отправителя"),
    to: z.string().optional(), // Make optional
    address: z.string().optional(), // Make optional
    date: z.string().min(1, "Укажите дату доставки"),
    // Replace single time with timeFrom and timeTo
    timeFrom: z.string().min(1, "Укажите время начала доставки"),
    timeTo: z.string().min(1, "Укажите время окончания доставки"),
    notes: z.string().optional(),
    pickup: z.boolean().default(false),
  }).refine((data) => {
    // If pickup is false, then 'to' and 'address' are required
    if (!data.pickup) {
      return !!data.to && !!data.address;
    }
    return true;
  }, {
    message: "Укажите имя получателя и адрес доставки",
    path: ["to", "address"],
  }).refine((data) => {
    // Ensure timeTo is after timeFrom
    if (data.timeFrom && data.timeTo) {
      return data.timeFrom <= data.timeTo;
    }
    return true;
  }, {
    message: "Время окончания должно быть позже времени начала",
    path: ["timeTo"],
  });
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "",
      to: "",
      address: "",
      date: new Date().toISOString().split('T')[0],
      timeFrom: "",
      timeTo: "",
      notes: "",
      pickup: false, // Default to delivery
    },
  });

  // Handle flower selection
  const handleSelectFlower = (flowerId: number, amount: number) => {
    const newSelectedFlowers = new Map(selectedFlowers);
    
    if (amount === 0) {
      newSelectedFlowers.delete(flowerId);
    } else {
      newSelectedFlowers.set(flowerId, amount);
    }
    
    setSelectedFlowers(newSelectedFlowers);
  };
  
  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Convert date and times to ISO string for the base dateTime
      const dateTime = new Date(`${data.date}T${data.timeFrom}`);
      
      // Prepare order items
      const items = Array.from(selectedFlowers.entries()).map(([flowerId, amount]) => {
        const flower = flowers.find(f => f.id === flowerId);
        return {
          flower: flower?.flower || "",
          amount,
        };
      });
      
      // Check if any flowers are selected
      if (items.length === 0) {
        throw new Error("Пожалуйста, выберите хотя бы один цветок");
      }
      
      // Create order
      await apiRequest('POST', '/api/orders', {
        order: {
          from: data.from,
          to: data.pickup ? "Самовывоз" : data.to,
          address: data.pickup ? "Магазин" : data.address,
          dateTime: dateTime.toISOString(),
          timeFrom: data.timeFrom,
          timeTo: data.timeTo,
          notes: data.notes,
          pickup: data.pickup, // Include pickup field
        },
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      toast({
        title: "Новый заказ",
        description: "Заказ был успешно создан",
      });
      navigate("/active-orders");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createOrderMutation.mutate(values);
  };

    
// Add this effect to handle the time input formatting
useEffect(() => {
  const setupTimeInput = (inputElement: HTMLInputElement | null) => {
    if (!inputElement) return;
    
    inputElement.classList.add('time-input');
    
    const handleTimeInput = (e: Event) => {
      const input = e.target as HTMLInputElement;
      const cursorPosition = input.selectionStart || 0;
      let value = input.value.replace(/[^0-9:]/g, "");
      
      // If there's already a colon in the input
      if (value.includes(':')) {
        const [hours, minutes] = value.split(':');
        
        // Validate hours (0-23)
        let formattedHours = hours;
        if (parseInt(hours) > 23) formattedHours = '23';
        
        // Validate minutes (0-59)
        let formattedMinutes = minutes;
        if (minutes.length > 0 && parseInt(minutes) > 59) formattedMinutes = '59';
        
        // Combine hours and minutes
        input.value = `${formattedHours}:${formattedMinutes}`;
        
        // Restore cursor position
        const newPosition = cursorPosition + (input.value.length - value.length);
        input.setSelectionRange(newPosition, newPosition);
        
        // Update React form state
        const fieldName = input.name;
        const fieldValue = input.value;
        
        // Use form.setValue to update the form state
        if (fieldName === 'timeFrom' || fieldName === 'timeTo') {
          form.setValue(fieldName as any, fieldValue, { 
            shouldValidate: true,
            shouldDirty: true
          });
        }
        
        return;
      }
      
      // If no colon yet, but we have at least 2 digits, add a colon
      if (value.length >= 2) {
        // Validate hours
        let hours = value.substring(0, 2);
        if (parseInt(hours) > 23) hours = '23';
        
        // Format with colon
        if (value.length === 2) {
          input.value = `${hours}:`;
        } else {
          // We have minutes too
          let minutes = value.substring(2);
          if (minutes.length > 0 && parseInt(minutes) > 59) minutes = '59';
          input.value = `${hours}:${minutes}`;
        }
        
        // Restore cursor position, accounting for the added colon
        const newPosition = cursorPosition + (input.value.length - value.length);
        input.setSelectionRange(newPosition, newPosition);
        
        // Update React form state
        const fieldName = input.name;
        const fieldValue = input.value;
        
        // Use form.setValue to update the form state
        if (fieldName === 'timeFrom' || fieldName === 'timeTo') {
          form.setValue(fieldName as any, fieldValue, { 
            shouldValidate: true,
            shouldDirty: true
          });
        }
      } else {
        // Just 1 digit, no formatting needed yet
        input.value = value;
        
        // Update React form state
        const fieldName = input.name;
        const fieldValue = input.value;
        
        // Use form.setValue to update the form state
        if (fieldName === 'timeFrom' || fieldName === 'timeTo') {
          form.setValue(fieldName as any, fieldValue, { 
            shouldValidate: true,
            shouldDirty: true
          });
        }
      }
    };
    
    const handleBlur = (e: Event) => {
      const input = e.target as HTMLInputElement;
      let value = input.value.trim();
      
      // If empty, leave it empty
      if (!value) return;
      
      // If only has hours (e.g., "14:")
      if (value.endsWith(':')) {
        value = value.slice(0, -1) + ":00";
      }
      
      // If only has hours without colon (e.g., "14")
      if (!value.includes(':') && value.length <= 2) {
        value = value.padStart(2, '0') + ":00";
      }
      
      // If has hours and minutes
      if (value.includes(':')) {
        const [hours, minutes] = value.split(':');
        const formattedHours = hours.padStart(2, '0');
        const formattedMinutes = (minutes || '00').padStart(2, '0');
        value = `${formattedHours}:${formattedMinutes}`;
      }
      
      input.value = value;
      
      // Update React form state
      const fieldName = input.name;
      
      // Use form.setValue to update the form state
      if (fieldName === 'timeFrom' || fieldName === 'timeTo') {
        form.setValue(fieldName as any, value, { 
          shouldValidate: true,
          shouldDirty: true
        });
      }
    };
    
    inputElement.addEventListener("input", handleTimeInput);
    inputElement.addEventListener("blur", handleBlur);
    
    // Return cleanup function
    return () => {
      inputElement.removeEventListener("input", handleTimeInput);
      inputElement.removeEventListener("blur", handleBlur);
    };
  };
  
  // Setup both time inputs
  const cleanupTimeFrom = setupTimeInput(timeFromRef.current);
  const cleanupTimeTo = setupTimeInput(timeToRef.current);
  
  return () => {
    if (cleanupTimeFrom) cleanupTimeFrom();
    if (cleanupTimeTo) cleanupTimeTo();
  };
}, [form]); // Add form to the dependency array

  
  return (
    <section className="max-w-3xl mx-auto p-4">
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Добавление нового заказа</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <div>
                <Label htmlFor="flowers" className="block text-sm font-medium text-gray-700 mb-1">
                  Выберите цветы
                </Label>
                {isLoading ? (
                  <div className="p-4 text-center">Загружаются цветы...</div>
                ) : (
                  <FlowerSelector
                    flowers={flowers}
                    selectedFlowers={selectedFlowers}
                    onSelectFlower={handleSelectFlower}
                  />
                )}
                {selectedFlowers.size === 0 && createOrderMutation.isError && (
                  <p className="text-sm text-red-500 mt-1">Пожалуйста, выберите, пожалуйста цветы</p>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>От</FormLabel>
                    <FormControl>
                      <Input placeholder="Имя отправителя" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => {
                  // Get the pickup value from the form
                  const pickup = form.watch("pickup");
                  
                  return (
                    <FormItem>
                      <FormLabel>К</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Имя получателя" 
                          {...field} 
                          disabled={pickup}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
                            
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => {
                  // Get the pickup value from the form
                  const pickup = form.watch("pickup");
                  
                  return (
                    <FormItem>
                      <FormLabel>Адрес доставки</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={2} 
                          placeholder="Введите адрес доставки"
                          {...field} 
                          disabled={pickup}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              
              <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Дата и время доставки
              </Label>
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                              
                <FormField
                  control={form.control}
                  name="timeFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">С</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">С</span>
                          <Input 
                            type="text" // Change to text for custom handling
                            {...field} 
                            ref={timeFromRef}
                            className="time-input"
                            placeholder="HH:MM"
                            maxLength={5}
                            name="timeFrom" // Ensure name attribute is set
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">До</FormLabel>
                      <FormControl>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-500 mr-2">До</span>
                          <Input 
                            type="text" // Change to text for custom handling
                            {...field} 
                            ref={timeToRef}
                            className="time-input"
                            placeholder="HH:MM"
                            maxLength={5}
                            name="timeTo" // Ensure name attribute is set
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </div>
                            
              {/* Add pickup checkbox */}
              <FormField
                control={form.control}
                name="pickup"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Самовывоз
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Клиент заберет заказ сам из магазина
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заметки</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3} 
                        placeholder="Дополнительные указания и заметки"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={createOrderMutation.isPending}
              >
                Создать заказ
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
