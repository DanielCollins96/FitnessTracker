import { useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NumberInput from "@/components/ui/number-input";

interface ExerciseFormProps {
  index: number;
  form: any;
  exerciseTypes: string[];
  onRemove: () => void;
}

export default function ExerciseForm({ index, form, exerciseTypes, onRemove }: ExerciseFormProps) {
  // Get nested field array for sets within this exercise
  const { fields: setFields, append: appendSet, remove: removeSet } = 
    useFieldArray({
      control: form.control,
      name: `exercises.${index}.sets`,
    });

  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-3">
      <div className="flex justify-between mb-2">
        <h4 className="font-medium">Exercise {index + 1}</h4>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm" 
          onClick={onRemove}
          className="text-red-500 h-auto py-1 px-2 text-sm"
        >
          Remove
        </Button>
      </div>
      
      <div className="mb-3">
        <Label className="block text-sm font-medium text-gray-700 mb-1">Exercise Type</Label>
        <Select
          value={form.watch(`exercises.${index}.name`)}
          onValueChange={(value) => form.setValue(`exercises.${index}.name`, value)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select an exercise" />
          </SelectTrigger>
          <SelectContent>
            {exerciseTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.exercises?.[index]?.name && (
          <p className="text-sm text-red-500 mt-1">
            {form.formState.errors.exercises[index].name.message}
          </p>
        )}
      </div>
      
      {setFields.map((setField, setIndex) => (
        <div key={setField.id} className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-sm font-medium text-gray-700">Set {setIndex + 1}</Label>
            {setFields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeSet(setIndex)}
                className="text-red-500 h-auto py-0 px-2 text-xs"
              >
                Remove
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</Label>
              <NumberInput
                value={form.watch(`exercises.${index}.sets.${setIndex}.weight`)}
                onChange={(value) => form.setValue(`exercises.${index}.sets.${setIndex}.weight`, value)}
                min={0}
                step={5}
              />
              {form.formState.errors.exercises?.[index]?.sets?.[setIndex]?.weight && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.exercises[index].sets[setIndex].weight.message}
                </p>
              )}
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Reps</Label>
              <NumberInput
                value={form.watch(`exercises.${index}.sets.${setIndex}.reps`)}
                onChange={(value) => form.setValue(`exercises.${index}.sets.${setIndex}.reps`, value)}
                min={0}
                step={1}
              />
              {form.formState.errors.exercises?.[index]?.sets?.[setIndex]?.reps && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.exercises[index].sets[setIndex].reps.message}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
      
      <div className="mt-3">
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => appendSet({ weight: 0, reps: 0 })}
          className="text-sm text-primary font-medium p-0 h-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Set
        </Button>
      </div>
    </div>
  );
}
