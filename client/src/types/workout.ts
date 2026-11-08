export interface Workout {
  id: number;
  name: string;
  completed: boolean;
}

export interface ExerciseSet {
  id: number;
  exercise_id: number;
  set_number: number;
  reps: number;
  weight_kg: number | null;
  rpe: number | null;
}

export interface ExerciseWithSets { 
  id: number;
  workout_id: number;
  name: string;
  sets: ExerciseSet[];
}

export interface WorkoutDetails extends Workout {
  created_at: string;
  exercises: ExerciseWithSets[];
}