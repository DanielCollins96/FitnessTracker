import { useState, useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { Plus, Trash2, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NumberInput from "@/components/ui/number-input";
import { useToast } from "@/hooks/use-toast";

interface ExerciseFormProps {
  index: number;
  form: any;
  exerciseTypes: string[];
  onRemove: () => void;
}

interface LastUsedValues {
  weight: number;
  reps: number;
}

export default function ExerciseForm({ index, form, exerciseTypes, onRemove }: ExerciseFormProps) {
  const [isLoadingLastUsed, setIsLoadingLastUsed] = useState(false);
  const [lastUsedValues, setLastUsedValues] = useState<LastUsedValues | null>(null);
  const { toast } = useToast();
  
  // Get nested field array for sets within this exercise
  const { fields: setFields, append: appendSet, remove: removeSet } = 
    useFieldArray({
      control: form.control,
      name: `exercises.${index}.sets`,
    });
    
  // Current exercise name
  const currentExerciseName = form.watch(`exercises.${index}.name`);
  
  // Function to fetch the last used weight and reps for the selected exercise
  const fetchLastUsedValues = async () => {
    if (!currentExerciseName) return;
    
    setIsLoadingLastUsed(true);
    try {
      const response = await fetch(`/api/exercise-latest/${encodeURIComponent(currentExerciseName)}`);
      if (response.ok) {
        const data = await response.json();
        setLastUsedValues(data);
      }
    } catch (error) {
      console.error("Failed to fetch last used values:", error);
    } finally {
      setIsLoadingLastUsed(false);
    }
  };
  
  // Fetch last used values when exercise name changes
  useEffect(() => {
    if (currentExerciseName) {
      fetchLastUsedValues();
    }
  }, [currentExerciseName]);
  
  // Apply last used values to a set
  const applyLastUsedValues = (setIndex: number) => {
    if (lastUsedValues) {
      form.setValue(`exercises.${index}.sets.${setIndex}.weight`, lastUsedValues.weight);
      form.setValue(`exercises.${index}.sets.${setIndex}.reps`, lastUsedValues.reps);
      
      toast({
        title: "Applied Last Used Values",
        description: `Weight: ${lastUsedValues.weight} lbs, Reps: ${lastUsedValues.reps}`,
        variant: "default",
      });
    }
  };
  
  // Apply last used values to all sets
  const applyLastUsedValuesToAllSets = () => {
    if (lastUsedValues && setFields.length > 0) {
      setFields.forEach((_, setIndex) => {
        form.setValue(`exercises.${index}.sets.${setIndex}.weight`, lastUsedValues.weight);
        form.setValue(`exercises.${index}.sets.${setIndex}.reps`, lastUsedValues.reps);
      });
      
      toast({
        title: "Applied to All Sets",
        description: `Weight: ${lastUsedValues.weight} lbs, Reps: ${lastUsedValues.reps}`,
        variant: "default",
      });
    }
  };

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
          value={currentExerciseName}
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
      
      {/* Last used values section */}
      {lastUsedValues && lastUsedValues.weight > 0 && (
        <div className="mb-3 bg-blue-50 p-2 rounded border border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-blue-700 font-medium">Last used: </span>
              <span className="text-xs text-blue-800">{lastUsedValues.weight} lbs × {lastUsedValues.reps} reps</span>
            </div>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={applyLastUsedValuesToAllSets}
              className="text-blue-700 h-6 text-xs py-0 px-2"
              disabled={isLoadingLastUsed}
            >
              Apply to all
            </Button>
          </div>
        </div>
      )}
      
      {setFields.map((setField, setIndex) => (
        <div key={setField.id} className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <Label className="text-sm font-medium text-gray-700">Set {setIndex + 1}</Label>
            <div className="flex items-center space-x-1">
              {lastUsedValues && lastUsedValues.weight > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => applyLastUsedValues(setIndex)}
                  className="text-blue-700 h-6 w-6 p-0"
                  title="Use last values"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                </Button>
              )}
              {setFields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSet(setIndex)}
                  className="text-red-500 h-6 p-0 w-6"
                  title="Remove set"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</Label>
              <NumberInput
                value={form.watch(`exercises.${index}.sets.${setIndex}.weight`)}
                onChange={(value) => form.setValue(`exercises.${index}.sets.${setIndex}.weight`, value)}
                min={0}
                step={2.5}
                allowDecimal={true}
                precision={2}
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
          onClick={() => {
            if (lastUsedValues && lastUsedValues.weight > 0) {
              appendSet({ 
                weight: lastUsedValues.weight, 
                reps: lastUsedValues.reps 
              });
            } else {
              appendSet({ weight: 0, reps: 0 });
            }
          }}
          className="text-sm text-primary font-medium p-0 h-auto"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Set
        </Button>
      </div>
    </div>
  );
}
