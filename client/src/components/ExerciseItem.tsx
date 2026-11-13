import type { ExerciseWithSets } from '../types/workout'
import { useState, type ChangeEvent, type SubmitEvent } from 'react'

type ExerciseItemProps = {
    exercise: ExerciseWithSets
    onDelete: (exerciseId: number) => void
    onUpdate: (exerciseId: number, name: string) => void
    onAddSet: (
        exerciseId: number,
        setNumber: number,
        reps: number,
        weightKg?: number,
        rpe?: number
    ) => void
}

function ExerciseItem({ exercise, onDelete, onUpdate, onAddSet }: ExerciseItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(exercise.name)
    const [setNumber, setSetNumber] = useState('')
    const [reps, setReps] = useState('')
    const [weightKg, setWeightKg] = useState('')
    const [rpe, setRpe] = useState('')


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

    function handleAddSet(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()

        if (setNumber.trim() === '' || reps.trim() === '') {
            return
        }

        const parsedSetNumber = Number(setNumber)
        const parsedReps = Number(reps)
        const parsedWeightKg = weightKg.trim() === '' ? undefined : Number(weightKg)
        const parsedRpe = rpe.trim() === '' ? undefined : Number(rpe)

        if (!Number.isInteger(parsedSetNumber) || parsedSetNumber < 1) {
            return
        }
        if (!Number.isInteger(parsedReps) || parsedReps < 0) {
            return
        }
        if (parsedWeightKg !== undefined && (Number.isNaN(parsedWeightKg) || parsedWeightKg < 0)) {
            return
        }
        if (parsedRpe !== undefined && (Number.isNaN(parsedRpe) || parsedRpe < 1 || parsedRpe > 10)) {
            return
        }

        onAddSet(exercise.id, parsedSetNumber, parsedReps, parsedWeightKg, parsedRpe)
        setSetNumber('')
        setReps('')
        setWeightKg('')
        setRpe('')
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
            <form onSubmit={handleAddSet}>
                <input
                    type='number'
                    required
                    min='1'
                    value={setNumber}
                    onChange={event => setSetNumber(event.target.value)}
                    placeholder='Set number'
                />
                <input
                    type='number'
                    required
                    min='0'
                    value={reps}
                    onChange={event => setReps(event.target.value)}
                    placeholder='Reps'
                />
                <input
                    type='number'
                    min='0'
                    step='0.5'
                    value={weightKg}
                    onChange={event => setWeightKg(event.target.value)}
                    placeholder='Weight (kg)'
                />
                <input
                    type='number'
                    min='1'
                    max='10'
                    step='0.5'
                    value={rpe}
                    onChange={event => setRpe(event.target.value)}
                    placeholder='RPE'
                />
                <button type='submit'>
                    Add set
                </button>
            </form>
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