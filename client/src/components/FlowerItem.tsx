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
    flower: z.string().min(1, "Укажите название цветка"),
    amount: z.coerce.number().min(0, "Количество должно быть не менее 0"),
  });
  
  // Form schema for adding more flowers
  const addFormSchema = z.object({
    amount: z.coerce.number().min(1, "Количество должно быть как минимум, 1"),
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
        title: "Успешно",
        description: "Информация была обновлена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось обновить информацию: ${error.message}`,
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
        title: "Успешно",
        description: "Цветы были добавлены",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось добавить цветы: ${error.message}`,
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
        title: "Успешно",
        description: "Цветы были списаны",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `не удалось списать цветы: ${error.message}`,
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
  console.log("Writing off all flowers:", flower);
  
  // If amount is 0, skip the writeoff record and just delete the flower
  if (flower.amount === 0) {
    console.log("Amount is 0, skipping writeoff record and deleting flower directly");
    
    apiRequest('DELETE', `/api/flowers/${flower.id}`)
      .then((response) => {
        console.log("Delete response:", response);
        
        queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
        
        toast({
          title: "Успешно",
          description: "Цветы были полностью удалены из инвентаря",
        });
      })
      .catch(error => {
        console.error("Error deleting flower:", error);
        
        toast({
          title: "Ошибка",
          description: `Не удалось удалить цветы: ${error.message}`,
          variant: "destructive",
        });
      });
  } else {
    // If amount > 0, create a writeoff record first, then delete the flower
    console.log("Creating writeoff record for", flower.amount, "flowers");
    
    apiRequest('POST', '/api/writeoffs', { 
      flower: flower.flower,
      amount: flower.amount
    }).then((response) => {
      console.log("Writeoff response:", response);
      
      // Then delete the flower from inventory
      console.log("Attempting to delete flower with ID:", flower.id);
      return apiRequest('DELETE', `/api/flowers/${flower.id}`);
    }).then((response) => {
      console.log("Delete response:", response);
      
      queryClient.invalidateQueries({ queryKey: ['/api/flowers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/writeoffs'] });
      
      toast({
        title: "Успешно",
        description: "Цветы были полностью удалены из инвентаря",
      });
    }).catch(error => {
      console.error("Error in handleWriteOffAll:", error);
      
      toast({
        title: "Ошибка",
        description: `Не удалось удалить цветы: ${error.message}`,
        variant: "destructive",
      });
    });
  }
};





  
  return (
    <>
      <div className="p-4 flex justify-between items-center hover:bg-gray-50">
        <div>
          <h3 className="font-medium">{flower.flower}</h3>
          <p className="text-sm text-gray-500">Обновлено: {formatDate(flower.dateTime)}</p>
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
              <span>Редактировать</span>
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
              <span>Добавить</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-left py-3 px-4 justify-start rounded-none"
              onClick={handleWriteOff}
              disabled={flower.amount === 0 || writeoffMutation.isPending}
            >
              <Trash className="h-5 w-5 text-gray-400 mr-3" />
              <span>Списать</span>
            </Button>
            
            <Button 
              variant="ghost" 
              className="w-full text-left py-3 px-4 justify-start rounded-none text-red-500"
              onClick={handleWriteOffAll}
              // disabled={flower.amount === 0 || writeoffMutation.isPending}
            >
              <Trash2 className="h-5 w-5 text-red-500 mr-3" />
              <span>Удалить</span>
            </Button>
          </div>
          
          <div className="py-3 px-4 border-t border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full text-center text-gray-500 font-medium"
              onClick={() => setShowContextMenu(false)}
            >
              Отмена
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Flower Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать цветы</DialogTitle>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="flower"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Вид цветка</FormLabel>
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
                    <FormLabel>Количество</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateFlowerMutation.isPending}>
                  Сохранить изменения
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
            <DialogTitle>Добавить цветы</DialogTitle>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onSubmitAdd)} className="space-y-4">
              <div>
                <Label>Вид цветов</Label>
                <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                  {flower.flower}
                </div>
              </div>
              
              <FormField
                control={addForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Добавить количество</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={addFlowersMutation.isPending}>
                  Добавить на склад
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
            <DialogTitle>Списание цветов</DialogTitle>
            <DialogDescription>
              Укажите количество для списания.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Вид цветов</Label>
              <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                {flower.flower}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="writeOffAmount">Количество к списанию</Label>
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
                  / {flower.amount} доступно
                </span>
              </div>
              {writeOffAmount > flower.amount && (
                <p className="text-sm text-red-500">Невозможно списать более, чем доступно</p>
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
                {writeoffMutation.isPending ? "Обработка..." : "Списать"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
