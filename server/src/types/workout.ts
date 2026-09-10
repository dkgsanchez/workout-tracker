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

export type { Workout, WorkoutUpdates };
