import express from 'express';
import { findExercisesByWorkoutId, createExercise, deleteExercise } from '../repositories/exerciseRepository.js';
import { findWorkoutById } from '../repositories/workoutRepository.js';

const router = express.Router();

router.get('/:id/exercises', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "ID must be a positive integer."});
    }
    try {
        const workout = await findWorkoutById(id);
        if (workout === undefined) {
            return res.status(404).json({ message: "Workout does not exist."});
        }
        const exercises = await findExercisesByWorkoutId(id);
        return res.json(exercises);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error."});
    }
});

router.post('/:id/exercises', async (req, res) => {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "ID must be a positive integer."});
    }
    if (typeof name !== 'string') {
        return res.status(400).json({ message: "Exercise name must be a string."});
    }
    if (name.trim().length === 0) {
        return res.status(400).json({ message: "Exercise name cannot be empty."});
    }
    if (name.trim().length > 100) {
        return res.status(400).json({ message: "Exercise name must be 100 characters or less."});
    }

    try {
        const workout = await findWorkoutById(id);
        if (workout === undefined) {
            return res.status(404).json({ message: "Workout does not exist." });
        }
        const exercise = await createExercise(id, name.trim());
        return res.status(201).json(exercise);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error."});
    }
});

router.delete('/:workoutId/exercises/:exerciseId', async (req, res) => {
    const workoutId = Number(req.params.workoutId);
    const exerciseId = Number(req.params.exerciseId);
    if (!Number.isInteger(workoutId) || workoutId < 1) {
        return res.status(400).json({ message: "Workout ID must be a positive integer." });
    }
    if (!Number.isInteger(exerciseId) || exerciseId < 1) {
        return res.status(400).json({ message: "Exercise ID must be a positive integer." });
    }
    try {
        const workout = await findWorkoutById(workoutId);
        if (workout === undefined) {
            return res.status(404).json({ message: "Workout does not exist." });
        }
        const exercise = await deleteExercise(exerciseId, workoutId);
        if (exercise === undefined) {
            return res.status(404).json({ message: "Exercise not found for this workout."});
        }
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error."});
    }
});

export { router };