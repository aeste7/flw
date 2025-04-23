import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Note } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NoteItem from "@/components/NoteItem";
import { Skeleton } from "@/components/ui/skeleton";

export default function Notes() {
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Query for notes
  const { data: notes = [], isLoading } = useQuery<Note[]>({
    queryKey: ['/api/notes'],
  });
  
  // Form schema
  const formSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
  });
  
  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
    },
  });
  
  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      await apiRequest('POST', '/api/notes', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notes'] });
      setShowAddNoteModal(false);
      form.reset();
      toast({
        title: "Success",
        description: "Note added successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to add note: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addNoteMutation.mutate(values);
  };
  
  return (
    <section className="max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Notes</h2>
        <Button
          onClick={() => setShowAddNoteModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Add Note
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeleton
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4">
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-1" />
              </div>
              <div className="bg-gray-50 px-4 py-3 flex justify-between">
                <Skeleton className="h-3 w-24" />
                <div className="space-x-2">
                  <Skeleton className="h-4 w-12 inline-block" />
                  <Skeleton className="h-4 w-12 inline-block" />
                </div>
              </div>
            </div>
          ))
        ) : notes.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">No notes yet. Add one to get started.</p>
          </div>
        ) : (
          notes.map(note => (
            <NoteItem key={note.id} note={note} />
          ))
        )}
      </div>
      
      {/* Add Note Modal */}
      <Dialog open={showAddNoteModal} onOpenChange={setShowAddNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter note title" {...field} />
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
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        rows={4} 
                        placeholder="Enter note content"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={addNoteMutation.isPending}
                >
                  Save Note
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
