import { pool } from '../db.js'
import type { Exercise } from '../types/exercise.js'

async function findExercisesByWorkoutId(workoutId: number): Promise<Exercise[]> {
    const result = await pool.query<Exercise>(
        'SELECT * FROM exercises WHERE workout_id = $1',
        [workoutId]
    );
    return result.rows;
}

async function createExercise(workoutId: number, name: string): Promise<Exercise> {
    const result = await pool.query<Exercise>(
        'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
        [workoutId, name]
    );
    const exercise = result.rows[0];
    if (exercise === undefined) {
        throw new Error("Exercise creation succeeded without returning a row.");
    }
    return exercise;
}

export { findExercisesByWorkoutId, createExercise };