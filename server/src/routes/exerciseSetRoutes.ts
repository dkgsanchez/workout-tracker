import express from 'express';
import { findWorkoutById } from '../repositories/workoutRepository.js';
import { findExerciseById } from '../repositories/exerciseRepository.js';
import { findSetsByExerciseId } from '../repositories/exerciseSetRepository.js';

const router = express.Router();

router.get('/:workoutId/exercises/:exerciseId/sets', async (req, res) => {
    const workoutId = Number(req.params.workoutId);
    const exerciseId = Number(req.params.exerciseId);
    if (!Number.isInteger(workoutId) || workoutId < 1) {
        return res.status(400).json({ message: "Workout ID must be a positive integer."});
    }
    if (!Number.isInteger(exerciseId) || exerciseId < 1) {
        return res.status(400).json({ message: "Exercise ID must be a positive integer."});
    }
    try {
        const workout = await findWorkoutById(workoutId);
        if (workout === undefined) {
            return res.status(404).json({message: "Workout does not exist."});
        }
        const exercise = await findExerciseById(exerciseId, workoutId);
        if (exercise === undefined) {
            return res.status(404).json({message: "Exercise not found for this workout."});
        }
        const sets = await findSetsByExerciseId(exerciseId);
        return res.json(sets);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error."});
    }
});

export { router };