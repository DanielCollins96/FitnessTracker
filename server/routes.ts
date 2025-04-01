import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWorkoutSchema, insertExerciseSchema, insertGoalSchema, workoutWithExercisesSchema, insertExerciseTypeSchema } from "@shared/schema";
import { format } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  const router = express.Router();

  // Workout routes
  router.get("/workouts", async (req, res) => {
    try {
      const workouts = await storage.getWorkouts();
      res.json(workouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workouts" });
    }
  });

  router.get("/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const workout = await storage.getWorkout(id);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout" });
    }
  });

  router.post("/workouts", async (req, res) => {
    try {
      const validatedData = insertWorkoutSchema.parse(req.body);
      const workout = await storage.createWorkout(validatedData);
      res.status(201).json(workout);
    } catch (error) {
      res.status(400).json({ message: "Invalid workout data" });
    }
  });

  router.put("/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertWorkoutSchema.partial().parse(req.body);
      const workout = await storage.updateWorkout(id, validatedData);
      if (!workout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(workout);
    } catch (error) {
      res.status(400).json({ message: "Invalid workout data" });
    }
  });

  router.delete("/workouts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteWorkout(id);
      if (!result) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete workout" });
    }
  });

  // Exercise routes
  router.get("/workouts/:workoutId/exercises", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const exercises = await storage.getExercises(workoutId);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercises" });
    }
  });

  router.post("/exercises", async (req, res) => {
    try {
      const validatedData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(validatedData);
      res.status(201).json(exercise);
    } catch (error) {
      res.status(400).json({ message: "Invalid exercise data" });
    }
  });

  router.put("/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertExerciseSchema.partial().parse(req.body);
      const exercise = await storage.updateExercise(id, validatedData);
      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(400).json({ message: "Invalid exercise data" });
    }
  });

  router.delete("/exercises/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteExercise(id);
      if (!result) {
        return res.status(404).json({ message: "Exercise not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exercise" });
    }
  });

  // Exercise Type routes
  router.get("/exercise-types", async (req, res) => {
    try {
      const exerciseTypes = await storage.getExerciseTypes();
      res.json(exerciseTypes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise types" });
    }
  });

  router.get("/exercise-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const exerciseType = await storage.getExerciseType(id);
      if (!exerciseType) {
        return res.status(404).json({ message: "Exercise type not found" });
      }
      res.json(exerciseType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise type" });
    }
  });

  router.get("/exercise-types/by-name/:name", async (req, res) => {
    try {
      const name = req.params.name;
      const exerciseType = await storage.getExerciseTypeByName(name);
      if (!exerciseType) {
        return res.status(404).json({ message: "Exercise type not found" });
      }
      res.json(exerciseType);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise type" });
    }
  });

  router.post("/exercise-types", async (req, res) => {
    try {
      const validatedData = insertExerciseTypeSchema.parse(req.body);
      const exerciseType = await storage.createExerciseType(validatedData);
      res.status(201).json(exerciseType);
    } catch (error) {
      res.status(400).json({ message: "Invalid exercise type data" });
    }
  });

  router.put("/exercise-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertExerciseTypeSchema.partial().parse(req.body);
      const exerciseType = await storage.updateExerciseType(id, validatedData);
      if (!exerciseType) {
        return res.status(404).json({ message: "Exercise type not found" });
      }
      res.json(exerciseType);
    } catch (error) {
      res.status(400).json({ message: "Invalid exercise type data" });
    }
  });

  router.delete("/exercise-types/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteExerciseType(id);
      if (!result) {
        return res.status(404).json({ message: "Exercise type not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exercise type" });
    }
  });

  // Goal routes
  router.get("/goals", async (req, res) => {
    try {
      const goals = await storage.getGoals();
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  router.post("/goals", async (req, res) => {
    try {
      const validatedData = insertGoalSchema.parse(req.body);
      const goal = await storage.createGoal(validatedData);
      res.status(201).json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  router.put("/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertGoalSchema.partial().parse(req.body);
      const goal = await storage.updateGoal(id, validatedData);
      if (!goal) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.json(goal);
    } catch (error) {
      res.status(400).json({ message: "Invalid goal data" });
    }
  });

  router.delete("/goals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.deleteGoal(id);
      if (!result) {
        return res.status(404).json({ message: "Goal not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete goal" });
    }
  });

  // Combined routes
  router.post("/workout-with-exercises", async (req, res) => {
    try {
      // Parse the date string to a Date object
      if (req.body.workout.date && typeof req.body.workout.date === 'string') {
        req.body.workout.date = new Date(req.body.workout.date);
      }
      
      const validatedData = workoutWithExercisesSchema.parse(req.body);
      const result = await storage.createWorkoutWithExercises(validatedData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating workout with exercises:", error);
      res.status(400).json({ message: "Invalid workout or exercise data" });
    }
  });

  router.get("/workout-with-exercises/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      const result = await storage.getWorkoutWithExercises(workoutId);
      if (!result) {
        return res.status(404).json({ message: "Workout not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workout with exercises" });
    }
  });
  
  router.put("/workout-with-exercises/:workoutId", async (req, res) => {
    try {
      const workoutId = parseInt(req.params.workoutId);
      
      // Parse the date string to a Date object
      if (req.body.workout.date && typeof req.body.workout.date === 'string') {
        req.body.workout.date = new Date(req.body.workout.date);
      }
      
      const validatedData = workoutWithExercisesSchema.parse(req.body);
      
      // Check if workout exists
      const existingWorkout = await storage.getWorkout(workoutId);
      if (!existingWorkout) {
        return res.status(404).json({ message: "Workout not found" });
      }
      
      // Log the incoming workout data for debugging
      console.log("Updating workout with data:", {
        workoutId,
        incomingName: validatedData.workout.name,
        existingName: existingWorkout.name
      });
      
      // Ensure the name is preserved in the update
      const workoutUpdateData = {
        ...validatedData.workout,
        name: validatedData.workout.name || existingWorkout.name || "Unnamed Workout"
      };
      
      console.log("Final workout update data:", workoutUpdateData);
      
      // Update the workout
      const updatedWorkout = await storage.updateWorkout(workoutId, workoutUpdateData);
      
      // Delete all existing exercises for this workout
      const existingExercises = await storage.getExercises(workoutId);
      for (const exercise of existingExercises) {
        await storage.deleteExercise(exercise.id);
      }
      
      // Create new exercises for the workout
      const exercises = [];
      for (const exerciseData of validatedData.exercises) {
        const exercise = await storage.createExercise({
          ...exerciseData,
          workoutId
        });
        exercises.push(exercise);
      }
      
      res.json({
        workout: updatedWorkout,
        exercises
      });
    } catch (error) {
      console.error("Error updating workout with exercises:", error);
      res.status(400).json({ message: "Invalid workout or exercise data" });
    }
  });

  router.get("/recent-workouts", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const workouts = await storage.getRecentWorkouts(limit);
      
      // Format the data for frontend consumption
      const formattedWorkouts = workouts.map(({ workout, exercises }) => {
        const formattedDate = format(new Date(workout.date), "MMM d, yyyy");
        return {
          id: workout.id,
          name: workout.name,
          date: formattedDate,
          duration: workout.duration,
          exerciseCount: exercises.length,
          exercises: exercises.map(e => e.name).slice(0, 3),
          totalExercises: exercises.length
        };
      });
      
      res.json(formattedWorkouts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent workouts" });
    }
  });

  // Progress tracking routes
  router.get("/exercise-history/:exerciseName", async (req, res) => {
    try {
      const exerciseName = req.params.exerciseName;
      const history = await storage.getExerciseHistory(exerciseName);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise history" });
    }
  });

  router.get("/exercise-sets/:exerciseName", async (req, res) => {
    try {
      const exerciseName = req.params.exerciseName;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const sets = await storage.getExerciseSets(exerciseName, limit);
      
      // Format the dates for frontend display
      const formattedSets = sets.map(set => ({
        ...set,
        formattedDate: format(new Date(set.date), "MMM d")
      }));
      
      res.json(formattedSets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exercise sets" });
    }
  });
  
  // Get the latest weight and reps for a specific exercise
  router.get("/exercise-latest/:exerciseName", async (req, res) => {
    try {
      const exerciseName = req.params.exerciseName;
      const latestSet = await storage.getLatestExerciseSet(exerciseName);
      
      if (latestSet) {
        res.json(latestSet);
      } else {
        // Return default values if no previous data exists
        res.json({
          weight: 0,
          reps: 0
        });
      }
    } catch (error) {
      console.error("Error fetching latest exercise data:", error);
      res.status(500).json({ message: "Failed to fetch latest exercise data" });
    }
  });

  app.use("/api", router);

  const httpServer = createServer(app);
  return httpServer;
}
