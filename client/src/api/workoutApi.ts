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
