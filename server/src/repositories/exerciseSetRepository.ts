import { pool } from '../db.js';
import type { ExerciseSet, ExerciseSetUpdates } from '../types/exerciseSet.js';

async function findSetsByExerciseId(exerciseId: number): Promise<ExerciseSet[]> {
    const result = await pool.query<ExerciseSet>(
        'SELECT * FROM exercise_sets WHERE exercise_id = $1 ORDER BY set_number',
        [exerciseId]
    );
    return result.rows;
}

async function createExerciseSet(
    exerciseId: number, 
    setNumber: number, 
    reps: number, 
    weightKg?: number, 
    rpe?: number
): Promise<ExerciseSet> {
    const result = await pool.query<ExerciseSet>(
        'INSERT INTO exercise_sets \
        (exercise_id, set_number, reps, weight_kg, rpe) \
        VALUES ($1, $2, $3, $4, $5) \
        RETURNING *',
        [exerciseId, setNumber, reps, weightKg ?? null, rpe ?? null]
    );
    const exerciseSet = result.rows[0];
    if (exerciseSet === undefined) {
        throw new Error("Set creation succeeded without returning a row.");
    }
    return exerciseSet;
}

async function updateExerciseSet(setId: number, exerciseId: number, updates: ExerciseSetUpdates): Promise<ExerciseSet | undefined> {
    const { setNumber, reps, weightKg, rpe } = updates;
    const updateClauses: string[] = [];
    const values: (number | null)[] = [];

    if (setNumber !== undefined) {
        updateClauses.push(`set_number = $${updateClauses.length + 1}`);
        values.push(setNumber);
    }
    if (reps !== undefined) {
        updateClauses.push(`reps = $${updateClauses.length + 1}`);
        values.push(reps);
    }
    if (weightKg !== undefined) {
        updateClauses.push(`weight_kg = $${updateClauses.length + 1}`);
        values.push(weightKg);
    }
    if (rpe !== undefined) {
        updateClauses.push(`rpe = $${updateClauses.length + 1}`);
        values.push(rpe);
    }
    if (updateClauses.length === 0) {
        throw new Error('No updates provided.');
    }

    values.push(setId, exerciseId);

    const result = await pool.query<ExerciseSet>(`
        UPDATE exercise_sets 
        SET ${updateClauses.join(', ')} 
        WHERE id = $${updateClauses.length+1} AND exercise_id = $${updateClauses.length+2}
        RETURNING *`,
        values
        );
    return result.rows[0];
}

async function deleteExerciseSet(setId: number, exerciseId: number): Promise<ExerciseSet | undefined> {
    const result = await pool.query<ExerciseSet>(
        'DELETE FROM exercise_sets WHERE id = $1 AND exercise_id = $2 RETURNING *',
        [setId, exerciseId]
    );
    return result.rows[0];
}

export { createExerciseSet, findSetsByExerciseId, updateExerciseSet, deleteExerciseSet };