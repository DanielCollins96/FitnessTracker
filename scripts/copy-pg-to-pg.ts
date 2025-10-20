import postgres from 'postgres';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const srcUrl = process.env.DATABASE_URL;
const dstUrl = process.env.TARGET_DATABASE_URL;

if (!srcUrl) {
  console.error('SOURCE DATABASE_URL not set in environment');
  process.exit(1);
}

if (!dstUrl) {
  console.error('TARGET_DATABASE_URL not set in environment (set TARGET_DATABASE_URL)');
  process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

const src = postgres(srcUrl);
const dst = postgres(dstUrl);

async function copyTable(table: string, columns: string[], jsonbColumns: string[] = []) {
  console.log(`\nCopying table: ${table}`);
  const rows = await src.unsafe(`SELECT ${columns.join(', ')} FROM ${table}`);
  console.log(`Found ${rows.length} rows in source ${table}`);

  if (dryRun) return rows.length;

  if (rows.length === 0) {
    console.log(`No rows to copy for ${table}`);
    return 0;
  }

  // Use batch inserts for better performance
  const BATCH_SIZE = 100;
  let insertedCount = 0;

  await dst.begin(async tx => {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      
      // Build multi-row insert
      const colList = columns.join(', ');
      const valuesClauses = batch.map((_, batchIdx) => {
        const offset = batchIdx * columns.length;
        const placeholders = columns.map((_, colIdx) => `$${offset + colIdx + 1}`).join(', ');
        return `(${placeholders})`;
      }).join(', ');
      
      const insertSql = `INSERT INTO ${table} (${colList}) VALUES ${valuesClauses} ON CONFLICT (id) DO NOTHING`;
      
      // Flatten all values for the batch
      const allVals = batch.flatMap(r => 
        columns.map((c) => {
          const v = (r as any)[c];
          // Handle JSONB columns
          if (jsonbColumns.includes(c) && v !== null) {
            return JSON.stringify(v);
          }
          return v;
        })
      );

      try {
        await tx.unsafe(insertSql, allVals);
        insertedCount += batch.length;
      } catch (err) {
        console.error(`Error inserting batch into ${table}:`, err);
        throw err;
      }
    }
  });

  console.log(`Inserted ${insertedCount} rows (some may have been skipped due to conflicts)`);
  return rows.length;
}

async function main() {
  console.log('Starting copy from', srcUrl, 'to', dstUrl, dryRun ? '(dry-run)' : '');

  try {
    // Copy tables in order respecting FK constraints:
    // 1. Tables with no FKs: users, exercise_types, workouts, goals
    // 2. Tables with FKs: exercises (FK to workouts), workout_routines (no FK actually), routine_exercises (FK to workout_routines & exercise_types)

    console.log('\n=== Copying tables (in FK-safe order) ===');

    // Phase 1: Independent tables
    const usersCols = ['id', 'username', 'password'];
    const exerciseTypesCols = ['id', 'name', 'description', 'notes', 'category', 'created'];
    const workoutsCols = ['id', 'name', 'date', 'duration', 'notes'];
    const goalsCols = ['id', 'name', 'exercise_name', 'target_weight', 'target_reps', 'target_date', 'is_completed', 'current_progress'];
    const workoutRoutinesCols = ['id', 'name', 'description', 'category', 'created'];

    const usersCount = await copyTable('users', usersCols);
    const etCount = await copyTable('exercise_types', exerciseTypesCols);
    const wCount = await copyTable('workouts', workoutsCols);
    const gCount = await copyTable('goals', goalsCols);
    const wrCount = await copyTable('workout_routines', workoutRoutinesCols);

    // Phase 2: Dependent tables (have FKs)
    const exercisesCols = ['id', 'workout_id', 'name', 'sets'];
    const routineExercisesCols = ['id', 'routine_id', 'exercise_type_id', 'order_index', 'default_sets', 'default_reps', 'notes'];

    const eCount = await copyTable('exercises', exercisesCols, ['sets']); // 'sets' is JSONB
    const reCount = await copyTable('routine_exercises', routineExercisesCols);

    console.log('\n=== Copy Summary ===');
    console.log(` users: ${usersCount}`);
    console.log(` exercise_types: ${etCount}`);
    console.log(` workouts: ${wCount}`);
    console.log(` exercises: ${eCount}`);
    console.log(` goals: ${gCount}`);
    console.log(` workout_routines: ${wrCount}`);
    console.log(` routine_exercises: ${reCount}`);

    // Fix sequences: align them to MAX(id) so next inserts don't cause duplicate key errors
    if (!dryRun) {
      console.log('\n=== Aligning sequences ===');
      await dst.unsafe(`
        SELECT setval(pg_get_serial_sequence('users','id'), COALESCE((SELECT MAX(id) FROM users),0)+1, false);
        SELECT setval(pg_get_serial_sequence('exercise_types','id'), COALESCE((SELECT MAX(id) FROM exercise_types),0)+1, false);
        SELECT setval(pg_get_serial_sequence('workouts','id'), COALESCE((SELECT MAX(id) FROM workouts),0)+1, false);
        SELECT setval(pg_get_serial_sequence('exercises','id'), COALESCE((SELECT MAX(id) FROM exercises),0)+1, false);
        SELECT setval(pg_get_serial_sequence('goals','id'), COALESCE((SELECT MAX(id) FROM goals),0)+1, false);
        SELECT setval(pg_get_serial_sequence('workout_routines','id'), COALESCE((SELECT MAX(id) FROM workout_routines),0)+1, false);
        SELECT setval(pg_get_serial_sequence('routine_exercises','id'), COALESCE((SELECT MAX(id) FROM routine_exercises),0)+1, false);
      `);
      console.log('✓ All sequences aligned successfully');
    }

  } catch (error) {
    console.error('Copy failed:', error);
    process.exit(1);
  } finally {
    await src.end();
    await dst.end();
  }
}

main();
