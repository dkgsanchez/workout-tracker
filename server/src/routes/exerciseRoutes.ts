import express from 'express';
import { findExercisesByWorkoutId } from '../repositories/exerciseRepository.js';
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

export { router };