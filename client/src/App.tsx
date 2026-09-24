import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'

type Workout = {
  id: number
  name: string
  completed: boolean
}

function App() {
  const [workoutName, setWorkoutName] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [error, setError] = useState('')

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
      const response = await fetch('http://localhost:3000/workouts', {
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
      const response = await fetch(`http://localhost:3000/workouts/${idToDelete}`, {
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
      const response = await fetch(`http://localhost:3000/workouts/${idToToggle}`, {
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
        const response = await fetch('http://localhost:3000/workouts')
        if (!response.ok) {
          throw new Error(`Failed to load workouts: ${response.status}`)
        }
        const data: Workout[] = await response.json()
        setWorkouts(data)
      } catch (error) {
        console.error(error)
        setError('Failed to load workouts')
      }
    }
    loadWorkouts()
  }, [])

  return (
    <div>
      <h1>Workout Tracker</h1>
      <p>Track your workouts.</p>
      {error && <p>{error}</p>}
      <p>Workouts added: {workouts.length}</p>
      {workouts.length === 0 ? (
        <p>No workouts yet.</p>
      ) : (
        workouts.map((workout) => (
          <div key={workout.id}>
            <p>{workout.name}</p>
            <p>{workout.completed ? 'Completed' : 'Not completed'}</p>
            <button onClick={() => handleDeleteWorkout(workout.id)}>Delete workout</button>
            <button onClick={() => handleToggleWorkout(workout.id)}>Toggle workout</button>
          </div>
        ))
      )}
      <form onSubmit={handleAddWorkout}>
        <input value={workoutName} onChange={handleWorkoutNameChange} />
        <button>Add workout</button>
      </form>
    </div>
  )
}

export default App