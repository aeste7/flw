import { useState } from "react";
import { Note } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

interface NoteItemProps {
  note: Note;
}

export default function NoteItem({ note }: NoteItemProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Form schema
  const formSchema = z.object({
    title: z.string().min(1, "Укажите заголовок"),
    content: z.string().min(1, "Введите содержание"),
  });
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: note.title,
      content: note.content,
    },
  });
  
  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await apiRequest('PUT', `/api/notes/${note.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setShowEditModal(false);
      toast({
        title: "Успешно",
        description: "Заметка была успешно обновлена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `не удалось обновить заметку: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/notes/${note.id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      toast({
        title: "Успешно",
        description: "Заметка была удалена",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: `Не удалось удалить заметку: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateNoteMutation.mutate(values);
  };
  
  // Handle delete
  const handleDelete = () => {
    deleteNoteMutation.mutate();
  };
  
  // Format date
  const formatDate = (date: Date | string) => {
    return format(new Date(date), "d MMMM yyyy", { locale: ru });
  };
  
  return (
    <>
      <Card className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2">{note.title}</h3>
          <p className="text-gray-600 text-sm">{note.content}</p>
        </CardContent>
        <CardFooter className="bg-gray-50 px-4 py-3 flex justify-between">
          <span className="text-xs text-gray-500">{formatDate(note.dateTime)}</span>
          <div className="space-x-2">
            <Button 
              variant="link" 
              size="sm"
              className="text-indigo-600 hover:text-indigo-800 p-0"
              onClick={() => setShowEditModal(true)}
            >
              Редактировать
            </Button>
            <Button 
              variant="link" 
              size="sm"
              className="text-red-600 hover:text-red-800 p-0"
              onClick={handleDelete}
              disabled={deleteNoteMutation.isPending}
            >
              Удалить
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Note Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать заметку</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заголовок</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Содержимое</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit" disabled={updateNoteMutation.isPending}>
                  Сохранить изменения
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
