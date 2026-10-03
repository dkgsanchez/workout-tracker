import type { Workout } from '../types/workout'

const API_URL = 'http://localhost:3000/workouts'

export async function getWorkouts(): Promise<Workout[]> {
    const response = await fetch(API_URL)
    if (!response.ok) {
        throw new Error(`Failed to load workouts: ${response.status}`)
    }
    const workouts: Workout[] = await response.json()
    return workouts
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