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

export type { ExerciseSet, ExerciseSetUpdates };