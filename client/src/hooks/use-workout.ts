import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { WorkoutWithExercises } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useWorkout() {
  const { toast } = useToast();
  
  // Fetch recent workouts
  const { 
    data: recentWorkouts, 
    isLoading: isLoadingWorkouts,
    refetch: refetchWorkouts
  } = useQuery<any[]>({
    queryKey: ['/api/recent-workouts'],
  });
  
  // Create a new workout with exercises
  const createWorkout = useMutation({
    mutationFn: (data: WorkoutWithExercises) => 
      apiRequest("POST", "/api/workout-with-exercises", data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workout saved successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-workouts'] });
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
  
  // Delete a workout
  const deleteWorkout = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/workouts/${id}`, undefined),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Workout deleted successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/recent-workouts'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete workout. Please try again.",
        variant: "destructive",
      });
      console.error("Error deleting workout:", error);
    },
  });
  
  return {
    recentWorkouts,
    isLoadingWorkouts,
    createWorkout,
    deleteWorkout,
    refetchWorkouts,
  };
}
