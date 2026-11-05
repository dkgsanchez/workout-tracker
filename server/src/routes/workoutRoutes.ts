import express from 'express';
import { findWorkoutById, findAllWorkouts, createWorkout, updateWorkout, deleteWorkout } from '../repositories/workoutRepository.js';
import type { WorkoutDetails, WorkoutUpdates } from '../types/workout.js';
import { findExercisesByWorkoutId } from '../repositories/exerciseRepository.js';
import { findSetsByExerciseId } from '../repositories/exerciseSetRepository.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const workouts = await findAllWorkouts();
        return res.json(workouts);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({message: "ID must be a positive integer."});
    }

    try { 
        const workout = await findWorkoutById(id);
        if (workout === undefined) {
            return res.status(404).json({message: "Workout does not exist."});
        }

        return res.json(workout);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

router.get('/:id/details', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({message: "ID must be a positive integer."});
    }

    try {
        const workout = await findWorkoutById(id);
        if (workout === undefined) {
            return res.status(404).json({message: "Workout does not exist."});
        }
        const exercises = await findExercisesByWorkoutId(id);
        const exercisesWithSets = await Promise.all(
            exercises.map(async (exercise) => {
                const sets = await findSetsByExerciseId(exercise.id);
                return { ...exercise, sets };
            })
        );
        const workoutDetails: WorkoutDetails = {...workout, exercises: exercisesWithSets };
        return res.json(workoutDetails);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

router.post('/', async (req, res) => {
    const { name, completed } = req.body;
    if (typeof name !== 'string') {
        return res.status(400).json({message: "Name must be a string."});
    }
    if (name.trim().length === 0) {
        return res.status(400).json({message: "Name cannot be empty."});
    }
    if (completed !== undefined && typeof completed !== 'boolean') {
        return res.status(400).json({message: "Completed must be a boolean (true/false)."});
    }

    try {
        const workout = await createWorkout(name.trim(), completed);
        return res.status(201).json(workout);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});


router.patch('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "ID must be a positive integer." });
    }

    const updates: WorkoutUpdates = req.body ?? {};
    const { name, completed } = updates;

    if (name === undefined && completed === undefined) {
        return res.status(400).json({ message: "At least one field must be provided."});
    }

    if (name !== undefined && typeof name !== 'string') {
        return res.status(400).json({ message: "Name must be a string."});
    }

    if (name !== undefined && name.trim() === '') {
        return res.status(400).json({ message: "Name cannot be empty."});
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
        return res.status(400).json({ message: "Completed must be a boolean (true/false)."});
    }

    const normalisedUpdates: WorkoutUpdates = {};

    if (name !== undefined) {
        normalisedUpdates.name = name.trim();
    }

    if (completed !== undefined) {
        normalisedUpdates.completed = completed;
    }

    try {
        const workout = await updateWorkout(id, normalisedUpdates);
        if (workout === undefined) {
            return res.status(404).json({message: "Workout does not exist."});
        }
        return res.json(workout);

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});

    }
});

router.delete('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "ID must be a positive integer."});
    }

    try {
        const workout = await deleteWorkout(id);
        if (workout === undefined) {
            return res.status(404).json({message: "Workout does not exist."});
        }
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

export { router };
