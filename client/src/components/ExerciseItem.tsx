import type { ExerciseWithSets } from '../types/workout'

type ExerciseItemProps = {
    exercise: ExerciseWithSets
    onDelete: (exerciseId: number) => void
}

function ExerciseItem({ exercise, onDelete }: ExerciseItemProps) {
    return (
        <div>
            <h3>{exercise.name}</h3>
            <button onClick={() => onDelete(exercise.id)}>
                Delete exercise
            </button>
            {exercise.sets.length === 0 ? (
                <p>No sets.</p>
            ) : (
                exercise.sets.map((set) => (
                    <p key={set.id}>
                        Set {set.set_number}: {set.reps} reps
                        {set.weight_kg !== null && ` x ${set.weight_kg}kg`}
                        {set.rpe !== null && ` @ RPE ${set.rpe}`}
                    </p>
                ))
            )}
        </div>
    )
}

export default ExerciseItem