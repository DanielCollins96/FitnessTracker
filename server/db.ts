import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@shared/schema";
import { sql } from "drizzle-orm";

// Database connection
export const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
export const client = postgres(connectionString);
export const db = drizzle(client, { schema });

// Run migrations
export async function runMigrations() {
  try {
    console.log("Checking database tables...");
    
    // Basic check if the tables exist
    try {
      const result = await db.execute(sql`SELECT to_regclass('workouts')`);
      const exists = result[0]?.to_regclass !== null;
      
      if (exists) {
        console.log("Database tables already exist");
        return true;
      }
      
      // Create tables if they don't exist
      console.log("Creating database tables...");
      
      // Create exercise_types table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS exercise_types (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          notes TEXT,
          category TEXT,
          created TIMESTAMP NOT NULL DEFAULT NOW()
        )
      `);
      
      // Create workouts table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS workouts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          date TIMESTAMP NOT NULL DEFAULT NOW(),
          duration INTEGER,
          notes TEXT
        )
      `);
      
      // Create exercises table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS exercises (
          id SERIAL PRIMARY KEY,
          workout_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          sets JSONB NOT NULL,
          CONSTRAINT fk_workout
            FOREIGN KEY(workout_id)
            REFERENCES workouts(id)
            ON DELETE CASCADE
        )
      `);
      
      // Create goals table
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          exercise_name TEXT,
          target_weight NUMERIC,
          target_reps INTEGER,
          target_date TIMESTAMP,
          is_completed BOOLEAN DEFAULT FALSE,
          current_progress INTEGER
        )
      `);
      
      console.log("Database tables created");
      return true;
    } catch (error) {
      console.error("Error creating tables:", error);
      return false;
    }
  } catch (error) {
    console.error("Error setting up database:", error);
    return false;
  }
}

// Seed data
export async function seedDatabase() {
  try {
    // Check if we have exercise types
    const existingTypes = await db.query.exerciseTypes.findMany();
    
    if (existingTypes.length === 0) {
      console.log("Seeding exercise types...");
      await db.insert(schema.exerciseTypes).values([
        {
          name: "Bench Press",
          description: "A classic chest exercise",
          notes: "Keep shoulders back and down",
          category: "Chest",
        },
        {
          name: "Squat",
          description: "The king of leg exercises",
          notes: "Drive through heels",
          category: "Legs",
        },
        {
          name: "Deadlift",
          description: "A full-body pull exercise",
          notes: "Maintain neutral spine",
          category: "Back",
        },
      ]);
    }
    
    // Check if we have goals`
    const existingGoals = await db.query.goals.findMany();
    
    if (existingGoals.length === 0) {
      console.log("Seeding goals...");
      await db.insert(schema.goals).values({
        name: "Weekly Workouts",
        targetReps: 5,
        currentProgress: 2,
        isCompleted: false,
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}

// Initialize the database
export async function initializeDatabase() {
  const migrationsSuccessful = await runMigrations();
  
  if (migrationsSuccessful) {
    await seedDatabase();
  }
  
  return migrationsSuccessful;
}