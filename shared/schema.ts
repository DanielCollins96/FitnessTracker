import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// We still keep the users table for future use
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Exercise Types table
export const exerciseTypes = pgTable("exercise_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  notes: text("notes"),
  category: text("category"),
  created: timestamp("created").notNull().defaultNow(),
});

export const insertExerciseTypeSchema = createInsertSchema(exerciseTypes).omit({
  id: true,
  created: true
});

export type InsertExerciseType = z.infer<typeof insertExerciseTypeSchema>;
export type ExerciseType = typeof exerciseTypes.$inferSelect;

// Workouts table
export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  date: timestamp("date").notNull().defaultNow(),
  duration: integer("duration"), // in minutes
  notes: text("notes"),
});

export const insertWorkoutSchema = createInsertSchema(workouts).omit({ 
  id: true 
});

export type InsertWorkout = z.infer<typeof insertWorkoutSchema>;
export type Workout = typeof workouts.$inferSelect;

// Exercises table
export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  workoutId: integer("workout_id").notNull(),
  name: text("name").notNull(),
  sets: jsonb("sets").notNull().$type<Array<{ weight: number; reps: number }>>(),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({ 
  id: true 
});

export type ExerciseSet = { weight: number; reps: number };
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Goals table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  exerciseName: text("exercise_name"),
  targetWeight: integer("target_weight"),
  targetReps: integer("target_reps"),
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false),
  currentProgress: integer("current_progress"), // this could be weight or count depending on goal type
});

export const insertGoalSchema = createInsertSchema(goals).omit({ 
  id: true 
});

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

// Complete schema with all workout data
export const workoutWithExercisesSchema = z.object({
  workout: z.object({
    id: z.number().optional(),
    name: z.string(),
    date: z.date(),
    duration: z.number().optional(),
    notes: z.string().optional(),
  }),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.array(z.object({
      weight: z.number(),
      reps: z.number(),
    })),
  })),
});

export type WorkoutWithExercises = z.infer<typeof workoutWithExercisesSchema>;
