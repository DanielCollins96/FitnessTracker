import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

// Helper function to prevent auto-selection when typing with shift key
const handleInputSelection = (e: React.SyntheticEvent, valueLength: number) => {
  const target = e.target as HTMLInputElement;
  if (target.selectionStart === 0 && target.selectionEnd === 1 && valueLength === 1) {
    // If first character is selected, immediately deselect by moving cursor to the end
    setTimeout(() => {
      target.setSelectionRange(valueLength, valueLength);
    }, 0);
  }
};

interface AddExerciseTypeDialogProps {
  onSuccess?: (exerciseType: { id: number; name: string }) => void;
  trigger?: React.ReactNode;
}

export function AddExerciseTypeDialog({ onSuccess, trigger }: AddExerciseTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  // Create mutation for adding a new exercise type
  const createExerciseTypeMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      category: string | null;
      description: string | null;
      notes: string | null;
    }) => {
      // Use a direct fetch with no caching
      const response = await fetch('/api/exercise-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache', // Prevent caching
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create exercise type');
      }
      
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Success",
        description: "Exercise type added successfully",
      });

      // Force a refetch of exercise types with a hard reset
      await queryClient.resetQueries({ queryKey: ["/api/exercise-types"], exact: true });
      
      // Call the onSuccess callback if provided after the query has been reset
      if (onSuccess && data) {
        // Slight delay to ensure the UI has updated with the new data
        setTimeout(() => {
          onSuccess({ id: data.id, name: data.name });
        }, 100);
      }

      // Reset form and close dialog
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      console.error("Error adding exercise type:", error);
      toast({
        title: "Error",
        description: "Failed to add exercise type",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  const resetForm = () => {
    setName("");
    setCategory("");
    setDescription("");
    setNotes("");
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
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name*
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              onSelect={(e) => handleInputSelection(e, name.length)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Chest, Legs, Back"
              onSelect={(e) => handleInputSelection(e, category.length)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Brief description of the exercise"
              onSelect={(e) => handleInputSelection(e, description.length)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="notes" className="text-right">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="col-span-3"
              placeholder="Any additional notes or tips"
              onSelect={(e) => handleInputSelection(e, notes.length)}
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createExerciseTypeMutation.isPending}>
              {createExerciseTypeMutation.isPending ? "Adding..." : "Add Exercise Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}