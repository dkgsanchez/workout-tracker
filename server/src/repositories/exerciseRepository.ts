import { pool } from '../db.js'
import type { Exercise } from '../types/exercise.js'

async function findExerciseById(exerciseId: number, workoutId: number): Promise<Exercise | undefined> {
    const result = await pool.query<Exercise>(
        'SELECT * FROM exercises WHERE id = $1 AND workout_id = $2',
        [exerciseId, workoutId]
    );
    return result.rows[0];
}

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

async function deleteExercise(exerciseId: number, workoutId: number): Promise<Exercise | undefined> {
    const result = await pool.query<Exercise>(
        'DELETE FROM exercises WHERE id = $1 AND workout_id = $2 RETURNING *',
        [exerciseId, workoutId]
    );
    return result.rows[0];
}

async function updateExercise(exerciseId: number, workoutId: number, name: string): Promise<Exercise | undefined> {
    const result = await pool.query<Exercise>(
        'UPDATE exercises SET name = $1 WHERE id = $2 AND workout_id = $3 RETURNING *',
        [name, exerciseId, workoutId]
    );
    return result.rows[0];
}

export { findExerciseById, findExercisesByWorkoutId, createExercise, deleteExercise, updateExercise };