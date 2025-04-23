import { useState } from "react";
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

export default function NewOrder() {
  const [selectedFlowers, setSelectedFlowers] = useState<Map<number, number>>(new Map());
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Fetch available flowers
  const { data: flowers = [], isLoading } = useQuery<Warehouse[]>({
    queryKey: ['/api/flowers'],
  });
  
  // Form schema
  const formSchema = z.object({
    from: z.string().min(1, "Sender name is required"),
    to: z.string().min(1, "Recipient name is required"),
    address: z.string().min(1, "Delivery address is required"),
    date: z.string().min(1, "Delivery date is required"),
    time: z.string().min(1, "Delivery time is required"),
    notes: z.string().optional(),
  });
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "",
      to: "",
      address: "",
      date: new Date().toISOString().split('T')[0],
      time: "",
      notes: "",
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
      // Convert date and time to ISO string
      const dateTime = new Date(`${data.date}T${data.time}`);
      
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
        throw new Error("Please select at least one flower for the order");
      }
      
      // Create order
      await apiRequest('POST', '/api/orders', {
        order: {
          from: data.from,
          to: data.to,
          address: data.address,
          dateTime: dateTime.toISOString(),
          notes: data.notes,
        },
        items,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      toast({
        title: "Success",
        description: "Order created successfully",
      });
      navigate("/active-orders");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createOrderMutation.mutate(values);
  };
  
  return (
    <section className="max-w-3xl mx-auto p-4">
      <Card className="bg-white rounded-lg shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Create New Order</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              <div>
                <Label htmlFor="flowers" className="block text-sm font-medium text-gray-700 mb-1">
                  Select Flowers
                </Label>
                {isLoading ? (
                  <div className="p-4 text-center">Loading flowers...</div>
                ) : (
                  <FlowerSelector
                    flowers={flowers}
                    selectedFlowers={selectedFlowers}
                    onSelectFlower={handleSelectFlower}
                  />
                )}
                {selectedFlowers.size === 0 && createOrderMutation.isError && (
                  <p className="text-sm text-red-500 mt-1">Please select at least one flower</p>
                )}
              </div>
              
              <FormField
                control={form.control}
                name="from"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>From (Sender)</FormLabel>
                    <FormControl>
                      <Input placeholder="Sender name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To (Recipient)</FormLabel>
                    <FormControl>
                      <Input placeholder="Recipient name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Address</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={2} 
                        placeholder="Enter delivery address"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Date & Time
                </Label>
                <div className="grid grid-cols-2 gap-3">
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
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={3} 
                        placeholder="Add any special instructions or notes"
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
                Create Order
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  );
}
