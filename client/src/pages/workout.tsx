import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { CalendarIcon, Plus, Minus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import NumberInput from "@/components/ui/number-input";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import ExerciseForm from "@/components/workout/exercise-form";

// Common exercise types
const EXERCISE_TYPES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Shoulder Press",
  "Pull-ups",
  "Leg Press",
  "Bicep Curls",
  "Tricep Extensions",
  "Lat Pulldown",
  "Leg Curls",
  "Chest Fly",
  "Dumbbell Row",
];

// Form schema
const workoutFormSchema = z.object({
  workout: z.object({
    name: z.string().min(1, { message: "Workout name is required" }),
    date: z.date(),
    duration: z.number().min(1).optional(),
    notes: z.string().optional(),
  }),
  exercises: z.array(z.object({
    name: z.string().min(1, { message: "Exercise name is required" }),
    sets: z.array(z.object({
      weight: z.number().min(0),
      reps: z.number().min(1),
    })).min(1, { message: "At least one set is required" }),
  })).min(1, { message: "At least one exercise is required" }),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export default function Workout() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Define form with defaults
  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      workout: {
        name: "",
        date: new Date(),
        duration: 45,
        notes: "",
      },
      exercises: [
        {
          name: "Bench Press",
          sets: [{ weight: 135, reps: 10 }],
        },
      ],
    },
  });

  // Mutation to save the workout
  const saveWorkout = useMutation({
    mutationFn: (data: WorkoutFormValues) => 
      apiRequest("POST", "/api/workout-with-exercises", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workout saved successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-workouts'] });
      navigate("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving workout:", error);
    },
  });

  // Form submission handler
  const onSubmit = (data: WorkoutFormValues) => {
    saveWorkout.mutate(data);
  };

  // Exercises field array
  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = 
    useFieldArray({
      control: form.control,
      name: "exercises",
    });

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Add Workout</h2>
        </div>
        <Card>
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Date input */}
                <FormField
                  control={form.control}
                  name="workout.date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Workout name input */}
                <FormField
                  control={form.control}
                  name="workout.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Workout Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g. Upper Body, Leg Day" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Exercises section */}
                <div className="border-t border-gray-200 my-4 pt-4">
                  <h3 className="text-base font-medium mb-3">Exercises</h3>

                  {exerciseFields.map((field, index) => (
                    <ExerciseForm
                      key={field.id}
                      index={index}
                      form={form}
                      exerciseTypes={EXERCISE_TYPES}
                      onRemove={() => removeExercise(index)}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => appendExercise({ name: "", sets: [{ weight: 0, reps: 0 }] })}
                    className="mt-2 text-primary font-medium flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-1" />
                    Add Exercise
                  </Button>
                </div>

                {/* Notes textarea */}
                <FormField
                  control={form.control}
                  name="workout.notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="How did the workout feel?" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Submit button */}
                <div className="flex space-x-2">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={saveWorkout.isPending}
                  >
                    {saveWorkout.isPending ? "Saving..." : "Save Workout"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
