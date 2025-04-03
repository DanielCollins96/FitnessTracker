import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Pencil, Trash, FileText, BookOpen, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

// Form schema for exercise type
const exerciseTypeSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
});

type ExerciseTypeValues = z.infer<typeof exerciseTypeSchema>;

// Exercise type interface
interface ExerciseType {
  id: number;
  name: string;
  description: string | null;
  notes: string | null;
  category: string | null;
  created: string;
}

export default function Exercises() {
  const [activeTab, setActiveTab] = useState("list");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExerciseType, setSelectedExerciseType] = useState<ExerciseType | null>(null);
  const { toast } = useToast();

  // Fetch exercise types
  const { data: exerciseTypes, isLoading } = useQuery<ExerciseType[]>({
    queryKey: ['/api/exercise-types'],
  });

  // Form for adding/editing exercise types
  const form = useForm<ExerciseTypeValues>({
    resolver: zodResolver(exerciseTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      notes: "",
      category: "",
    },
  });

  // Create exercise type mutation
  const createExerciseType = useMutation({
    mutationFn: (data: ExerciseTypeValues) => 
      apiRequest("POST", "/api/exercise-types", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exercise type created successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-types'] });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create exercise type. Please try again.",
        variant: "destructive",
      });
      console.error("Error creating exercise type:", error);
    },
  });

  // Update exercise type mutation
  const updateExerciseType = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ExerciseTypeValues }) => 
      apiRequest("PUT", `/api/exercise-types/${id}`, data),
    onSuccess: (_, { data }) => {
      toast({
        title: "Success",
        description: "Exercise type updated successfully!",
        variant: "default",
      });
      
      // Invalidate all relevant caches that might contain the old exercise name
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-with-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-sets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      
      setIsEditDialogOpen(false);
      setSelectedExerciseType(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update exercise type. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating exercise type:", error);
    },
  });

  // Delete exercise type mutation
  const deleteExerciseType = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/exercise-types/${id}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Exercise type deleted successfully!",
        variant: "default",
      });
      
      // Invalidate all relevant caches
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-types'] });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-with-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-latest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-workouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-history'] });
      queryClient.invalidateQueries({ queryKey: ['/api/exercise-sets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      
      setIsDeleteDialogOpen(false);
      setSelectedExerciseType(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete exercise type. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting exercise type:", error);
    },
  });

  // Handle form submission for adding exercise type
  const onSubmit = (data: ExerciseTypeValues) => {
    createExerciseType.mutate(data);
  };

  // Handle form submission for editing exercise type
  const onEdit = (data: ExerciseTypeValues) => {
    if (selectedExerciseType) {
      updateExerciseType.mutate({ id: selectedExerciseType.id, data });
    }
  };

  // Open edit dialog and set form values
  const handleEdit = (exerciseType: ExerciseType) => {
    setSelectedExerciseType(exerciseType);
    form.setValue("name", exerciseType.name);
    form.setValue("description", exerciseType.description || "");
    form.setValue("notes", exerciseType.notes || "");
    form.setValue("category", exerciseType.category || "");
    setIsEditDialogOpen(true);
  };

  // Open delete dialog
  const handleDelete = (exerciseType: ExerciseType) => {
    setSelectedExerciseType(exerciseType);
    setIsDeleteDialogOpen(true);
  };

  // Open view details tab
  const handleViewDetails = (exerciseType: ExerciseType) => {
    setSelectedExerciseType(exerciseType);
    setActiveTab("detail");
  };

  // Reset form when opening add dialog
  const handleAddDialog = () => {
    form.reset();
    setIsAddDialogOpen(true);
  };

  // Group exercise types by category
  const exerciseTypesByCategory: Record<string, ExerciseType[]> = {};
  
  if (exerciseTypes) {
    exerciseTypes.forEach(exerciseType => {
      const category = exerciseType.category || "Uncategorized";
      if (!exerciseTypesByCategory[category]) {
        exerciseTypesByCategory[category] = [];
      }
      exerciseTypesByCategory[category].push(exerciseType);
    });
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Exercise Library</h2>
          <Button onClick={handleAddDialog} size="sm" className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Exercise
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="list">All Exercises</TabsTrigger>
            <TabsTrigger value="detail" disabled={!selectedExerciseType}>Exercise Details</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
                <Skeleton className="h-14 w-full rounded-md" />
              </div>
            ) : exerciseTypes && exerciseTypes.length > 0 ? (
              Object.keys(exerciseTypesByCategory).sort().map(category => (
                <div key={category} className="mb-6">
                  <h3 className="text-md font-medium text-gray-700 mb-2">{category}</h3>
                  <div className="space-y-3">
                    {exerciseTypesByCategory[category].map(exerciseType => (
                      <Card key={exerciseType.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-base font-medium">{exerciseType.name}</h4>
                            {exerciseType.description && (
                              <p className="text-sm text-gray-500 line-clamp-1">{exerciseType.description}</p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(exerciseType)}>
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(exerciseType)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(exerciseType)}>
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 mb-4">No exercise types have been added yet.</p>
                <Button onClick={handleAddDialog}>Add Your First Exercise</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="detail">
            {selectedExerciseType && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold">{selectedExerciseType.name}</h3>
                      {selectedExerciseType.category && (
                        <Badge variant="secondary" className="mt-1">
                          {selectedExerciseType.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(selectedExerciseType)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedExerciseType)}>
                        <Trash className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {selectedExerciseType.description && (
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                      <p className="text-gray-700">{selectedExerciseType.description}</p>
                    </div>
                  )}

                  {selectedExerciseType.notes && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">
                        <BookOpen className="h-4 w-4 inline mr-1" />
                        Form Notes
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-md text-gray-700">
                        <p>{selectedExerciseType.notes}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <Button variant="outline" onClick={() => setActiveTab("list")}>
                      Back to List
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Add Exercise Type Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Exercise Type</DialogTitle>
              <DialogDescription>
                Create a new exercise type with detailed information.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bench Press" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Chest, Legs, Back" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the exercise" 
                          className="resize-none" 
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Notes on proper form and technique" 
                          className="resize-none" 
                          rows={4}
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
                    className="w-full"
                    disabled={createExerciseType.isPending}
                  >
                    {createExerciseType.isPending ? "Creating..." : "Add Exercise Type"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Exercise Type Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Exercise Type</DialogTitle>
              <DialogDescription>
                Update the exercise type details.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name*</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="resize-none" 
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Form Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          className="resize-none" 
                          rows={4}
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
                    className="w-full"
                    disabled={updateExerciseType.isPending}
                  >
                    {updateExerciseType.isPending ? "Updating..." : "Update Exercise Type"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the exercise type "{selectedExerciseType?.name}". 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => selectedExerciseType && deleteExerciseType.mutate(selectedExerciseType.id)}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleteExerciseType.isPending ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}