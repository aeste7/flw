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
  
  // Query for flowers
  const { data: flowers = [], isLoading } = useQuery<WarehouseType[]>({
    queryKey: ['/api/flowers'],
  });
  
  // Query for writeoffs
  const { data: writeoffs = [], isLoading: isWriteoffsLoading } = useQuery<WriteoffType[]>({
    queryKey: ['/api/writeoffs'],
  });
  
  // Form schema
  const formSchema = z.object({
    flower: z.string().min(1, "Flower type is required"),
    flowerType: z.string().optional(),
    amount: z.coerce.number().min(1, "Amount must be at least 1"),
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
        title: "Success",
        description: "Flowers added to inventory",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add flowers: ${error.message}`,
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
        title: "Success",
        description: "Flowers written off successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to write off flowers: ${error.message}`,
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
        <h2 className="text-lg font-medium">Flower Inventory</h2>
        <Button
          onClick={() => setShowAddFlowerModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          Add Flowers
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full rounded-none mb-4">
          <TabsTrigger value="available">Available</TabsTrigger>
          <TabsTrigger value="writeoff">Write Off</TabsTrigger>
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
            ) : flowers.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No flowers in inventory. Add some flowers to get started.
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
            <h3 className="text-base font-medium">Write-Off History</h3>
            
            <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  disabled={writeoffs.length === 0}
                >
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the write-off history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      // In a real app, you'd call an API to clear history
                      toast({
                        title: "Not Implemented",
                        description: "This feature is not yet implemented.",
                      });
                      setShowClearConfirm(false);
                    }}
                  >
                    Delete
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
              No write-off history to display.
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
                        -{writeoff.amount} pcs
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
            <DialogTitle>Add Flowers to Inventory</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="flower"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flower Type</FormLabel>
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
                        <SelectItem value="add_new">Add new type...</SelectItem>
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
                      <FormLabel>New Flower Type</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter new flower type" {...field} />
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
                    <FormLabel>Amount</FormLabel>
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
                  Add to Inventory
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
