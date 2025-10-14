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

async function copyTable(table: string, columns: string[]) {
  console.log(`\nCopying table: ${table}`);
  const rows = await src.unsafe(`SELECT ${columns.join(', ')} FROM ${table}`);
  console.log(`Found ${rows.length} rows in source ${table}`);

  if (dryRun) return rows.length;

  // Build up insert statements using parameterized queries
  const colList = columns.join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  // Use ON CONFLICT DO NOTHING so we only insert new records
  const insertSql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;

  await dst.begin(async tx => {
    for (const r of rows) {
      const vals = columns.map((c) => {
        const v = (r as any)[c];
        // If the column is 'sets' (JSONB), stringify for text param passing
        if (c === 'sets') return JSON.stringify(v);
        // Dates/timestamps from postgres-driver can be Date objects; pass as-is
        return v;
      });

      try {
        await tx.unsafe(insertSql, vals);
      } catch (err) {
        console.error(`Error inserting into ${table}:`, err);
        throw err;
      }
    }
  });

  return rows.length;
}

async function main() {
  console.log('Starting copy from', srcUrl, 'to', dstUrl, dryRun ? '(dry-run)' : '');

  try {
    // Copy exercise_types
    await dst.begin(async tx => {
      // Ensure exercise_types table exists in target - assume same schema exists
      // Optionally, you could create tables here if missing
    });

    // Important: copy in an order that respects FK constraints
    // exercise_types (no FK), workouts (no FK), then exercises (FK workout_id), goals (no FK)

    const exerciseTypesCols = ['id', 'name', 'description', 'notes', 'category', 'created'];
    const workoutsCols = ['id', 'name', 'date', 'duration', 'notes'];
    const exercisesCols = ['id', 'workout_id', 'name', 'sets'];
    const goalsCols = ['id', 'name', 'exercise_name', 'target_weight', 'target_reps', 'target_date', 'is_completed', 'current_progress'];

    const etCount = await copyTable('exercise_types', exerciseTypesCols);
    const wCount = await copyTable('workouts', workoutsCols);
    const eCount = await copyTable('exercises', exercisesCols);
    const gCount = await copyTable('goals', goalsCols);

    console.log('\nDone. Summary:');
    console.log(` exercise_types: ${etCount}`);
    console.log(` workouts: ${wCount}`);
    console.log(` exercises: ${eCount}`);
    console.log(` goals: ${gCount}`);

  } catch (error) {
    console.error('Copy failed:', error);
    process.exit(1);
  } finally {
    await src.end();
    await dst.end();
  }
}

main();
