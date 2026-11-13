import type { Exercise, ExerciseSet, ExerciseWithSets, Workout, WorkoutDetails } from '../types/workout'

const API_URL = 'http://localhost:3000/workouts'

export async function getWorkouts(): Promise<Workout[]> {
    const response = await fetch(API_URL)
    if (!response.ok) {
        throw new Error(`Failed to load workouts: ${response.status}`)
    }
    const workouts: Workout[] = await response.json()
    return workouts
}

export async function getWorkoutDetails(id: number): Promise<WorkoutDetails> {
    const response = await fetch(`${API_URL}/${id}/details`)
    if (!response.ok) {
        throw new Error(`Failed to load workout details: ${response.status}`)
    }
    const workoutDetails: WorkoutDetails = await response.json()
    return workoutDetails
}

export async function createWorkout(name: string): Promise<Workout> {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name,
            completed: false
        })
    })
    if (!response.ok) {
        throw new Error(`Failed to add workout: ${response.status}`)
    }
    const workout: Workout = await response.json()
    return workout
}

export async function updateWorkout(id: number, completed: boolean): Promise<Workout> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            completed
        })
    })
    if (!response.ok) {
        throw new Error(`Failed to update workout: ${response.status}`)
    }
    const updatedWorkout: Workout = await response.json()
    return updatedWorkout
}

export async function deleteWorkout(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    })
    if (!response.ok) {
        throw new Error(`Failed to delete workout: ${response.status}`)
    }
}

export async function createExercise(workoutId: number, name: string): Promise<ExerciseWithSets> {
    const response = await fetch(`${API_URL}/${workoutId}/exercises`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name
        })
    })
    if (!response.ok) {
        throw new Error(`Failed to create exercise: ${response.status}`)
    }
    const exercise: Exercise = await response.json()
    return {
        ...exercise,
        sets: []
    }
}

export async function deleteExercise(workoutId: number, exerciseId: number): Promise<void> {
    const response = await fetch(`${API_URL}/${workoutId}/exercises/${exerciseId}`, {
        method: 'DELETE'
    });
    if (!response.ok) {
        throw new Error(`Failed to delete exercise: ${response.status}`)
    }
}

export async function updateExercise(workoutId: number, exerciseId: number, name: string): Promise<Exercise> {
    const response = await fetch(`${API_URL}/${workoutId}/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name
        })
    });
    if (!response.ok) {
        throw new Error(`Failed to update exercise: ${response.status}`)
    }
    const updatedExercise: Exercise = await response.json()
    return updatedExercise;
}

export async function createExerciseSet(
    workoutId: number,
    exerciseId: number,
    setNumber: number,
    reps: number,
    weightKg?: number,
    rpe?: number
): Promise<ExerciseSet> {
    const response = await fetch(`${API_URL}/${workoutId}/exercises/${exerciseId}/sets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            setNumber,
            reps,
            weightKg,
            rpe
        })
    })
    if (!response.ok) {
        throw new Error(`Failed to add set: ${response.status}`)
    }
    const exerciseSet: ExerciseSet = await response.json()
    return exerciseSet
}