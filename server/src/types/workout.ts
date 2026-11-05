import type { Exercise } from './exercise.js';
import type { ExerciseSet } from './exerciseSet.js';

interface Workout {
    id: number;
    name: string;
    completed: boolean;
    created_at: Date;
}

interface WorkoutUpdates {
    name?: string;
    completed?: boolean;
}

interface ExerciseWithSets extends Exercise {
    sets: ExerciseSet[];
}

interface WorkoutDetails extends Workout {
    exercises: ExerciseWithSets[];
}

export type { Workout, WorkoutUpdates, ExerciseWithSets, WorkoutDetails };
