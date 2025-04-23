import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";

interface AddExerciseTypeDialogProps {
  onSuccess?: (exerciseType: { id: number; name: string }) => void;
  trigger?: React.ReactNode;
}

export function AddExerciseTypeDialog({
  onSuccess,
  trigger,
}: AddExerciseTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Create mutation for adding a new exercise type
  const createExerciseTypeMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      category: string | null;
      description: string | null;
      notes: string | null;
    }) => {
      const response = await fetch("/api/exercise-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create exercise type");
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Exercise type added successfully",
      });

      if (onSuccess && data) {
        onSuccess({ id: data.id, name: data.name });
      }
      
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error adding exercise type:", error);
      toast({
        title: "Error",
        description: "Failed to add exercise type",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const name = formData.get("name") as string;
    const category = formData.get("category") as string;
    const description = formData.get("description") as string;
    const notes = formData.get("notes") as string;
    
    if (!name) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    createExerciseTypeMutation.mutate({
      name,
      category: category || null,
      description: description || null,
      notes: notes || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="gap-1">
            <PlusCircle className="h-4 w-4" />
            <span>Add Exercise Type</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Exercise Type</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1">
            <label htmlFor="name" className="text-sm font-medium">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              name="name"
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <input
              id="category"
              name="category"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="e.g., Chest, Legs, Back"
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Brief description of the exercise"
              rows={3}
            />
          </div>
          
          <div className="space-y-1">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Any additional notes or tips"
              rows={3}
            />
          </div>
          
          <DialogFooter className="mt-6 gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createExerciseTypeMutation.isPending}
            >
              {createExerciseTypeMutation.isPending
                ? "Adding..."
                : "Add Exercise Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
