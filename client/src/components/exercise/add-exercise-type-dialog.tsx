import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AddExerciseTypeDialogProps {
  onSuccess?: (exerciseType: { id: number; name: string }) => void;
  trigger?: React.ReactNode;
}

export function AddExerciseTypeDialog({
  onSuccess,
  trigger,
}: AddExerciseTypeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  async function submitForm() {
    const nameInput = document.getElementById(
      "exercise-name",
    ) as HTMLInputElement;
    const categoryInput = document.getElementById(
      "exercise-category",
    ) as HTMLInputElement;
    const descriptionInput = document.getElementById(
      "exercise-description",
    ) as HTMLTextAreaElement;
    const notesInput = document.getElementById(
      "exercise-notes",
    ) as HTMLTextAreaElement;

    const name = nameInput?.value;

    if (!name) {
      toast({
        title: "Error",
        description: "Exercise name is required",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);

    try {
      const response = await fetch("/api/exercise-types", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          category: categoryInput?.value || null,
          description: descriptionInput?.value || null,
          notes: notesInput?.value || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create exercise type");
      }

      const data = await response.json();

      toast({
        title: "Success",
        description: "Exercise type added successfully",
      });

      if (onSuccess && data) {
        onSuccess({ id: data.id, name: data.name });
      }

      setOpen(false);
    } catch (error) {
      console.error("Error adding exercise type:", error);
      toast({
        title: "Error",
        description: "Failed to add exercise type",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  }

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
        <form onSubmit={(e) => { e.preventDefault(); submitForm(); }}>
          <div className="py-4">
            <div className="mb-4">
              <div className="mb-1">
                <label
                  htmlFor="exercise-name"
                  className="block text-sm font-medium"
                >
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="exercise-name"
                  name="name"
                  className="w-full px-3 py-2 border rounded-md"
                  tabIndex={1}
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-1">
                <label
                  htmlFor="exercise-category"
                  className="block text-sm font-medium"
                >
                  Category
                </label>
                <input
                  type="text"
                  id="exercise-category"
                  name="category"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="e.g., Chest, Legs, Back"
                  tabIndex={2}
                />
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-1">
                <label
                  htmlFor="exercise-description"
                  className="block text-sm font-medium"
                >
                  Description
                </label>
                <textarea
                  id="exercise-description"
                  name="description"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Brief description of the exercise"
                  rows={3}
                  tabIndex={3}
                ></textarea>
              </div>
            </div>

            <div className="mb-4">
              <div className="mb-1">
                <label
                  htmlFor="exercise-notes"
                  className="block text-sm font-medium"
                >
                  Notes
                </label>
                <textarea
                  id="exercise-notes"
                  name="notes"
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Any additional notes or tips"
                  rows={3}
                  tabIndex={4}
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-4 py-2 border rounded-md bg-white text-gray-800"
                onClick={() => setOpen(false)}
                tabIndex={6}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-md bg-blue-600 text-white ${isAdding ? "opacity-50" : ""}`}
                disabled={isAdding}
                tabIndex={5}
              >
                {isAdding ? "Adding..." : "Add Exercise Type"}
              </button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
