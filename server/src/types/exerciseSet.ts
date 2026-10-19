interface ExerciseSet {
    id: number;
    exercise_id: number;
    set_number: number;
    reps: number;
    weight_kg: number | null;
    rpe: number | null;
};

interface ExerciseSetUpdates {
    setNumber?: number;
    reps?: number;
    weightKg?: number | null;
    rpe?: number | null;
}

type ExerciseSetRow = Omit<ExerciseSet, 'weight_kg' | 'rpe'> & {
    weight_kg: string | null,
    rpe: string | null
}

export type { ExerciseSet, ExerciseSetUpdates, ExerciseSetRow };