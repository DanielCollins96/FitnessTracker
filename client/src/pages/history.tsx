import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Pencil } from "lucide-react";

interface WorkoutHistoryItem {
  id: number;
  name: string;
  date: string;
  duration: number;
  exerciseCount: number;
  exercises: string[];
  totalExercises: number;
}

export default function History() {
  const [filter, setFilter] = useState<string>("all");
  
  const { data: workouts, isLoading } = useQuery<WorkoutHistoryItem[]>({
    queryKey: ['/api/recent-workouts'],
  });
  
  // Group workouts by month
  const workoutsByMonth: Record<string, WorkoutHistoryItem[]> = {};
  
  if (workouts) {
    workouts.forEach((workout) => {
      // Extract month and year from the date string
      const dateParts = workout.date.split(',')[0].split(' ');
      const monthYear = `${dateParts[0]} ${dateParts[1]}`;
      
      if (!workoutsByMonth[monthYear]) {
        workoutsByMonth[monthYear] = [];
      }
      
      workoutsByMonth[monthYear].push(workout);
    });
  }
  
  // Filter workouts based on selection
  const filteredWorkoutsByMonth = { ...workoutsByMonth };
  if (filter !== "all") {
    Object.keys(filteredWorkoutsByMonth).forEach((month) => {
      filteredWorkoutsByMonth[month] = filteredWorkoutsByMonth[month].filter(
        (workout) => workout.name.toLowerCase().includes(filter.toLowerCase())
      );
      
      // Remove month if it has no workouts after filtering
      if (filteredWorkoutsByMonth[month].length === 0) {
        delete filteredWorkoutsByMonth[month];
      }
    });
  }

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Workout History</h2>
          <div className="relative">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="All workouts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workouts</SelectItem>
                <SelectItem value="upper">Upper body</SelectItem>
                <SelectItem value="leg">Lower body</SelectItem>
                <SelectItem value="cardio">Cardio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            [...Array(2)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-5 w-40 mb-2" />
                <MonthSkeleton />
              </div>
            ))
          ) : Object.keys(filteredWorkoutsByMonth).length > 0 ? (
            // Display workout history by month
            Object.keys(filteredWorkoutsByMonth).map((month) => (
              <div key={month}>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{month}</h3>
                <div className="space-y-3">
                  {filteredWorkoutsByMonth[month].map((workout) => (
                    <WorkoutHistoryItem key={workout.id} workout={workout} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            // No workouts found message
            <div className="text-center py-10">
              <p className="text-gray-500">
                {filter === "all" 
                  ? "No workouts have been logged yet." 
                  : "No workouts match your filter."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface WorkoutHistoryItemProps {
  workout: WorkoutHistoryItem;
}

function WorkoutHistoryItem({ workout }: WorkoutHistoryItemProps) {
  // For navigation
  const [_, setLocation] = useLocation();
  
  // Extract day from the date string (e.g., "Nov 18, 2023" -> "18")
  const day = workout.date.split(' ')[1].replace(',', '');
  
  // Handler for viewing details
  const handleViewDetails = () => {
    // Navigate to a detailed view if needed
    console.log("View details for workout:", workout.id);
  };
  
  // Handler for editing workout
  const handleEdit = () => {
    setLocation(`/edit-workout/${workout.id}`);
  };
  
  return (
    <Card className="p-4">
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
          <span className="font-semibold text-primary text-lg">{day}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-base font-medium">{workout.name}</h3>
          <div className="flex mt-1 space-x-2">
            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
              {workout.exerciseCount} exercises
            </Badge>
            <span className="text-xs text-gray-500">{workout.duration} min</span>
          </div>
        </div>
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleEdit}
            className="mr-1 h-8 w-8 p-0"
            title="Edit workout"
          >
            <Pencil className="h-4 w-4 text-blue-600" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleViewDetails}
            className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MonthSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center">
            <Skeleton className="w-12 h-12 rounded-full mr-4" />
            <div className="flex-1">
              <Skeleton className="h-5 w-24 mb-2" />
              <div className="flex mt-1 space-x-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
            <Skeleton className="h-6 w-6" />
          </div>
        </Card>
      ))}
    </div>
  );
}
