import { useEffect, useState, type ChangeEvent, type SubmitEvent } from 'react'

type Workout = {
  id: number
  name: string
  completed: boolean
}

function App() {
  const [workoutName, setWorkoutName] = useState('')
  const [workouts, setWorkouts] = useState<Workout[]>([])

  async function handleAddWorkout(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (workoutName.trim() === '') {
      return
    }

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

    const workout: Workout = await response.json()
    
    setWorkouts([...workouts, workout])
    setWorkoutName('')
  }

  function handleWorkoutNameChange(event: ChangeEvent<HTMLInputElement>) {
    setWorkoutName(event.target.value)
  }

  function handleDeleteWorkout(idToDelete: number) {
    setWorkouts(workouts.filter(workout => workout.id !== idToDelete))
  }

  function handleToggleWorkout(idToToggle: number) {
    setWorkouts(workouts.map(workout => 
      workout.id !== idToToggle 
      ? workout 
      : { ...workout, completed: !workout.completed }
    ))
  }

  useEffect(() => {
    async function loadWorkouts() {
      const response = await fetch('http://localhost:3000/workouts')
      const data: Workout[] = await response.json()
      setWorkouts(data)
    }
    loadWorkouts()
  }, [])

  return (
    <div>
      <h1>Workout Tracker</h1>
      <p>Track your workouts.</p>
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