import { InsertExercise, Exercise, InsertWorkout, Workout, InsertGoal, Goal, WorkoutWithExercises, InsertExerciseType, ExerciseType } from "@shared/schema";

export interface IStorage {
  // Workout operations
  getWorkouts(): Promise<Workout[]>;
  getWorkout(id: number): Promise<Workout | undefined>;
  createWorkout(workout: InsertWorkout): Promise<Workout>;
  updateWorkout(id: number, workout: Partial<InsertWorkout>): Promise<Workout | undefined>;
  deleteWorkout(id: number): Promise<boolean>;
  
  // Exercise operations
  getExercises(workoutId: number): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: number, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: number): Promise<boolean>;
  
  // Exercise Type operations
  getExerciseTypes(): Promise<ExerciseType[]>;
  getExerciseType(id: number): Promise<ExerciseType | undefined>;
  getExerciseTypeByName(name: string): Promise<ExerciseType | undefined>;
  createExerciseType(exerciseType: InsertExerciseType): Promise<ExerciseType>;
  updateExerciseType(id: number, exerciseType: Partial<InsertExerciseType>): Promise<ExerciseType | undefined>;
  deleteExerciseType(id: number): Promise<boolean>;
  
  // Goal operations
  getGoals(): Promise<Goal[]>;
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<InsertGoal>): Promise<Goal | undefined>;
  deleteGoal(id: number): Promise<boolean>;
  
  // Combined operations
  createWorkoutWithExercises(data: WorkoutWithExercises): Promise<{ workout: Workout, exercises: Exercise[] }>;
  getWorkoutWithExercises(workoutId: number): Promise<{ workout: Workout, exercises: Exercise[] } | undefined>;
  getRecentWorkouts(limit: number): Promise<{ workout: Workout, exercises: Exercise[] }[]>;
  
  // Progress tracking operations
  getExerciseHistory(exerciseName: string): Promise<{ date: Date, weight: number, reps: number }[]>;
  getExerciseSets(exerciseName: string, limit: number): Promise<{ date: Date, weight: number, reps: number }[]>;
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

  // Exercise Type method definitions for use in constructor
  private _createExerciseType(exerciseType: InsertExerciseType): ExerciseType {
    const id = this.exerciseTypeIdCounter++;
    const created = new Date();
    const newExerciseType: ExerciseType = { ...exerciseType, id, created };
    this.exerciseTypes.set(id, newExerciseType);
    return newExerciseType;
  }

  constructor() {
    this.workouts = new Map();
    this.exercises = new Map();
    this.goals = new Map();
    this.exerciseTypes = new Map();
    this.workoutIdCounter = 1;
    this.exerciseIdCounter = 1;
    this.goalIdCounter = 1;
    this.exerciseTypeIdCounter = 1;
    
    // Add some initial goals for demo
    this.createGoal({
      name: "Weekly Workouts",
      targetReps: 5,
      currentProgress: 3,
      isCompleted: false
    });
    
    this.createGoal({
      name: "Increase Bench Press",
      exerciseName: "Bench Press",
      targetWeight: 185,
      currentProgress: 165,
      targetDate: new Date("2024-01-31")
    });
    
    // Add some initial exercise types
    this._createExerciseType({
      name: "Bench Press",
      description: "A compound chest exercise",
      notes: "Keep shoulders back and down, feet planted firmly on the ground",
      category: "Chest"
    });
    
    this._createExerciseType({
      name: "Squat",
      description: "A compound lower body exercise",
      notes: "Keep your knees tracking over your toes, maintain a neutral spine",
      category: "Legs"
    });
    
    this._createExerciseType({
      name: "Deadlift",
      description: "A compound posterior chain exercise",
      notes: "Start with the bar over mid-foot, keep the bar close to your body",
      category: "Back"
    });
  }

  // Workout methods
  async getWorkouts(): Promise<Workout[]> {
    return [...this.workouts.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    
    const updatedWorkout = { ...existingWorkout, ...workout };
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
    const newExerciseType: ExerciseType = { ...exerciseType, id, created };
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
    const newGoal: Goal = { ...goal, id };
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
      duration: data.workout.duration,
      notes: data.workout.notes
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
}

export const storage = new MemStorage();
