import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AreaChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Area, BarChart, Bar } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

// Mock data for the chart (will be replaced with real data from API)
const weeklyWorkoutData = [
  { day: 'Mon', duration: 45 },
  { day: 'Tue', duration: 0 },
  { day: 'Wed', duration: 60 },
  { day: 'Thu', duration: 0 },
  { day: 'Fri', duration: 45 },
  { day: 'Sat', duration: 0 },
  { day: 'Sun', duration: 0 },
];

type ProgressStat = {
  value: number;
  label: string;
  color: string;
};

type Goal = {
  id: number;
  name: string;
  progress: string;
  progressPercent: number;
  color: string;
};

interface RecentWorkoutItem {
  id: number;
  name: string;
  date: string;
  duration: number;
  exerciseCount: number;
  exercises: string[];
  totalExercises: number;
}

export default function Dashboard() {
  // Fetch recent workouts
  const { data: recentWorkouts, isLoading: isLoadingWorkouts } = useQuery<RecentWorkoutItem[]>({
    queryKey: ['/api/recent-workouts'],
  });

  // Fetch goals
  const { data: goals, isLoading: isLoadingGoals } = useQuery<any[]>({
    queryKey: ['/api/goals'],
  });

  // Progress stats based on workouts data
  const progressStats: ProgressStat[] = [
    { value: recentWorkouts?.length || 0, label: 'Workouts', color: 'text-emerald-600' },
    { value: recentWorkouts?.reduce((acc, w) => acc + (w.duration || 0), 0) || 0, label: 'Minutes', color: 'text-blue-600' },
    { value: goals?.filter(g => g.isCompleted)?.length || 0, label: 'Goals Met', color: 'text-purple-600' },
  ];

  const formattedGoals: Goal[] = goals?.map(goal => {
    let progress, progressPercent, color;
    
    if (goal.targetReps && goal.currentProgress) {
      progress = `${goal.currentProgress}/${goal.targetReps}`;
      progressPercent = (goal.currentProgress / goal.targetReps) * 100;
      color = 'bg-emerald-600';
    } else if (goal.targetWeight && goal.currentProgress) {
      progress = `${goal.currentProgress}/${goal.targetWeight} lbs`;
      progressPercent = (goal.currentProgress / goal.targetWeight) * 100;
      color = 'bg-blue-600';
    } else {
      progress = '0%';
      progressPercent = 0;
      color = 'bg-slate-600';
    }
    
    return {
      id: goal.id,
      name: goal.name,
      progress,
      progressPercent,
      color
    };
  }) || [];

  return (
    <div className="px-4 py-6">
      {/* Overview Chart Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-500">This Week</h3>
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto bg-gray-100 rounded">Week</Button>
                <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">Month</Button>
                <Button variant="ghost" size="sm" className="text-xs px-2 py-1 h-auto">Year</Button>
              </div>
            </div>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyWorkoutData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tickCount={3}
                    domain={[0, 'dataMax + 20']}
                  />
                  <Tooltip />
                  <Bar 
                    dataKey="duration" 
                    fill="hsl(var(--primary))" 
                    radius={4}
                    barSize={12}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Stats */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Progress</h2>
          <Button variant="link" className="text-sm font-medium p-0 h-auto">See All</Button>
        </div>
        <div className="flex overflow-x-auto pb-2 space-x-4 -mx-4 px-4">
          {progressStats.map((stat, index) => (
            <Card key={index} className="flex-shrink-0 w-32 h-20">
              <CardContent className="p-0 h-full flex flex-col items-center justify-center">
                <p className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Workouts */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Recent Workouts</h2>
          <Link href="/history">
            <Button variant="link" className="text-sm font-medium p-0 h-auto">View All</Button>
          </Link>
        </div>
        <div className="space-y-3">
          {isLoadingWorkouts ? (
            <>
              <WorkoutSkeleton />
              <WorkoutSkeleton />
            </>
          ) : recentWorkouts && recentWorkouts.length > 0 ? (
            recentWorkouts.slice(0, 2).map((workout) => (
              <Card key={workout.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium">{workout.name}</h3>
                    <p className="text-sm text-gray-500">{workout.date}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-medium text-gray-800">{workout.duration} min</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </div>
                </div>
                <div className="flex mt-3 space-x-2 flex-wrap">
                  {workout.exercises.map((exercise, i) => (
                    <Badge key={i} variant="secondary" className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-100">
                      {exercise}
                    </Badge>
                  ))}
                  {workout.totalExercises > 3 && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-100">
                      +{workout.totalExercises - 3} more
                    </Badge>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No workouts yet</p>
              <Link href="/workout">
                <Button className="mt-2">Add Your First Workout</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Your Goals</h2>
          <Button variant="link" className="text-sm font-medium p-0 h-auto">Edit</Button>
        </div>
        <div className="space-y-3">
          {isLoadingGoals ? (
            <>
              <GoalSkeleton />
              <GoalSkeleton />
            </>
          ) : formattedGoals && formattedGoals.length > 0 ? (
            formattedGoals.map((goal) => (
              <Card key={goal.id} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-base font-medium">{goal.name}</h3>
                  <span className="text-sm font-medium text-emerald-600">{goal.progress}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${goal.color} rounded-full h-2`} 
                    style={{ width: `${goal.progressPercent}%` }}
                  ></div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No goals set yet</p>
              <Link href="/progress">
                <Button className="mt-2">Set Your First Goal</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WorkoutSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-5 w-28 rounded-md mb-2" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>
      <div className="flex mt-3 space-x-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-6 w-24 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    </Card>
  );
}

function GoalSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="h-5 w-32 rounded-md" />
        <Skeleton className="h-4 w-12 rounded-md" />
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </Card>
  );
}
