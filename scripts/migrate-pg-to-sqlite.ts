import path from 'path';
import Database from 'better-sqlite3';
import { client as pgClient } from '../server/db';
import { sql } from 'drizzle-orm';

async function fetchPgRows(table: string) {
  const res = await pgClient.unsafe(sql`SELECT * FROM ${sql.raw(table)}`);
  return res;
}

async function main() {
  const dbPath = path.resolve(process.cwd(), 'data.db');
  const sqlite = new Database(dbPath);

  console.log('Opened sqlite at', dbPath);

  // Create tables if not exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS exercise_types (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      notes TEXT,
      category TEXT,
      created TEXT
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      date TEXT,
      duration INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY,
      workout_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sets TEXT -- JSON
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      exercise_name TEXT,
      target_weight INTEGER,
      target_reps INTEGER,
      target_date TEXT,
      is_completed INTEGER,
      current_progress INTEGER
    );
  `);

  try {
    // Copy exercise_types
    const pgExerciseTypes = await pgClient.sql`SELECT * FROM exercise_types`.list();
    const insertExerciseType = sqlite.prepare(`
      INSERT OR REPLACE INTO exercise_types (id, name, description, notes, category, created)
      VALUES (@id, @name, @description, @notes, @category, @created)
    `);
    const etTxn = sqlite.transaction((rows: any[]) => {
      for (const r of rows) {
        insertExerciseType.run({
          id: r.id,
          name: r.name,
          description: r.description,
          notes: r.notes,
          category: r.category,
          created: r.created ? r.created.toString() : null
        });
      }
    });
    etTxn(pgExerciseTypes as any[]);
    console.log(`Copied ${pgExerciseTypes.length} exercise_types`);

    // Copy workouts
    const pgWorkouts = await pgClient.sql`SELECT * FROM workouts`.list();
    const insertWorkout = sqlite.prepare(`
      INSERT OR REPLACE INTO workouts (id, name, date, duration, notes)
      VALUES (@id, @name, @date, @duration, @notes)
    `);
    const wTxn = sqlite.transaction((rows: any[]) => {
      for (const r of rows) {
        insertWorkout.run({
          id: r.id,
          name: r.name,
          date: r.date ? r.date.toString() : null,
          duration: r.duration,
          notes: r.notes
        });
      }
    });
    wTxn(pgWorkouts as any[]);
    console.log(`Copied ${pgWorkouts.length} workouts`);

    // Copy exercises
    const pgExercises = await pgClient.sql`SELECT * FROM exercises`.list();
    const insertExercise = sqlite.prepare(`
      INSERT OR REPLACE INTO exercises (id, workout_id, name, sets)
      VALUES (@id, @workout_id, @name, @sets)
    `);
    const eTxn = sqlite.transaction((rows: any[]) => {
      for (const r of rows) {
        insertExercise.run({
          id: r.id,
          workout_id: r.workout_id,
          name: r.name,
          sets: JSON.stringify(r.sets)
        });
      }
    });
    eTxn(pgExercises as any[]);
    console.log(`Copied ${pgExercises.length} exercises`);

    // Copy goals
    const pgGoals = await pgClient.sql`SELECT * FROM goals`.list();
    const insertGoal = sqlite.prepare(`
      INSERT OR REPLACE INTO goals (id, name, exercise_name, target_weight, target_reps, target_date, is_completed, current_progress)
      VALUES (@id, @name, @exercise_name, @target_weight, @target_reps, @target_date, @is_completed, @current_progress)
    `);
    const gTxn = sqlite.transaction((rows: any[]) => {
      for (const r of rows) {
        insertGoal.run({
          id: r.id,
          name: r.name,
          exercise_name: r.exercise_name,
          target_weight: r.target_weight,
          target_reps: r.target_reps,
          target_date: r.target_date ? r.target_date.toString() : null,
          is_completed: r.is_completed ? 1 : 0,
          current_progress: r.current_progress
        });
      }
    });
    gTxn(pgGoals as any[]);
    console.log(`Copied ${pgGoals.length} goals`);

    console.log('Migration complete');
  } catch (error) {
    console.error('Migration error', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await pgClient.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
