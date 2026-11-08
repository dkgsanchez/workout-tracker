import type { Workout } from '../types/workout'

type WorkoutItemProps = {
  workout: Workout
  onDelete: (id: number) => void
  onToggle: (id: number) => void
  onSelect: (id: number) => void
}

function WorkoutItem({ workout, onDelete, onToggle, onSelect }: WorkoutItemProps) {
  return (
    <div className='workout'>
      <p className='workout-name'>
        {workout.name}
      </p>
      <p className={workout.completed ? 'completed' : 'not-completed'}>
        {workout.completed ? 'Completed' : 'Not completed'}
      </p>
      <div className='workout-actions'>
        <button className='delete-button' onClick={() => onDelete(workout.id)}>
          Delete workout
        </button>
        <button className='toggle-button' onClick={() => onToggle(workout.id)}>
          Toggle workout
        </button>
        <button className='select-button' onClick={() => onSelect(workout.id)}>
          View workout
        </button>
      </div>
    </div>
  )
}

export default WorkoutItem