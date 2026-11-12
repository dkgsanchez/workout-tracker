import type { ExerciseWithSets } from '../types/workout'
import { useState, type ChangeEvent } from 'react'

type ExerciseItemProps = {
    exercise: ExerciseWithSets
    onDelete: (exerciseId: number) => void
    onUpdate: (exerciseId: number, name: string) => void
}

function ExerciseItem({ exercise, onDelete, onUpdate }: ExerciseItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(exercise.name)

    function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
        setEditedName(event.target.value)
    }

    function handleSave() {
        if (editedName.trim() === '') {
            return
        }
        onUpdate(exercise.id, editedName.trim())
        setIsEditing(false)
    }

    function handleCancel() {
        setEditedName(exercise.name)
        setIsEditing(false)
    }

    function handleEdit() {
        setEditedName(exercise.name)
        setIsEditing(true)
    }

    return (
        <div>
            {isEditing ?
                <div>
                    <input
                        type='text'
                        value={editedName}
                        onChange={handleNameChange}
                    />
                    <button onClick={handleSave}>
                        Save
                    </button>
                    <button onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
                :
                <div>
                    <h3>{exercise.name}</h3>
                    <button onClick={handleEdit}>
                        Edit
                    </button>
                </div>
            }
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