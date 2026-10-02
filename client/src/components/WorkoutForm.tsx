import type { ChangeEvent, SubmitEvent } from 'react'

type WorkoutFormProps = {
  workoutName: string
  onWorkoutNameChange: (event: ChangeEvent<HTMLInputElement>) => void
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => void
}

function WorkoutForm({ workoutName, onWorkoutNameChange, onSubmit }: WorkoutFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <input value={workoutName} onChange={onWorkoutNameChange}/>
      <button>Add workout</button>
    </form>
  )
}

export default WorkoutForm