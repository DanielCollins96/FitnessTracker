import { useState, useRef, useEffect } from "react";
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

interface AddExerciseTypeDialogProps {
  onSuccess?: (exerciseType: { id: number; name: string }) => void;
  trigger?: React.ReactNode;
}

export function AddExerciseTypeDialog({
  onSuccess,
  trigger,
}: AddExerciseTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Create mutation for adding a new exercise type
  const createExerciseTypeMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      category: string | null;
      description: string | null;
      notes: string | null;
    }) => {
      // Use a direct fetch with no caching
      const response = await fetch("/api/exercise-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache", // Prevent caching
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

      // Call the onSuccess callback directly without invalidating the cache
      if (onSuccess && data) {
        onSuccess({ id: data.id, name: data.name });
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
    },
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
      <DialogContent
        className="sm:max-w-[425px]"
        initialFocusRef={nameInputRef}
      >
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
              ref={nameInputRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              tabIndex={0}
              autoFocus
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
              tabIndex={0}
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
              tabIndex={0}
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
              tabIndex={0}
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" tabIndex={0}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={createExerciseTypeMutation.isPending}
              tabIndex={0}
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
