import { pool } from '../db.js';
import type { ExerciseSet, ExerciseSetUpdates, ExerciseSetRow } from '../types/exerciseSet.js';

async function findSetsByExerciseId(exerciseId: number): Promise<ExerciseSet[]> {
    const result = await pool.query<ExerciseSetRow>(
        'SELECT * FROM exercise_sets WHERE exercise_id = $1 ORDER BY set_number',
        [exerciseId]
    );
    const exerciseSetRows = result.rows;
    return exerciseSetRows.map(toExerciseSet);
}

async function createExerciseSet(
    exerciseId: number, 
    setNumber: number, 
    reps: number, 
    weightKg?: number, 
    rpe?: number
): Promise<ExerciseSet> {
    const result = await pool.query<ExerciseSetRow>(
        'INSERT INTO exercise_sets \
        (exercise_id, set_number, reps, weight_kg, rpe) \
        VALUES ($1, $2, $3, $4, $5) \
        RETURNING *',
        [exerciseId, setNumber, reps, weightKg ?? null, rpe ?? null]
    );
    const exerciseSetRow = result.rows[0];
    if (exerciseSetRow === undefined) {
        throw new Error("Set creation succeeded without returning a row.");
    }
    return toExerciseSet(exerciseSetRow);
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

    const result = await pool.query<ExerciseSetRow>(`
        UPDATE exercise_sets 
        SET ${updateClauses.join(', ')} 
        WHERE id = $${updateClauses.length+1} AND exercise_id = $${updateClauses.length+2}
        RETURNING *`,
        values
        );
    const exerciseSetRow = result.rows[0];
    return exerciseSetRow !== undefined ? toExerciseSet(exerciseSetRow) : undefined;
}

async function deleteExerciseSet(setId: number, exerciseId: number): Promise<ExerciseSet | undefined> {
    const result = await pool.query<ExerciseSetRow>(
        'DELETE FROM exercise_sets WHERE id = $1 AND exercise_id = $2 RETURNING *',
        [setId, exerciseId]
    );
    const exerciseSetRow = result.rows[0];
    return exerciseSetRow !== undefined ? toExerciseSet(exerciseSetRow) : undefined;
}

function toExerciseSet(row: ExerciseSetRow): ExerciseSet {
    return {
        ...row,
        weight_kg: row.weight_kg === null ? null : Number(row.weight_kg),
        rpe: row.rpe === null ? null : Number(row.rpe)
    };
}

export { createExerciseSet, findSetsByExerciseId, updateExerciseSet, deleteExerciseSet };