import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'
import type { Workout, WorkoutDetails as WorkoutDetailsType } from './types/workout'
import WorkoutItem from './components/WorkoutItem'
import WorkoutForm from './components/WorkoutForm'
import { createWorkout, deleteWorkout, getWorkouts, getWorkoutDetails, updateWorkout, createExercise, deleteExercise } from './api/workoutApi'
import './App.css'
import WorkoutDetails from './components/WorkoutDetails'

function App() {
  const [workoutName, setWorkoutName] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutDetailsType | null>(null)
  const [error, setError] = useState('')
  const [loadingError, setLoadingError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [exerciseName, setExerciseName] = useState('')

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
      const workout = await createWorkout(workoutName.trim())
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
      await deleteWorkout(idToDelete)
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
      const updatedWorkout = await updateWorkout(workout.id, !workout.completed)
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

  async function handleSelectWorkout(id: number) {
    setError('')

    try {
      const workoutDetails = await getWorkoutDetails(id)
      setSelectedWorkout(workoutDetails)
    } catch (error) {
      console.error(error)
      setError('Failed to load workout details')
    }
  }

  function handleExerciseNameChange(event: ChangeEvent<HTMLInputElement>) {
    setExerciseName(event.target.value)
  }

  async function handleAddExercise(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (exerciseName.trim() === '' || selectedWorkout === null) {
      return
    }
    setError('')

    try {
      const exercise = await createExercise(
        selectedWorkout.id,
        exerciseName.trim()
      )
      setSelectedWorkout({
        ...selectedWorkout,
        exercises: [...selectedWorkout.exercises, exercise]
      })
      setExerciseName('')
    } catch (error) {
      console.error(error)
      setError('Failed to add exercise')
    }
  }

  async function handleDeleteExercise(exerciseId: number) {
    if (selectedWorkout === null) {
      return
    }
    setError('')

    try {
      await deleteExercise(selectedWorkout.id, exerciseId)
      setSelectedWorkout({
        ...selectedWorkout,
        exercises: selectedWorkout.exercises.filter(exercise => exercise.id !== exerciseId)
      })
    } catch (error) {
      console.error(error)
      setError('Failed to delete exercise')
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
          <WorkoutItem key={workout.id} workout={workout} onDelete={handleDeleteWorkout} onToggle={handleToggleWorkout} onSelect={handleSelectWorkout} />
        ))
      )}
      {selectedWorkout &&
        <WorkoutDetails
          workout={selectedWorkout}
          exerciseName={exerciseName}
          onExerciseNameChange={handleExerciseNameChange}
          onAddExercise={handleAddExercise}
          onDeleteExercise={handleDeleteExercise} />
      }
      <WorkoutForm workoutName={workoutName} onWorkoutNameChange={handleWorkoutNameChange} onSubmit={handleAddWorkout} />
    </div>
  )
}

export default App