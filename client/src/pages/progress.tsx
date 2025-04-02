import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ExerciseSet {
  date: Date;
  formattedDate: string;
  weight: number;
  reps: number;
}

const goalFormSchema = z.object({
  name: z.string().min(1, { message: "Goal name is required" }),
  exerciseName: z.string().min(1, { message: "Exercise name is required" }),
  targetWeight: z.number().min(1, { message: "Target weight is required" }),
  targetDate: z.date(),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

export default function Progress() {
  const [selectedExercise, setSelectedExercise] = useState("Bench Press");
  const [timeRange, setTimeRange] = useState("3M");
  const { toast } = useToast();

  // Fetch exercise history
  const { data: exerciseHistory, isLoading: isLoadingHistory } = useQuery<
    ExerciseSet[]
  >({
    queryKey: ["/api/exercise-history", selectedExercise],
    queryFn: async () => {
      const response = await fetch(
        `/api/exercise-history?exerciseName=${encodeURIComponent(selectedExercise)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch exercise history");
      }
      return response.json();
    },
    enabled: !!selectedExercise,
  });
  // Common exercise types for the selector
  const { data: EXERCISE_TYPES, isLoading: isLoadingExercises } = useQuery<
    string[]
  >({
    queryKey: ["/api/exercise-types"],
    queryFn: async () => {
      const response = await fetch(`/api/exercise-types`);
      if (!response.ok) {
        throw new Error("Failed to fetch exercise types");
      }
      return response.json();
    },
  });
  console.log(EXERCISE_TYPES);
  // Fetch recent sets
  const { data: recentSets, isLoading: isLoadingSets } = useQuery<
    ExerciseSet[]
  >({
    queryKey: ["/api/exercise-sets", selectedExercise],
    queryFn: async () => {
      const response = await fetch(
        `/api/exercise-sets?exerciseName=${encodeURIComponent(selectedExercise)}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch exercise sets");
      }
      return response.json();
    },
    enabled: !!selectedExercise,
  });

  // Goal form
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: `Increase ${selectedExercise}`,
      exerciseName: selectedExercise,
      targetWeight: 0,
      targetDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
    },
  });

  // Update form when selected exercise changes
  useState(() => {
    if (selectedExercise) {
      form.setValue("name", `Increase ${selectedExercise}`);
      form.setValue("exerciseName", selectedExercise);

      // Set target weight to current weight + 20%
      if (recentSets && recentSets.length > 0) {
        const currentWeight = recentSets[recentSets.length - 1].weight;
        form.setValue("targetWeight", Math.round(currentWeight * 1.2));
      }
    }
  });

  // Goal mutation
  const createGoal = useMutation({
    mutationFn: (data: GoalFormValues) =>
      apiRequest("POST", "/api/goals", {
        ...data,
        currentProgress:
          recentSets && recentSets.length > 0
            ? recentSets[recentSets.length - 1].weight
            : 0,
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Goal set successfully!",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/goals"] });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to set goal. Please try again.",
        variant: "destructive",
      });
      console.error("Error setting goal:", error);
    },
  });

  // Calculate progress statistics
  const progressStats = {
    starting: 0,
    current: 0,
    increase: 0,
    increasePercent: 0,
  };

  if (exerciseHistory && exerciseHistory.length > 0) {
    progressStats.starting = exerciseHistory[0].weight;
    progressStats.current = exerciseHistory[exerciseHistory.length - 1].weight;
    progressStats.increase = progressStats.current - progressStats.starting;
    progressStats.increasePercent = Math.round(
      (progressStats.increase / progressStats.starting) * 100,
    );
  }

  // Handle form submission
  const onSubmit = (data: GoalFormValues) => {
    createGoal.mutate(data);
  };

  return (
    <div className="px-4 py-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Progress Tracking
          </h2>
          <div className="relative">
            <Select
              value={selectedExercise}
              onValueChange={setSelectedExercise}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="Select exercise" />
              </SelectTrigger>
              <SelectContent>
                {/* {JSON.parse(JSON.stringify(EXERCISE_TYPES))} */}
                {EXERCISE_TYPES &&
                  EXERCISE_TYPES.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.name}>
                      {exercise.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-700">
                Weight Progress
              </h3>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant={timeRange === "3M" ? "default" : "outline"}
                  className="text-xs h-6 px-2 py-1"
                  onClick={() => setTimeRange("3M")}
                >
                  3M
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === "6M" ? "default" : "outline"}
                  className="text-xs h-6 px-2 py-1"
                  onClick={() => setTimeRange("6M")}
                >
                  6M
                </Button>
                <Button
                  size="sm"
                  variant={timeRange === "1Y" ? "default" : "outline"}
                  className="text-xs h-6 px-2 py-1"
                  onClick={() => setTimeRange("1Y")}
                >
                  1Y
                </Button>
              </div>
            </div>

            <div className="h-[200px] w-full">
              {isLoadingHistory ? (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-gray-500">Loading...</p>
                </div>
              ) : exerciseHistory && exerciseHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={exerciseHistory}>
                    <defs>
                      <linearGradient
                        id="colorWeight"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--primary))"
                          stopOpacity={0.2}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="formattedDate"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      domain={["dataMin - 10", "dataMax + 10"]}
                    />
                    <Tooltip />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-gray-500">
                    No data available for this exercise.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-gray-500">Starting</p>
                <p className="text-lg font-semibold text-gray-800">
                  {progressStats.starting} lbs
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Current</p>
                <p className="text-lg font-semibold text-primary">
                  {progressStats.current} lbs
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Increase</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {progressStats.increasePercent > 0 ? "+" : ""}
                  {progressStats.increasePercent}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h3 className="text-base font-medium text-gray-800 mb-3">
            Recent Sets
          </h3>
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Weight
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Reps
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoadingSets ? (
                    [...Array(5)].map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
                        </td>
                      </tr>
                    ))
                  ) : recentSets && recentSets.length > 0 ? (
                    recentSets.map((set, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {set.formattedDate}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {set.weight} lbs
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {set.reps}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-4 text-sm text-center text-gray-500"
                      >
                        No recent sets found for this exercise.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <h3 className="text-base font-medium text-gray-800 mb-3">
            Set a Goal
          </h3>
          <Card>
            <CardContent className="p-4">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="targetWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Weight</FormLabel>
                        <div className="flex">
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500">
                            lbs
                          </span>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="targetDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Target Date</FormLabel>
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

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createGoal.isPending}
                  >
                    {createGoal.isPending ? "Setting Goal..." : "Set Goal"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
