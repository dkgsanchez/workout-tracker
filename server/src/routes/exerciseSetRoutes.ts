import express from 'express';
import { findWorkoutById } from '../repositories/workoutRepository.js';
import { findExerciseById } from '../repositories/exerciseRepository.js';
import { createExerciseSet, findSetsByExerciseId, updateExerciseSet } from '../repositories/exerciseSetRepository.js';
import type { ExerciseSetUpdates } from '../types/exerciseSet.js';

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

router.post('/:workoutId/exercises/:exerciseId/sets', async (req, res) => {
    const workoutId = Number(req.params.workoutId);
    const exerciseId = Number(req.params.exerciseId);
    const { setNumber, reps, weightKg, rpe } = req.body;

    if (!Number.isInteger(workoutId) || workoutId < 1) {
        return res.status(400).json({ message: "Workout ID must be a positive integer."});
    }
    if (!Number.isInteger(exerciseId) || exerciseId < 1) {
        return res.status(400).json({ message: "Exercise ID must be a positive integer."});
    }
    if (!Number.isInteger(setNumber) || setNumber < 1) {
        return res.status(400).json({ message: "Set number must be a positive integer."});
    }
    if (!Number.isInteger(reps) || reps < 0) {
        return res.status(400).json({ message: "Reps must be an integer 0 or greater."});
    }
    if (weightKg !== undefined && (typeof weightKg !== 'number' || weightKg < 0)) {
        return res.status(400).json({ message: "Weight must be a number 0 or greater."});
    }
    if (rpe !== undefined && (typeof rpe !== 'number' || rpe < 1 || rpe > 10)) {
        return res.status(400).json({ message: "RPE must be a number between 1 and 10."});
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
        const set = await createExerciseSet(exerciseId, setNumber, reps, weightKg, rpe);
        return res.status(201).json(set);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error."});
    }
});

router.patch('/:workoutId/exercises/:exerciseId/sets/:setId', async (req, res) => {
    const workoutId = Number(req.params.workoutId);
    const exerciseId = Number(req.params.exerciseId);
    const setId = Number(req.params.setId);
    const { setNumber, reps, weightKg, rpe } = req.body;

    if (!Number.isInteger(workoutId) || workoutId < 1) {
        return res.status(400).json({ message: "Workout ID must be a positive integer."});
    }
    if (!Number.isInteger(exerciseId) || exerciseId < 1) {
        return res.status(400).json({ message: "Exercise ID must be a positive integer."});
    }
    if (!Number.isInteger(setId) || setId < 1) {
        return res.status(400).json({ message: "Set ID must be a positive integer."});
    }
    if (setNumber === undefined && reps === undefined && weightKg === undefined && rpe === undefined) {
        return res.status(400).json({ message: "No updates provided."});
    }
    if (setNumber !== undefined && (!Number.isInteger(setNumber) || setNumber < 1)) {
        return res.status(400).json({ message: "Set number must be a positive integer."});
    }
    if (reps !== undefined && (!Number.isInteger(reps) || reps < 0)) {
        return res.status(400).json({ message: "Reps must be an integer 0 or greater."});
    }
    if (weightKg !== undefined && weightKg !== null && (typeof weightKg !== 'number' || weightKg < 0)) {
        return res.status(400).json({ message: "Weight must be a number 0 or greater, or null."});
    }
    if (rpe !== undefined && rpe !== null && (typeof rpe !== 'number' || rpe < 1 || rpe > 10)) {
        return res.status(400).json({ message: "RPE must be a number between 1 and 10, or null."});
    }
    
    const updates: ExerciseSetUpdates = { setNumber, reps, weightKg, rpe };
    try {
        const workout = await findWorkoutById(workoutId);
        if (workout === undefined) {
            return res.status(404).json({message: "Workout does not exist."});
        }
        const exercise = await findExerciseById(exerciseId, workoutId);
        if (exercise === undefined) {
            return res.status(404).json({message: "Exercise not found for this workout."});
        }
        const set = await updateExerciseSet(setId, exerciseId, updates);
        if (set === undefined) {
            return res.status(404).json({message: "Set not found for this exercise."})
        }
        return res.json(set); 
    } catch (error) {
        console.error(error);
        return res.status(500).json({message:"Internal server error."});
    }
})

export { router };