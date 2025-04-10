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
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("/api/exercise-types", {
        method: "POST",
        data: {
          name,
          category: category || null,
          description: description || null,
          notes: notes || null,
        },
      });

      toast({
        title: "Success",
        description: "Exercise type added successfully",
      });

      // Invalidate the exercise types query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-types"] });

      // Call the onSuccess callback if provided
      if (onSuccess && response) {
        onSuccess(response);
      }

      // Reset form and close dialog
      resetForm();
      setOpen(false);
    } catch (error) {
      console.error("Error adding exercise type:", error);
      toast({
        title: "Error",
        description: "Failed to add exercise type",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Exercise Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}