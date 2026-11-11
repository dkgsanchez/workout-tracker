import type { WorkoutDetails as WorkoutDetailsType} from '../types/workout'
import type { ChangeEvent, SubmitEvent } from 'react'
import ExerciseItem from './ExerciseItem'

type WorkoutDetailsProps = {
    workout: WorkoutDetailsType
    exerciseName: string
    onExerciseNameChange: (event: ChangeEvent<HTMLInputElement>) => void
    onAddExercise: (event: SubmitEvent<HTMLFormElement>) => void
    onDeleteExercise: (exerciseId: number) => void
}

function WorkoutDetails({
    workout,
    exerciseName,
    onExerciseNameChange,
    onAddExercise,
    onDeleteExercise
}: WorkoutDetailsProps) {
    return (
        <div className='workout-details'>
            <h2>{workout.name}</h2>
            {workout.exercises.length === 0 ? (
                <p>No exercises.</p>
            ) : (
                workout.exercises.map((exercise) => (
                    <ExerciseItem 
                    key={exercise.id} 
                    exercise={exercise} 
                    onDelete={onDeleteExercise}
                    />
                ))
            )}
            <form onSubmit={onAddExercise}>
                <input
                    type='text'
                    value={exerciseName}
                    onChange={onExerciseNameChange}
                    placeholder='Exercise name'
                />
                <button type='submit'>Add exercise</button>
            </form>
        </div>
    )
}

export default WorkoutDetails