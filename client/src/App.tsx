import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'
import type { Workout } from './types/workout'
import WorkoutItem from './components/WorkoutItem'
import WorkoutForm from './components/WorkoutForm'
import { getWorkouts } from './api/workoutApi'
import './App.css'

const API_URL = 'http://localhost:3000/workouts'

function App() {
  const [workoutName, setWorkoutName] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [error, setError] = useState('')
  const [loadingError, setLoadingError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  function handleWorkoutNameChange(event: ChangeEvent<HTMLInputElement>) {
    setWorkoutName(event.target.value)
  }

  async function handleAddWorkout(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (workoutName.trim() === '') {
      return
    }

    setError('')

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: workoutName.trim(),
          completed: false
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to add workout: ${response.status}`)
      }

      const workout: Workout = await response.json()

      setWorkouts([...workouts, workout])
      setWorkoutName('')
    } catch (error) {
      console.error(error)
      setError('Failed to add workout')
    }
  }

  async function handleDeleteWorkout(idToDelete: number) {
    setError('')

    try {
      const response = await fetch(`${API_URL}/${idToDelete}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error(`Failed to delete workout: ${response.status}`)
      }

      setWorkouts(workouts.filter(workout => workout.id !== idToDelete))
    } catch (error) {
      console.error(error)
      setError('Failed to delete workout')
    }
  }

  async function handleToggleWorkout(idToToggle: number) {
    const workout = workouts.find((workout) => workout.id === idToToggle)
    if (!workout) {
      return
    }

    setError('')
    
    try {
      const response = await fetch(`${API_URL}/${idToToggle}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completed: !workout.completed
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to update workout: ${response.status}`)
      }

      const updatedWorkout: Workout = await response.json()

      setWorkouts(workouts.map((workout) => 
        workout.id === updatedWorkout.id 
        ? updatedWorkout 
        : workout
      ))
    } catch (error) {
      console.error(error)
      setError('Failed to update workout')
    }
  }

  useEffect(() => {
    async function loadWorkouts() {
      try {
        const fetchedWorkouts = await getWorkouts()
        setWorkouts(fetchedWorkouts)
      } catch (error) {
        console.error(error)
        setLoadingError('Failed to load workouts')
      } finally {
        setIsLoading(false)
      }
    }
    loadWorkouts()
  }, [])

  return (
    <div className='app'>
      <h1>Workout Tracker</h1>
      <p>Track your workouts.</p>
      {!isLoading && !loadingError && <p>Workouts added: {workouts.length}</p>}
      {loadingError && <p>{loadingError}</p>}
      {error && <p>{error}</p>}
      {isLoading ? (
        <p>Loading workouts...</p>
      ) : loadingError ? null : workouts.length === 0 ? (
        <p>No workouts yet.</p>
      ) : (
        workouts.map((workout) => (
          <WorkoutItem key={workout.id} workout={workout} onDelete={handleDeleteWorkout} onToggle={handleToggleWorkout}/>
        ))
      )}
      <WorkoutForm workoutName={workoutName} onWorkoutNameChange={handleWorkoutNameChange} onSubmit={handleAddWorkout}/>
    </div>
  )
}

export default App