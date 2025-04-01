import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import {
  InsertExercise,
  Exercise,
  InsertWorkout,
  Workout,
  InsertGoal,
  Goal,
  WorkoutWithExercises,
  InsertExerciseType,
  ExerciseType,
} from "@shared/schema";

const sqlite = new Database("data.db");
const db = drizzle(sqlite);

export interface IStorage {
  // Workout operations
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(
    id: number,
    workout: Partial<InsertWorkout>,
  ): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;

  // Exercise operations
  getExercises(workoutId: number): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(
    id: number,
    exercise: Partial<InsertExercise>,
  ): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<boolean>;

  // Exercise Type operations
  getExerciseTypes(): Promise<ExerciseType[]>;
  getExerciseType(id: number): Promise<ExerciseType | undefined>;
  getExerciseTypeByName(name: string): Promise<ExerciseType | undefined>;
  createExerciseType(exerciseType: InsertExerciseType): Promise<ExerciseType>;
  updateExerciseType(
    id: number,
    exerciseType: Partial<InsertExerciseType>,
  ): Promise<ExerciseType | undefined>;
  deleteExerciseType(id: number): Promise<boolean>;

  // Goal operations
  getGoals(): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;

  // Combined operations
  createWorkoutWithExercises(
    data: WorkoutWithExercises,
  ): Promise<{ workout: Workout; exercises: Exercise[] }>;
  getWorkoutWithExercises(
    workoutId: number,
  ): Promise<{ workout: Workout; exercises: Exercise[] } | undefined>;
  getRecentWorkouts(
    limit: number,
  ): Promise<{ workout: Workout; exercises: Exercise[] }[]>;

  // Progress tracking operations
  getExerciseHistory(
    exerciseName: string,
  ): Promise<{ date: Date; weight: number; reps: number }[]>;
  getExerciseSets(
    exerciseName: string,
    limit: number,
  ): Promise<{ date: Date; weight: number; reps: number }[]>;
  getLatestExerciseSet(
    exerciseName: string,
  ): Promise<{ weight: number; reps: number } | null>;
}

export class SQLiteStorage implements IStorage {
  // Workout methods
  async getWorkouts(): Promise<Workout[]> {
    return db.query.workouts.findMany({
      orderBy: (workouts, { desc }) => [desc(workouts.date)],
    });
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return db.query.workouts.findFirst({
      where: (workouts, { eq }) => eq(workouts.id, id),
    });
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const result = await db.insert(workouts).values(workout).returning();
    return result[0];
  }

  async updateWorkout(
    id: number,
    workout: Partial<InsertWorkout>,
  ): Promise<Workout | undefined> {
    const result = await db
      .update(workouts)
      .set(workout)
      .where(eq(workouts.id, id))
      .returning();
    return result[0];
  }

  async deleteWorkout(id: number): Promise<boolean> {
    const result = await db
      .delete(workouts)
      .where(eq(workouts.id, id))
      .returning();
    return result.length > 0;
  }

  // Exercise methods
  async getExercises(workoutId: number): Promise<Exercise[]> {
    return db.query.exercises.findMany({
      where: (exercises, { eq }) => eq(exercises.workoutId, workoutId),
    });
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return db.query.exercises.findFirst({
      where: (exercises, { eq }) => eq(exercises.id, id),
    });
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const result = await db.insert(exercises).values(exercise).returning();
    return result[0];
  }

  async updateExercise(
    id: number,
    exercise: Partial<InsertExercise>,
  ): Promise<Exercise | undefined> {
    const result = await db
      .update(exercises)
      .set(exercise)
      .where(eq(exercises.id, id))
      .returning();
    return result[0];
  }

  async deleteExercise(id: number): Promise<boolean> {
    const result = await db
      .delete(exercises)
      .where(eq(exercises.id, id))
      .returning();
    return result.length > 0;
  }

  // Exercise Type methods
  async getExerciseTypes(): Promise<ExerciseType[]> {
    return db.query.exerciseTypes.findMany();
  }

  async getExerciseType(id: number): Promise<ExerciseType | undefined> {
    return db.query.exerciseTypes.findFirst({
      where: (exerciseTypes, { eq }) => eq(exerciseTypes.id, id),
    });
  }

  async getExerciseTypeByName(name: string): Promise<ExerciseType | undefined> {
    return db.query.exerciseTypes.findFirst({
      where: (exerciseTypes, { eq }) => eq(exerciseTypes.name, name),
    });
  }

  async createExerciseType(exerciseType: InsertExerciseType): Promise<ExerciseType> {
    const result = await db.insert(exerciseTypes).values(exerciseType).returning();
    return result[0];
  }

  async updateExerciseType(
    id: number,
    exerciseType: Partial<InsertExerciseType>,
  ): Promise<ExerciseType | undefined> {
    const result = await db
      .update(exerciseTypes)
      .set(exerciseType)
      .where(eq(exerciseTypes.id, id))
      .returning();
    return result[0];
  }

  async deleteExerciseType(id: number): Promise<boolean> {
    const result = await db
      .delete(exerciseTypes)
      .where(eq(exerciseTypes.id, id))
      .returning();
    return result.length > 0;
  }

  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return db.query.goals.findMany();
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return db.query.goals.findFirst({
      where: (goals, { eq }) => eq(goals.id, id),
    });
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values(goal).returning();
    return result[0];
  }

  async updateGoal(
    id: number,
    goal: Partial<InsertGoal>,
  ): Promise<Goal | undefined> {
    const result = await db
      .update(goals)
      .set(goal)
      .where(eq(goals.id, id))
      .returning();
    return result[0];
  }

  async deleteGoal(id: number): Promise<boolean> {
    const result = await db
      .delete(goals)
      .where(eq(goals.id, id))
      .returning();
    return result.length > 0;
  }

  // Combined operations
  async createWorkoutWithExercises(
    data: WorkoutWithExercises,
  ): Promise<{ workout: Workout; exercises: Exercise[] }> {
    const workout = await this.createWorkout({
      name: data.workout.name,
      date: data.workout.date,
      duration: data.workout.duration,
      notes: data.workout.notes,
    });

    const exercises: Exercise[] = [];
    for (const exerciseData of data.exercises) {
      const exercise = await this.createExercise({
        workoutId: workout.id,
        name: exerciseData.name,
        sets: exerciseData.sets,
      });
      exercises.push(exercise);
    }

    return { workout, exercises };
  }

  async getWorkoutWithExercises(
    workoutId: number,
  ): Promise<{ workout: Workout; exercises: Exercise[] } | undefined> {
    const workout = await this.getWorkout(workoutId);
    if (!workout) return undefined;

    const exercises = await this.getExercises(workoutId);
    return { workout, exercises };
  }

  async getRecentWorkouts(
    limit: number,
  ): Promise<{ workout: Workout; exercises: Exercise[] }[]> {
    const workouts = await this.getWorkouts();
    const limitedWorkouts = workouts.slice(0, limit);

    const result = [];
    for (const workout of limitedWorkouts) {
      const exercises = await this.getExercises(workout.id);
      result.push({ workout, exercises });
    }

    return result;
  }

  // Progress tracking operations
  async getExerciseHistory(
    exerciseName: string,
  ): Promise<{ date: Date; weight: number; reps: number }[]> {
    const allExercises = await db.query.exercises.findMany({
      where: (exercises, { eq }) => eq(exercises.name, exerciseName),
      with: {
        workout: true,
      },
    });

    return allExercises
      .flatMap((exercise) => {
        if (!exercise.workout) return [];

        const heaviestSet = [...exercise.sets].sort(
          (a, b) => b.weight - a.weight,
        )[0];
        if (!heaviestSet) return [];

        return {
          date: exercise.workout.date,
          weight: heaviestSet.weight,
          reps: heaviestSet.reps,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getExerciseSets(
    exerciseName: string,
    limit: number,
  ): Promise<{ date: Date; weight: number; reps: number }[]> {
    const history = await this.getExerciseHistory(exerciseName);
    return history.slice(-limit);
  }

  async getLatestExerciseSet(
    exerciseName: string,
  ): Promise<{ weight: number; reps: number } | null> {
    const allExercises = await db.query.exercises.findMany({
      where: (exercises, { eq }) => eq(exercises.name, exerciseName),
      with: {
        workout: true,
      },
      orderBy: (exercises, { desc }) => [desc(exercises.workout.date)],
      limit: 1,
    });

    if (allExercises.length === 0) {
      return null;
    }

    const latestExercise = allExercises[0];
    const heaviestSet = [...latestExercise.sets].sort(
      (a, b) => b.weight - a.weight,
    )[0];

    if (!heaviestSet) {
      return null;
    }

    return {
      weight: heaviestSet.weight,
      reps: heaviestSet.reps,
    };
  }
}

export const storage = new SQLiteStorage();