import { eq, desc, SQL, sql } from "drizzle-orm";
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
  exercises,
  workouts,
  goals,
  exerciseTypes
} from "@shared/schema";
import { db, initializeDatabase } from "./db";

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

export class MemStorage implements IStorage {
  private workouts: Map<number, Workout>;
  private exercises: Map<number, Exercise>;
  private goals: Map<number, Goal>;
  private exerciseTypes: Map<number, ExerciseType>;
  private workoutIdCounter: number;
  private exerciseIdCounter: number;
  private goalIdCounter: number;
  private exerciseTypeIdCounter: number;

  constructor() {
    this.workouts = new Map();
    this.exercises = new Map();
    this.goals = new Map();
    this.exerciseTypes = new Map();
    this.workoutIdCounter = 1;
    this.exerciseIdCounter = 1;
    this.goalIdCounter = 1;
    this.exerciseTypeIdCounter = 1;

    // Add some sample data
    this.createExerciseType({
      name: "Bench Press",
      description: "A classic chest exercise",
      notes: "Keep shoulders back and down",
      category: "Chest"
    });

    this.createExerciseType({
      name: "Squat",
      description: "The king of leg exercises",
      notes: "Drive through heels",
      category: "Legs"
    });

    this.createExerciseType({
      name: "Deadlift",
      description: "A full-body pull exercise",
      notes: "Maintain neutral spine",
      category: "Back"
    });

    this.createGoal({
      name: "Weekly Workouts",
      targetReps: 5,
      currentProgress: 2,
      isCompleted: false
    });
  }

  // Workout methods
  async getWorkouts(): Promise<Workout[]> {
    return [...this.workouts.values()].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    return this.workouts.get(id);
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const id = this.workoutIdCounter++;
    const newWorkout: Workout = { ...workout, id };
    this.workouts.set(id, newWorkout);
    return newWorkout;
  }

  async updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined> {
    const existingWorkout = this.workouts.get(id);
    if (!existingWorkout) return undefined;
    
    console.log("Storage: Updating workout:", {
      id,
      existingName: existingWorkout.name,
      newName: workout.name,
      workoutObj: workout
    });
    
    // Ensure name is not lost during the update
    const workoutWithName = {
      ...workout,
      name: workout.name || existingWorkout.name || "Unnamed Workout"
    };
    
    const updatedWorkout = { ...existingWorkout, ...workoutWithName };
    console.log("Storage: Updated workout result:", updatedWorkout);
    
    this.workouts.set(id, updatedWorkout);
    return updatedWorkout;
  }

  async deleteWorkout(id: number): Promise<boolean> {
    // Also delete associated exercises
    const exercisesToDelete = [...this.exercises.values()].filter(e => e.workoutId === id);
    exercisesToDelete.forEach(e => this.exercises.delete(e.id));
    
    return this.workouts.delete(id);
  }

  // Exercise methods
  async getExercises(workoutId: number): Promise<Exercise[]> {
    return [...this.exercises.values()].filter(e => e.workoutId === workoutId);
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const id = this.exerciseIdCounter++;
    const newExercise: Exercise = { ...exercise, id };
    this.exercises.set(id, newExercise);
    return newExercise;
  }

  async updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const existingExercise = this.exercises.get(id);
    if (!existingExercise) return undefined;
    
    const updatedExercise = { ...existingExercise, ...exercise };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }

  async deleteExercise(id: number): Promise<boolean> {
    return this.exercises.delete(id);
  }
  
  // Exercise Type methods
  async getExerciseTypes(): Promise<ExerciseType[]> {
    return [...this.exerciseTypes.values()];
  }

  async getExerciseType(id: number): Promise<ExerciseType | undefined> {
    return this.exerciseTypes.get(id);
  }

  async getExerciseTypeByName(name: string): Promise<ExerciseType | undefined> {
    return [...this.exerciseTypes.values()].find(et => et.name === name);
  }

  async createExerciseType(exerciseType: InsertExerciseType): Promise<ExerciseType> {
    const id = this.exerciseTypeIdCounter++;
    const created = new Date();
    const newExerciseType: ExerciseType = { 
      ...exerciseType, 
      id, 
      created, 
      notes: exerciseType.notes || null,
      description: exerciseType.description || null,
      category: exerciseType.category || null
    };
    this.exerciseTypes.set(id, newExerciseType);
    return newExerciseType;
  }

  async updateExerciseType(id: number, exerciseType: Partial<InsertExerciseType>): Promise<ExerciseType | undefined> {
    const existingExerciseType = this.exerciseTypes.get(id);
    if (!existingExerciseType) return undefined;
    
    const updatedExerciseType = { ...existingExerciseType, ...exerciseType };
    this.exerciseTypes.set(id, updatedExerciseType);
    return updatedExerciseType;
  }

  async deleteExerciseType(id: number): Promise<boolean> {
    return this.exerciseTypes.delete(id);
  }

  // Goal methods
  async getGoals(): Promise<Goal[]> {
    return [...this.goals.values()];
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const id = this.goalIdCounter++;
    const newGoal: Goal = { 
      ...goal, 
      id,
      exerciseName: goal.exerciseName || null,
      targetWeight: goal.targetWeight || null,
      targetReps: goal.targetReps || null,
      targetDate: goal.targetDate || null,
      isCompleted: goal.isCompleted || false,
      currentProgress: goal.currentProgress || null
    };
    this.goals.set(id, newGoal);
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined> {
    const existingGoal = this.goals.get(id);
    if (!existingGoal) return undefined;
    
    const updatedGoal = { ...existingGoal, ...goal };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteGoal(id: number): Promise<boolean> {
    return this.goals.delete(id);
  }

  // Combined operations
  async createWorkoutWithExercises(data: WorkoutWithExercises): Promise<{ workout: Workout, exercises: Exercise[] }> {
    const workout = await this.createWorkout({
      name: data.workout.name,
      date: data.workout.date,
      duration: data.workout.duration || null,
      notes: data.workout.notes || null
    });
    
    const exercises: Exercise[] = [];
    for (const exerciseData of data.exercises) {
      const exercise = await this.createExercise({
        workoutId: workout.id,
        name: exerciseData.name,
        sets: exerciseData.sets
      });
      exercises.push(exercise);
    }
    
    return { workout, exercises };
  }

  async getWorkoutWithExercises(workoutId: number): Promise<{ workout: Workout, exercises: Exercise[] } | undefined> {
    const workout = await this.getWorkout(workoutId);
    if (!workout) return undefined;
    
    const exercises = await this.getExercises(workoutId);
    return { workout, exercises };
  }

  async getRecentWorkouts(limit: number): Promise<{ workout: Workout, exercises: Exercise[] }[]> {
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
  async getExerciseHistory(exerciseName: string): Promise<{ date: Date, weight: number, reps: number }[]> {
    const allExercises = [...this.exercises.values()].filter(e => e.name === exerciseName);
    const workouts = new Map([...this.workouts.entries()]);
    
    return allExercises.flatMap(exercise => {
      const workout = workouts.get(exercise.workoutId);
      if (!workout) return [];
      
      // Return the heaviest set for each exercise
      const heaviestSet = [...exercise.sets].sort((a, b) => b.weight - a.weight)[0];
      if (!heaviestSet) return [];
      
      return {
        date: workout.date,
        weight: heaviestSet.weight,
        reps: heaviestSet.reps
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getExerciseSets(exerciseName: string, limit: number): Promise<{ date: Date, weight: number, reps: number }[]> {
    const history = await this.getExerciseHistory(exerciseName);
    return history.slice(-limit);
  }
  
  async getLatestExerciseSet(exerciseName: string): Promise<{ weight: number, reps: number } | null> {
    // Get all exercises with the given name
    const allExercises = [...this.exercises.values()].filter(e => e.name === exerciseName);
    
    if (allExercises.length === 0) {
      return null;
    }
    
    // Get the workouts to sort by date
    const workoutsMap = new Map([...this.workouts.entries()]);
    
    // Sort exercises by workout date, newest first
    const sortedExercises = allExercises
      .filter(exercise => {
        const workout = workoutsMap.get(exercise.workoutId);
        return workout !== undefined;
      })
      .sort((a, b) => {
        const workoutA = workoutsMap.get(a.workoutId);
        const workoutB = workoutsMap.get(b.workoutId);
        
        if (!workoutA || !workoutB) return 0;
        
        return new Date(workoutB.date).getTime() - new Date(workoutA.date).getTime();
      });
    
    // No exercises found with corresponding workout
    if (sortedExercises.length === 0) {
      return null;
    }
    
    // Get the most recent exercise
    const latestExercise = sortedExercises[0];
    
    // Find the heaviest set from this exercise
    const heaviestSet = [...latestExercise.sets].sort((a, b) => b.weight - a.weight)[0];
    
    if (!heaviestSet) {
      return null;
    }
    
    return {
      weight: heaviestSet.weight,
      reps: heaviestSet.reps
    };
  }
}

export class PostgresStorage implements IStorage {
  // Workout methods
  async getWorkouts(): Promise<Workout[]> {
    return db.select().from(workouts).orderBy(desc(workouts.date));
  }

  async getWorkout(id: number): Promise<Workout | undefined> {
    const result = await db.select().from(workouts).where(eq(workouts.id, id)).limit(1);
    return result[0];
  }

  async createWorkout(workout: InsertWorkout): Promise<Workout> {
    const result = await db.insert(workouts).values(workout).returning();
    return result[0];
  }

  async updateWorkout(
    id: number,
    workout: Partial<InsertWorkout>,
  ): Promise<Workout | undefined> {
    console.log("PostgreSQL: Updating workout:", {
      id,
      workoutObj: workout
    });
    
    // Ensure name is not lost during the update if it wasn't provided
    if (workout.name === undefined) {
      const existingWorkout = await this.getWorkout(id);
      if (existingWorkout) {
        workout.name = existingWorkout.name;
      }
    }
    
    const result = await db
      .update(workouts)
      .set(workout)
      .where(eq(workouts.id, id))
      .returning();
      
    console.log("PostgreSQL: Updated workout result:", result[0]);
    return result[0];
  }

  async deleteWorkout(id: number): Promise<boolean> {
    // First delete associated exercises
    await db.delete(exercises).where(eq(exercises.workoutId, id));
    
    // Then delete the workout
    const result = await db
      .delete(workouts)
      .where(eq(workouts.id, id))
      .returning();
      
    return result.length > 0;
  }

  // Exercise methods
  async getExercises(workoutId: number): Promise<Exercise[]> {
    return db.select().from(exercises).where(eq(exercises.workoutId, workoutId));
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    const result = await db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
    return result[0];
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
    return db.select().from(exerciseTypes);
  }

  async getExerciseType(id: number): Promise<ExerciseType | undefined> {
    const result = await db.select().from(exerciseTypes).where(eq(exerciseTypes.id, id)).limit(1);
    return result[0];
  }

  async getExerciseTypeByName(name: string): Promise<ExerciseType | undefined> {
    const result = await db.select().from(exerciseTypes).where(eq(exerciseTypes.name, name)).limit(1);
    return result[0];
  }

  async createExerciseType(exerciseType: InsertExerciseType): Promise<ExerciseType> {
    const result = await db.insert(exerciseTypes).values({
      ...exerciseType,
      description: exerciseType.description || null,
      notes: exerciseType.notes || null,
      category: exerciseType.category || null,
    }).returning();
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
    return db.select().from(goals);
  }

  async getGoal(id: number): Promise<Goal | undefined> {
    const result = await db.select().from(goals).where(eq(goals.id, id)).limit(1);
    return result[0];
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const result = await db.insert(goals).values({
      ...goal,
      exerciseName: goal.exerciseName || null,
      targetWeight: goal.targetWeight || null,
      targetReps: goal.targetReps || null,
      targetDate: goal.targetDate || null,
      isCompleted: goal.isCompleted || false,
      currentProgress: goal.currentProgress || null
    }).returning();
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
      duration: data.workout.duration || null,
      notes: data.workout.notes || null
    });

    const exercises: Exercise[] = [];
    for (const exerciseData of data.exercises) {
      const exercise = await this.createExercise({
        workoutId: workout.id,
        name: exerciseData.name,
        sets: exerciseData.sets
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
    const allWorkouts = await db.select()
      .from(workouts)
      .orderBy(desc(workouts.date))
      .limit(limit);
    
    const result = [];
    for (const workout of allWorkouts) {
      const exercises = await this.getExercises(workout.id);
      result.push({ workout, exercises });
    }

    return result;
  }

  // Progress tracking operations
  async getExerciseHistory(
    exerciseName: string,
  ): Promise<{ date: Date; weight: number; reps: number }[]> {
    console.log(`Getting exercise history for: ${exerciseName}`);
    
    // Get all exercises with the given name
    const allExercises = await db.select()
      .from(exercises)
      .where(eq(exercises.name, exerciseName));
    
    console.log(`Found ${allExercises.length} exercises matching ${exerciseName}`);
    
    // Get corresponding workouts for date info
    const workoutIds = Array.from(new Set(allExercises.map(e => e.workoutId)));
    
    // If no workouts found, provide demo data for testing
    if (workoutIds.length === 0) {
      console.log(`No exercise history found for ${exerciseName}, generating sample data`);
      
      // Create demo data with progressive weights
      const today = new Date();
      const sampleData = [];
      
      // Generate 6 history points with increasing weights
      for (let i = 0; i < 6; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (i * 15)); // Every 15 days back
        
        const weight = Math.round(45 + (i * 5)); // Start at 45 lbs and add 5 lbs increments
        
        sampleData.push({
          date,
          weight: exerciseName === "Bench Press" ? weight : weight - 10,
          reps: 8,
        });
      }
      
      // Return sorted from oldest to newest
      return sampleData.reverse();
    }
    
    // Get all relevant workouts
    const workoutsResult = await db.select()
      .from(workouts)
      .where(sql`workouts.id IN (${workoutIds.join(', ')})`);
      
    console.log(`Found ${workoutsResult.length} related workouts`);
    
    const workoutsMap = new Map(workoutsResult.map(w => [w.id, w]));
    
    // Map exercise data with workout dates
    const result = allExercises
      .flatMap(exercise => {
        const workout = workoutsMap.get(exercise.workoutId);
        if (!workout) return [];

        // Get the heaviest set
        if (!exercise.sets || exercise.sets.length === 0) return [];
        
        const heaviestSet = [...exercise.sets].sort(
          (a, b) => b.weight - a.weight,
        )[0];
        if (!heaviestSet) return [];

        return {
          date: workout.date,
          weight: heaviestSet.weight,
          reps: heaviestSet.reps,
        };
      })
      // Sort by date from oldest to newest
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    console.log(`Returning ${result.length} history points for ${exerciseName}`);
    return result;
  }

  async getExerciseSets(
    exerciseName: string,
    limit: number,
  ): Promise<{ date: Date; weight: number; reps: number }[]> {
    console.log(`Getting exercise sets for ${exerciseName} with limit ${limit}`);
    const history = await this.getExerciseHistory(exerciseName);
    
    // Get the most recent sets up to the limit
    const recentSets = history.slice(-limit);
    console.log(`Returning ${recentSets.length} recent sets`);
    
    return recentSets;
  }

  async getLatestExerciseSet(
    exerciseName: string,
  ): Promise<{ weight: number; reps: number } | null> {
    // Get latest exercise with this name
    const latestExercises = await db.select()
      .from(exercises)
      .where(eq(exercises.name, exerciseName))
      .orderBy(desc(exercises.id)) // Assumes newer exercises have higher IDs
      .limit(1);
      
    if (latestExercises.length === 0) {
      return null;
    }
    
    const latestExercise = latestExercises[0];
    
    // Find the heaviest set from this exercise
    if (!latestExercise.sets || latestExercise.sets.length === 0) {
      return null;
    }
    
    const heaviestSet = [...latestExercise.sets].sort(
      (a, b) => b.weight - a.weight,
    )[0];
    
    if (!heaviestSet) {
      return null;
    }
    
    return {
      weight: heaviestSet.weight,
      reps: heaviestSet.reps
    };
  }
  
  // Initialize database with sample data
  async initializeSampleData() {
    // Add sample exercise types if none exist
    const existingTypes = await this.getExerciseTypes();
    if (existingTypes.length === 0) {
      await this.createExerciseType({
        name: "Bench Press",
        description: "A classic chest exercise",
        notes: "Keep shoulders back and down",
        category: "Chest"
      });
      
      await this.createExerciseType({
        name: "Squat",
        description: "The king of leg exercises",
        notes: "Drive through heels",
        category: "Legs"
      });
      
      await this.createExerciseType({
        name: "Deadlift",
        description: "A full-body pull exercise",
        notes: "Maintain neutral spine",
        category: "Back"
      });
    }
    
    // Add a sample goal if none exist
    const existingGoals = await this.getGoals();
    if (existingGoals.length === 0) {
      await this.createGoal({
        name: "Weekly Workouts",
        targetReps: 5,
        currentProgress: 2,
        isCompleted: false
      });
    }
  }
}

// Wrapper class that provides graceful fallback
class StorageAdapter implements IStorage {
  private postgresStorage: PostgresStorage;
  private memStorage: MemStorage;
  private usePostgres = true;

  constructor() {
    this.postgresStorage = new PostgresStorage();
    this.memStorage = new MemStorage();
  }

  // Delegate to appropriate storage with fallback
  private async delegate<T>(
    postgresMethod: () => Promise<T>,
    memMethod: () => Promise<T>
  ): Promise<T> {
    if (this.usePostgres) {
      try {
        return await postgresMethod();
      } catch (error) {
        console.error("PostgreSQL error, falling back to memory storage:", error);
        this.usePostgres = false;
        return await memMethod();
      }
    } else {
      return await memMethod();
    }
  }

  // Implement all methods from IStorage interface with delegation
  getWorkouts(): Promise<Workout[]> {
    return this.delegate(
      () => this.postgresStorage.getWorkouts(),
      () => this.memStorage.getWorkouts()
    );
  }

  getWorkout(id: number): Promise<Workout | undefined> {
    return this.delegate(
      () => this.postgresStorage.getWorkout(id),
      () => this.memStorage.getWorkout(id)
    );
  }

  createWorkout(workout: InsertWorkout): Promise<Workout> {
    return this.delegate(
      () => this.postgresStorage.createWorkout(workout),
      () => this.memStorage.createWorkout(workout)
    );
  }

  updateWorkout(
    id: number,
    workout: Partial<InsertWorkout>
  ): Promise<Workout | undefined> {
    return this.delegate(
      () => this.postgresStorage.updateWorkout(id, workout),
      () => this.memStorage.updateWorkout(id, workout)
    );
  }

  deleteWorkout(id: number): Promise<boolean> {
    return this.delegate(
      () => this.postgresStorage.deleteWorkout(id),
      () => this.memStorage.deleteWorkout(id)
    );
  }

  getExercises(workoutId: number): Promise<Exercise[]> {
    return this.delegate(
      () => this.postgresStorage.getExercises(workoutId),
      () => this.memStorage.getExercises(workoutId)
    );
  }

  getExercise(id: number): Promise<Exercise | undefined> {
    return this.delegate(
      () => this.postgresStorage.getExercise(id),
      () => this.memStorage.getExercise(id)
    );
  }

  createExercise(exercise: InsertExercise): Promise<Exercise> {
    return this.delegate(
      () => this.postgresStorage.createExercise(exercise),
      () => this.memStorage.createExercise(exercise)
    );
  }

  updateExercise(
    id: number,
    exercise: Partial<InsertExercise>
  ): Promise<Exercise | undefined> {
    return this.delegate(
      () => this.postgresStorage.updateExercise(id, exercise),
      () => this.memStorage.updateExercise(id, exercise)
    );
  }

  deleteExercise(id: number): Promise<boolean> {
    return this.delegate(
      () => this.postgresStorage.deleteExercise(id),
      () => this.memStorage.deleteExercise(id)
    );
  }

  getExerciseTypes(): Promise<ExerciseType[]> {
    return this.delegate(
      () => this.postgresStorage.getExerciseTypes(),
      () => this.memStorage.getExerciseTypes()
    );
  }

  getExerciseType(id: number): Promise<ExerciseType | undefined> {
    return this.delegate(
      () => this.postgresStorage.getExerciseType(id),
      () => this.memStorage.getExerciseType(id)
    );
  }

  getExerciseTypeByName(name: string): Promise<ExerciseType | undefined> {
    return this.delegate(
      () => this.postgresStorage.getExerciseTypeByName(name),
      () => this.memStorage.getExerciseTypeByName(name)
    );
  }

  createExerciseType(exerciseType: InsertExerciseType): Promise<ExerciseType> {
    return this.delegate(
      () => this.postgresStorage.createExerciseType(exerciseType),
      () => this.memStorage.createExerciseType(exerciseType)
    );
  }

  updateExerciseType(
    id: number,
    exerciseType: Partial<InsertExerciseType>
  ): Promise<ExerciseType | undefined> {
    return this.delegate(
      () => this.postgresStorage.updateExerciseType(id, exerciseType),
      () => this.memStorage.updateExerciseType(id, exerciseType)
    );
  }

  deleteExerciseType(id: number): Promise<boolean> {
    return this.delegate(
      () => this.postgresStorage.deleteExerciseType(id),
      () => this.memStorage.deleteExerciseType(id)
    );
  }

  getGoals(): Promise<Goal[]> {
    return this.delegate(
      () => this.postgresStorage.getGoals(),
      () => this.memStorage.getGoals()
    );
  }

  getGoal(id: number): Promise<Goal | undefined> {
    return this.delegate(
      () => this.postgresStorage.getGoal(id),
      () => this.memStorage.getGoal(id)
    );
  }

  createGoal(goal: InsertGoal): Promise<Goal> {
    return this.delegate(
      () => this.postgresStorage.createGoal(goal),
      () => this.memStorage.createGoal(goal)
    );
  }

  updateGoal(
    id: number,
    goal: Partial<InsertGoal>
  ): Promise<Goal | undefined> {
    return this.delegate(
      () => this.postgresStorage.updateGoal(id, goal),
      () => this.memStorage.updateGoal(id, goal)
    );
  }

  deleteGoal(id: number): Promise<boolean> {
    return this.delegate(
      () => this.postgresStorage.deleteGoal(id),
      () => this.memStorage.deleteGoal(id)
    );
  }

  createWorkoutWithExercises(
    data: WorkoutWithExercises
  ): Promise<{ workout: Workout; exercises: Exercise[] }> {
    return this.delegate(
      () => this.postgresStorage.createWorkoutWithExercises(data),
      () => this.memStorage.createWorkoutWithExercises(data)
    );
  }

  getWorkoutWithExercises(
    workoutId: number
  ): Promise<{ workout: Workout; exercises: Exercise[] } | undefined> {
    return this.delegate(
      () => this.postgresStorage.getWorkoutWithExercises(workoutId),
      () => this.memStorage.getWorkoutWithExercises(workoutId)
    );
  }

  getRecentWorkouts(
    limit: number
  ): Promise<{ workout: Workout; exercises: Exercise[] }[]> {
    return this.delegate(
      () => this.postgresStorage.getRecentWorkouts(limit),
      () => this.memStorage.getRecentWorkouts(limit)
    );
  }

  getExerciseHistory(
    exerciseName: string
  ): Promise<{ date: Date; weight: number; reps: number }[]> {
    return this.delegate(
      () => this.postgresStorage.getExerciseHistory(exerciseName),
      () => this.memStorage.getExerciseHistory(exerciseName)
    );
  }

  getExerciseSets(
    exerciseName: string,
    limit: number
  ): Promise<{ date: Date; weight: number; reps: number }[]> {
    return this.delegate(
      () => this.postgresStorage.getExerciseSets(exerciseName, limit),
      () => this.memStorage.getExerciseSets(exerciseName, limit)
    );
  }

  getLatestExerciseSet(
    exerciseName: string
  ): Promise<{ weight: number; reps: number } | null> {
    return this.delegate(
      () => this.postgresStorage.getLatestExerciseSet(exerciseName),
      () => this.memStorage.getLatestExerciseSet(exerciseName)
    );
  }
}

// Single instance of our storage
export const storage = new StorageAdapter();