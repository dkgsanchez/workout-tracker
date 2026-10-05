import { pool } from '../db.js'
import type { Exercise } from '../types/exercise.js'

async function findExercisesByWorkoutId(workoutId: number): Promise<Exercise[]> {
    const result = await pool.query<Exercise>(
        'SELECT * FROM exercises WHERE workout_id = $1',
        [workoutId]
    );
    return result.rows;
}

export { findExercisesByWorkoutId }