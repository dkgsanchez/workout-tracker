import { pool } from '../db.js';
import type { Workout, WorkoutUpdates } from '../types/workout.js';

async function findWorkoutById(id: number): Promise<Workout | undefined> {
    const result = await pool.query(
        'SELECT * FROM workouts where id = $1;',
        [id]
    );

    return result.rows[0];
}

async function findAllWorkouts(): Promise<Workout[]> {
    const result = await pool.query(
        'SELECT * FROM workouts'
    );
    return result.rows;
}

async function createWorkout(name: string, completed?: boolean): Promise<Workout> {
    let result;
    if (completed !== undefined) {
        result = await pool.query(
            'INSERT INTO workouts (name, completed) VALUES ($1, $2) RETURNING *',
            [name, completed]
        );
    } else {
        result = await pool.query(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            [name]
        );
    }

    return result.rows[0];
}

async function updateWorkout(id: number, updates: WorkoutUpdates): Promise<Workout | undefined> {
    const { name, completed } = updates;
    let result;

    if (name !== undefined && completed === undefined) {
        result = await pool.query(
            'UPDATE workouts SET name = $1 WHERE id = $2 RETURNING *',
            [name, id]
        ); 
    } else if (completed !== undefined && name === undefined) {
        result = await pool.query(
            'UPDATE workouts SET completed = $1 WHERE id = $2 RETURNING *',
            [completed, id]
        );
    } else { // both name & completed provided
        result = await pool.query(
            'UPDATE workouts SET name = $1, completed = $2 WHERE id = $3 RETURNING *',
            [name, completed, id]
        );
    }

    return result.rows[0];
}

async function deleteWorkout(id: number): Promise<Workout | undefined> {
    const result = await pool.query(
        'DELETE FROM workouts WHERE id = $1 RETURNING *',
        [id]
    );

    return result.rows[0];
}

export { findWorkoutById, findAllWorkouts, createWorkout, updateWorkout, deleteWorkout };
