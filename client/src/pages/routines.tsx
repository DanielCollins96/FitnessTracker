import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Dumbbell, X, ArrowRight, Play } from "lucide-react";
import { useLocation } from "wouter";
import { AddExerciseTypeDialog } from "@/components/exercise/add-exercise-type-dialog";

// Define schemas
const routineSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  category: z.string().optional(),
});

const routineExerciseSchema = z.object({
  exerciseTypeId: z.number().min(1, "Please select an exercise"),
  orderIndex: z.number(),
  defaultSets: z.number().min(1).default(3),
  defaultReps: z.number().min(1).default(10),
  notes: z.string().optional(),
  exerciseName: z.string().min(1), // For display purposes
});

const routineWithExercisesSchema = z.object({
  routine: routineSchema,
  exercises: z.array(routineExerciseSchema),
});

type RoutineValues = z.infer<typeof routineSchema>;
type RoutineExerciseValues = z.infer<typeof routineExerciseSchema>;
type RoutineWithExercisesValues = z.infer<typeof routineWithExercisesSchema>;

// Types
interface Routine {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  created: string;
}

interface ExerciseType {
  id: number;
  name: string;
  description: string | null;
  notes: string | null;
  category: string | null;
  created: string;
}

interface RoutineExercise {
  id: number;
  routineId: number;
  exerciseTypeId: number;
  orderIndex: number;
  defaultSets: number;
  defaultReps: number | null;
  notes: string | null;
}

interface RoutineWithExercises {
  routine: Routine;
  exercises: Array<RoutineExercise & { exerciseName: string }>;
}

function RoutineExerciseItem({ 
  exercise, 
  exerciseTypes, 
  onRemove 
}: { 
  exercise: RoutineExerciseValues; 
  exerciseTypes: ExerciseType[]; 
  onRemove: () => void; 
}) {
  const exerciseType = exerciseTypes.find(et => et.id === exercise.exerciseTypeId);

  return (
    <div className="flex items-center justify-between gap-4 p-3 border rounded-md bg-background">
      <div className="flex-1">
        <div className="font-medium">{exercise.exerciseName}</div>
        <div className="text-sm text-muted-foreground">
          {exercise.defaultSets} sets × {exercise.defaultReps} reps
        </div>
        {exercise.notes && (
          <div className="text-xs text-muted-foreground mt-1">{exercise.notes}</div>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove}><X className="h-4 w-4" /></Button>
    </div>
  );
}

function RoutineCard({ routine, onStart }: { routine: Routine; onStart: () => void }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>{routine.name}</CardTitle>
        {routine.category && (
          <Badge variant="outline" className="mt-1 w-fit">{routine.category}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {routine.description && (
          <CardDescription className="text-sm line-clamp-2">
            {routine.description}
          </CardDescription>
        )}
      </CardContent>
      <CardFooter className="border-t pt-3 flex justify-between">
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={onStart}
        >
          <Play className="mr-2 h-4 w-4" />
          Start Workout
        </Button>
      </CardFooter>
    </Card>
  );
}

function CreateRoutineDialog({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [step, setStep] = useState<'info' | 'exercises'>('info');
  const [exercises, setExercises] = useState<RoutineExerciseValues[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  // Use React Query properly for exercise types with proper typing
  const { data: exerciseTypes = [] } = useQuery<ExerciseType[]>({
    queryKey: ['/api/exercise-types'],
    // Set refetchOnMount to ensure the data is fresh when the dialog opens
    refetchOnMount: 'always',
    // Set a shorter stale time to ensure data is refreshed frequently
    staleTime: 1000,
    // Use proper queryFn with type safety
    queryFn: async () => {
      const response = await fetch('/api/exercise-types');
      if (!response.ok) {
        throw new Error('Failed to fetch exercise types');
      }
      return response.json();
    },
  });

  // Form for routine info
  const routineForm = useForm<RoutineValues>({
    resolver: zodResolver(routineSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  });

  // Form for adding exercises
  const exerciseForm = useForm<RoutineExerciseValues>({
    resolver: zodResolver(routineExerciseSchema),
    defaultValues: {
      exerciseTypeId: 0,
      orderIndex: 0,
      defaultSets: 3,
      defaultReps: 10,
      notes: '',
      exerciseName: '',
    },
  });

  // Create routine with exercises
  const createRoutineMutation = useMutation({
    mutationFn: (data: RoutineWithExercisesValues) => 
      apiRequest('/api/routine-with-exercises', { method: 'POST', data }),
    onSuccess: () => {
      toast({
        title: 'Routine created',
        description: 'Your workout routine has been created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/workout-routines'] });
      setOpen(false);
      setStep('info');
      setExercises([]);
      routineForm.reset();
      exerciseForm.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create workout routine',
        variant: 'destructive',
      });
    },
  });

  // Handle routine info submission
  const onSubmitInfo = (data: RoutineValues) => {
    setStep('exercises');
  };

  // Handle adding an exercise
  const onAddExercise = (data: RoutineExerciseValues) => {
    const selectedExerciseType = exerciseTypes.find(et => et.id === data.exerciseTypeId);
    if (!selectedExerciseType) {
      toast({
        title: 'Error',
        description: 'Please select a valid exercise',
        variant: 'destructive',
      });
      return;
    }

    // Add the exercise with proper order index and exercise name
    setExercises([
      ...exercises,
      {
        ...data,
        orderIndex: exercises.length,
        exerciseName: selectedExerciseType.name,
      },
    ]);

    // Reset form
    exerciseForm.reset({
      exerciseTypeId: 0,
      orderIndex: 0,
      defaultSets: 3,
      defaultReps: 10,
      notes: '',
      exerciseName: '',
    });
  };

  // Handle removing an exercise
  const handleRemoveExercise = (index: number) => {
    const newExercises = [...exercises];
    newExercises.splice(index, 1);
    
    // Update order indices
    const updatedExercises = newExercises.map((ex, idx) => ({
      ...ex,
      orderIndex: idx,
    }));
    
    setExercises(updatedExercises);
  };

  // Handle final submission
  const handleCreateRoutine = () => {
    if (exercises.length === 0) {
      toast({
        title: 'No exercises',
        description: 'Please add at least one exercise to your routine',
        variant: 'destructive',
      });
      return;
    }

    createRoutineMutation.mutate({
      routine: routineForm.getValues(),
      exercises,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'info' ? 'Create Workout Routine' : 'Add Exercises'}
          </DialogTitle>
          <DialogDescription>
            {step === 'info' 
              ? 'Create a reusable workout routine that you can start any time'
              : 'Add exercises to your routine'}
          </DialogDescription>
        </DialogHeader>

        {step === 'info' ? (
          <Form {...routineForm}>
            <form onSubmit={routineForm.handleSubmit(onSubmitInfo)} className="space-y-4">
              <FormField
                control={routineForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Routine Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Upper Body" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={routineForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Strength">Strength</SelectItem>
                        <SelectItem value="Cardio">Cardio</SelectItem>
                        <SelectItem value="Full Body">Full Body</SelectItem>
                        <SelectItem value="Upper Body">Upper Body</SelectItem>
                        <SelectItem value="Lower Body">Lower Body</SelectItem>
                        <SelectItem value="Core">Core</SelectItem>
                        <SelectItem value="Recovery">Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={routineForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe this routine..."
                        className="resize-none"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <>
            <div className="space-y-4">
              <Form {...exerciseForm}>
                <form 
                  onSubmit={exerciseForm.handleSubmit(onAddExercise)} 
                  className="space-y-4 border rounded-md p-4"
                >
                  <FormField
                    control={exerciseForm.control}
                    name="exerciseTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exercise</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            const id = parseInt(value);
                            field.onChange(id);
                            
                            // Set exercise name from selected exercise type
                            const selectedExercise = exerciseTypes.find(et => et.id === id);
                            if (selectedExercise) {
                              exerciseForm.setValue('exerciseName', selectedExercise.name);
                            }
                          }}
                          value={field.value ? field.value.toString() : ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an exercise" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {exerciseTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                            <div className="p-2 border-t">
                              <AddExerciseTypeDialog 
                                trigger={
                                  <Button variant="ghost" size="sm" className="w-full gap-1">
                                    <Plus className="h-4 w-4" />
                                    Add New Exercise Type
                                  </Button>
                                }
                                onSuccess={(newType) => {
                                  // Invalidate the query to fetch fresh data
                                  queryClient.invalidateQueries({ queryKey: ['/api/exercise-types'] });
                                  
                                  // Select the newly created exercise type
                                  field.onChange(newType.id);
                                  exerciseForm.setValue('exerciseName', newType.name);
                                }}
                              />
                            </div>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={exerciseForm.control}
                      name="defaultSets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sets</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={exerciseForm.control}
                      name="defaultReps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reps</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={exerciseForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional notes for this exercise..."
                            className="resize-none"
                            {...field}
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Exercise
                  </Button>
                </form>
              </Form>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Exercises in this Routine</h3>
                {exercises.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                    No exercises added yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {exercises.map((exercise, index) => (
                      <RoutineExerciseItem
                        key={index}
                        exercise={exercise}
                        exerciseTypes={exerciseTypes}
                        onRemove={() => handleRemoveExercise(index)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 flex-row sm:flex-row sm:space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStep('info')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                type="button" 
                onClick={handleCreateRoutine}
                disabled={createRoutineMutation.isPending || exercises.length === 0}
                className="flex-1"
              >
                {createRoutineMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Routine
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StartRoutineDialog({ 
  routine, 
  open, 
  setOpen 
}: { 
  routine: Routine | null; 
  open: boolean; 
  setOpen: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const startWorkoutMutation = useMutation({
    mutationFn: (routineId: number) => 
      apiRequest(`/api/convert-routine-to-workout/${routineId}`, { 
        method: 'POST', 
        data: { date: new Date() } 
      }),
    onSuccess: (data) => {
      toast({
        title: 'Workout started',
        description: 'Your workout has been created and is ready to begin',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-workouts'] });
      setOpen(false);
      
      // Navigate to the workout page with the new workout id
      if (data && data.workout && data.workout.id) {
        setLocation(`/workout/${data.workout.id}`);
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start workout',
        variant: 'destructive',
      });
    },
  });

  const handleStartWorkout = () => {
    if (routine) {
      startWorkoutMutation.mutate(routine.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Workout</DialogTitle>
          <DialogDescription>
            Create a new workout from this routine
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <p className="text-center mb-4">
            Start a new workout based on <span className="font-semibold">{routine?.name}</span>?
          </p>
          <p className="text-sm text-muted-foreground text-center">
            This will create a new workout with all the exercises from this routine.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStartWorkout}
            disabled={startWorkoutMutation.isPending}
          >
            {startWorkoutMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Start Workout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function RoutinesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);

  // Fetch routines
  const { data: routines = [], isLoading } = useQuery({
    queryKey: ['/api/workout-routines'],
    queryFn: () => apiRequest('/api/workout-routines'),
  });

  const handleStartRoutine = (routine: Routine) => {
    setSelectedRoutine(routine);
    setStartDialogOpen(true);
  };

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workout Routines</h1>
          <p className="text-muted-foreground">
            Create and manage reusable workout templates
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Routine
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : routines.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No routines yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first workout routine to get started
          </p>
          <Button className="mt-4" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workout Routine
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {routines.map((routine: Routine) => (
            <RoutineCard
              key={routine.id}
              routine={routine}
              onStart={() => handleStartRoutine(routine)}
            />
          ))}
        </div>
      )}

      <CreateRoutineDialog 
        open={createDialogOpen} 
        setOpen={setCreateDialogOpen} 
      />
      
      <StartRoutineDialog
        routine={selectedRoutine}
        open={startDialogOpen}
        setOpen={setStartDialogOpen}
      />
    </div>
  );
}