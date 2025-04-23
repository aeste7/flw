import { useState } from "react";
import { Warehouse } from "@shared/schema";
import { format } from "date-fns";
import { MoreVertical, Edit, Plus, Trash, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface FlowerItemProps {
  flower: Warehouse;
}

export default function FlowerItem({ flower }: FlowerItemProps) {
  const [, navigate] = useLocation();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form schema for editing flower
  const editFormSchema = z.object({
    flower: z.string().min(1, "Flower name is required"),
    amount: z.coerce.number().min(0, "Amount must be at least 0"),
  });
  
  // Form schema for adding more flowers
  const addFormSchema = z.object({
    amount: z.coerce.number().min(1, "Amount must be at least 1"),
  });
  
  // Form for editing
  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      flower: flower.flower,
      amount: flower.amount,
    },
  });
  
  // Form for adding more
  const addForm = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      amount: 1,
    },
  });
  
  // Format date
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "MMMM d, yyyy");
  };
  
  // Update flower mutation
  const updateFlowerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof editFormSchema>) => {
      await apiRequest('PUT', `/api/flowers/${flower.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      setShowEditModal(false);
      toast({
        title: "Success",
        description: "Flower updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update flower: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Add more flowers mutation
  const addFlowersMutation = useMutation({
    mutationFn: async (data: z.infer<typeof addFormSchema>) => {
      await apiRequest('PUT', `/api/flowers/${flower.id}`, { 
        amount: flower.amount + data.amount 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      setShowAddModal(false);
      toast({
        title: "Success",
        description: "Flowers added successfully",
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
  
  // Handle edit form submission
  const onSubmitEdit = (values: z.infer<typeof editFormSchema>) => {
    updateFlowerMutation.mutate(values);
  };
  
  // Handle add form submission
  const onSubmitAdd = (values: z.infer<typeof addFormSchema>) => {
    addFlowersMutation.mutate(values);
  };
  
  // Writeoff mutation
  const writeoffMutation = useMutation({
    mutationFn: async ({ flowerId, amount }: { flowerId: number, amount: number }) => {
      await apiRequest('POST', '/api/writeoffs', { 
        flower: flower.flower,
        amount: amount
      });
      
      // Update flower inventory by subtracting the amount
      await apiRequest('PUT', `/api/flowers/${flowerId}`, { 
        amount: Math.max(0, flower.amount - amount)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/writeoffs'] });
      setShowContextMenu(false);
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
  
  // State for write-off form
  const [showWriteOffModal, setShowWriteOffModal] = useState(false);
  const [writeOffAmount, setWriteOffAmount] = useState(1);
  
  // Handle write-off
  const handleWriteOff = () => {
    setShowContextMenu(false);
    setWriteOffAmount(1); // Reset to 1
    setShowWriteOffModal(true);
  };
  
  // Handle write-off submission
  const handleWriteOffSubmit = () => {
    if (writeOffAmount <= 0 || writeOffAmount > flower.amount) return;
    
    writeoffMutation.mutate({ 
      flowerId: flower.id, 
      amount: writeOffAmount
    });
    setShowWriteOffModal(false);
  };
  
  // Handle write-off all
  const handleWriteOffAll = () => {
    setShowContextMenu(false);
    if (flower.amount > 0) {
      writeoffMutation.mutate({ 
        flowerId: flower.id, 
        amount: flower.amount
      });
    }
  };
  
  return (
    <>
      <div className="p-4 flex justify-between items-center hover:bg-gray-50">
        <div>
          <h3 className="font-medium">{flower.flower}</h3>
          <p className="text-sm text-gray-500">Last updated: {formatDate(flower.dateTime)}</p>
        </div>
        <div className="flex items-center">
          <span className="text-lg font-semibold mr-3">{flower.amount}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-400 hover:text-gray-500"
            onClick={() => setShowContextMenu(true)}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Context Menu Dialog */}
      <Dialog open={showContextMenu} onOpenChange={setShowContextMenu}>
        <DialogContent className="p-0 sm:max-w-[350px]">
          <DialogHeader className="py-3 px-4 border-b border-gray-200">
            <DialogTitle>{flower.flower}</DialogTitle>
          </DialogHeader>
          
          <div className="divide-y divide-gray-200">
            <Button 
              variant="ghost" 
              className="w-full text-left py-3 px-4 justify-start rounded-none"
              onClick={() => {
                setShowContextMenu(false);
                setShowEditModal(true);
              }}
            >
              <Edit className="h-5 w-5 text-gray-400 mr-3" />
              <span>Edit</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-left py-3 px-4 justify-start rounded-none"
              onClick={() => {
                setShowContextMenu(false);
                setShowAddModal(true);
              }}
            >
              <Plus className="h-5 w-5 text-gray-400 mr-3" />
              <span>Add More</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-left py-3 px-4 justify-start rounded-none"
              onClick={handleWriteOff}
              disabled={flower.amount === 0 || writeoffMutation.isPending}
            >
              <Trash className="h-5 w-5 text-gray-400 mr-3" />
              <span>Write-Off</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-left py-3 px-4 justify-start rounded-none text-red-500"
              onClick={handleWriteOffAll}
              disabled={flower.amount === 0 || writeoffMutation.isPending}
            >
              <Trash2 className="h-5 w-5 text-red-500 mr-3" />
              <span>Write-Off All</span>
            </Button>
          </div>
          
          <div className="py-3 px-4 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full text-center text-gray-500 font-medium"
              onClick={() => setShowContextMenu(false)}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Flower Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Flower</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="flower"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flower Type</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateFlowerMutation.isPending}>
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Add More Flowers Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add More Flowers</DialogTitle>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onSubmitAdd)} className="space-y-4">
              <div>
                <Label>Flower Type</Label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {flower.flower}
                </div>
              </div>
              
              <FormField
                control={addForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount to Add</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addFlowersMutation.isPending}>
                  Add to Inventory
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Write-Off Modal */}
      <Dialog open={showWriteOffModal} onOpenChange={setShowWriteOffModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write-Off Flowers</DialogTitle>
            <DialogDescription>
              Specify the amount of flowers to write off from inventory.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Flower Type</Label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {flower.flower}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="writeOffAmount">Amount to Write-Off</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  id="writeOffAmount"
                  type="number"
                  min={1}
                  max={flower.amount}
                  value={writeOffAmount}
                  onChange={(e) => setWriteOffAmount(parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <span className="text-sm text-gray-500">
                  / {flower.amount} available
                </span>
              </div>
              {writeOffAmount > flower.amount && (
                <p className="text-sm text-red-500">Cannot write off more than available amount</p>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowWriteOffModal(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={handleWriteOffSubmit}
                disabled={writeOffAmount <= 0 || writeOffAmount > flower.amount || writeoffMutation.isPending}
              >
                {writeoffMutation.isPending ? "Processing..." : "Write-Off"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
