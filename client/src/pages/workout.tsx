import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarIcon, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import ExerciseForm from "@/components/workout/exercise-form";

// Form schema
const workoutFormSchema = z.object({
  workout: z.object({
    name: z.string().min(1, { message: "Workout name is required" }),
    date: z.date(),
    duration: z.number().min(1).optional(),
    notes: z.string().optional(),
  }),
  exercises: z
    .array(
      z.object({
        name: z.string().min(1, { message: "Exercise name is required" }),
        sets: z
          .array(
            z.object({
              weight: z.number().min(0),
              reps: z.number().min(1),
            }),
          )
          .min(1, { message: "At least one set is required" }),
      }),
    )
    .min(1, { message: "At least one exercise is required" }),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export default function Workout(props: { params?: { id?: string } }) {
  const isEditMode = !!props.params?.id;
  const workoutId = props.params?.id ? parseInt(props.params.id) : undefined;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch exercise types from API
  const { data: exerciseTypes, isLoading: isLoadingExerciseTypes } = useQuery<
    {
      id: number;
      name: string;
      description: string | null;
      notes: string | null;
      category: string | null;
      created: string;
    }[]
  >({
    queryKey: ["/api/exercise-types"],
  });
  
  // Define type for the workout with exercises response
  type WorkoutWithExercisesResponse = {
    workout: {
      id: number;
      name: string;
      date: string;
      duration: number;
      notes: string | null;
    };
    exercises: {
      id: number;
      workoutId: number;
      name: string;
      sets: { weight: number; reps: number }[];
    }[];
  };
  
  // Fetch existing workout if in edit mode
  const { data: existingWorkout, isLoading: isLoadingWorkout } = useQuery<WorkoutWithExercisesResponse>({
    queryKey: [`/api/workout-with-exercises/${workoutId}`],
    enabled: isEditMode && !!workoutId,
  });
  
  // Create a state to track whether form has been initialized with existing data
  const [formInitialized, setFormInitialized] = useState(false);

  // Extract exercise names for dropdown
  const exerciseTypeNames = exerciseTypes?.map((type) => type.name) || [];

  // Default exercise name
  const defaultExerciseName =
    exerciseTypeNames.length > 0 ? exerciseTypeNames[0] : "";

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
          name: defaultExerciseName,
          sets: [{ weight: 135, reps: 10 }],
        },
      ],
    },
  });

  // Mutation to save or update the workout
  const saveWorkout = useMutation({
    mutationFn: (data: WorkoutFormValues) => {
      if (isEditMode && workoutId) {
        // Update existing workout
        return apiRequest("PUT", `/api/workout-with-exercises/${workoutId}`, data);
      } else {
        // Create new workout
        return apiRequest("POST", "/api/workout-with-exercises", data);
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: isEditMode ? "Workout updated successfully!" : "Workout saved successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/recent-workouts"] });
      // If editing, also invalidate the current workout query
      if (isEditMode && workoutId) {
        queryClient.invalidateQueries({ queryKey: [`/api/workout-with-exercises/${workoutId}`] });
      }
      navigate("/history");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: isEditMode 
          ? "Failed to update workout. Please try again." 
          : "Failed to save workout. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving/updating workout:", error);
    },
  });

  // Form submission handler
  const onSubmit = (data: WorkoutFormValues) => {
    saveWorkout.mutate(data);
  };

  // Exercises field array
  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control: form.control,
    name: "exercises",
  });

  // Effect to update the default exercise when exercise types load
  useEffect(() => {
    if (
      exerciseTypes &&
      exerciseTypes.length > 0 &&
      form.getValues("exercises").length > 0 &&
      !isEditMode
    ) {
      const currentName = form.getValues("exercises")[0].name;
      if (!currentName && exerciseTypes.length > 0) {
        form.setValue("exercises.0.name", exerciseTypes[0].name);
      }
    }
  }, [exerciseTypes, form, isEditMode]);
  
  // Effect to load existing workout data when in edit mode
  useEffect(() => {
    if (isEditMode && existingWorkout && !formInitialized) {
      try {
        const workout = existingWorkout as WorkoutWithExercisesResponse;
        
        // Clear any existing exercises
        const currentExercises = form.getValues("exercises");
        if (currentExercises && currentExercises.length > 0) {
          for (let i = currentExercises.length - 1; i >= 0; i--) {
            removeExercise(i);
          }
        }
        
        // Set workout basic info
        form.setValue("workout.name", workout.workout.name);
        form.setValue("workout.notes", workout.workout.notes || "");
        
        // Parse the date and set it
        if (workout.workout.date) {
          const workoutDate = new Date(workout.workout.date);
          form.setValue("workout.date", workoutDate);
        }
        
        // Set duration if available
        if (workout.workout.duration) {
          form.setValue("workout.duration", workout.workout.duration);
        }
        
        // Add exercises
        if (workout.exercises && workout.exercises.length > 0) {
          workout.exercises.forEach((exercise) => {
            appendExercise({
              name: exercise.name,
              sets: exercise.sets || [{ weight: 0, reps: 0 }]
            });
          });
        }
        
        setFormInitialized(true);
        toast({
          title: "Workout Loaded",
          description: "The workout data has been loaded for editing.",
          variant: "default",
        });
      } catch (error) {
        console.error("Error initializing form with existing workout:", error);
        toast({
          title: "Error",
          description: "Failed to load workout data for editing.",
          variant: "destructive",
        });
      }
    }
  }, [existingWorkout, form, formInitialized, isEditMode, appendExercise, removeExercise, toast]);

  // Loading state
  if (isLoadingExerciseTypes || (isEditMode && isLoadingWorkout)) {
    return (
      <div className="px-4 py-6">
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  {isEditMode ? "Edit Workout" : "Add Workout"}
                </h2>
              </div>
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500">
                  {isEditMode && isLoadingWorkout 
                    ? "Loading workout data..." 
                    : "Loading exercise library..."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                {isEditMode ? "Edit Workout" : "Add Workout"}
              </h2>
            </div>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                                !field.value && "text-muted-foreground",
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
                      exerciseTypes={exerciseTypeNames}
                      onRemove={() => removeExercise(index)}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      appendExercise({
                        name:
                          exerciseTypeNames.length > 0
                            ? exerciseTypeNames[0]
                            : "",
                        sets: [{ weight: 0, reps: 0 }],
                      })
                    }
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
                    {saveWorkout.isPending 
                      ? "Saving..." 
                      : isEditMode ? "Update Workout" : "Save Workout"}
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
