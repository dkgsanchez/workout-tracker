import { type ExerciseSet, type ExerciseSetUpdates } from '../types/workout'
import { useState, type SubmitEvent } from 'react'

interface ExerciseSetItemProps {
    exerciseId: number
    exerciseSet: ExerciseSet
    onUpdate: (
        exerciseId: number,
        setId: number,
        updates: ExerciseSetUpdates
    ) => void
    onDelete: (
        exerciseId: number,
        setId: number
    ) => void
}

function ExerciseSetItem({ exerciseId, exerciseSet, onUpdate, onDelete }: ExerciseSetItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [setNumber, setSetNumber] = useState(String(exerciseSet.set_number))
    const [reps, setReps] = useState(String(exerciseSet.reps))
    const [weightKg, setWeightKg] = useState(exerciseSet.weight_kg === null ? '' : String(exerciseSet.weight_kg))
    const [rpe, setRpe] = useState(exerciseSet.rpe === null ? '' : String(exerciseSet.rpe))

    function handleSave(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        
        if (setNumber.trim() === '' || reps.trim() === '') {
            return
        }

        const parsedSetNumber = Number(setNumber)
        const parsedReps = Number(reps)
        const parsedWeightKg = weightKg.trim() === '' ? null : Number(weightKg)
        const parsedRpe = rpe.trim() === '' ? null : Number(rpe)

        if (!Number.isInteger(parsedSetNumber) || parsedSetNumber < 1) {
            return
        }
        if (!Number.isInteger(parsedReps) || parsedReps < 0) {
            return
        }
        if (parsedWeightKg !== null && (Number.isNaN(parsedWeightKg) || parsedWeightKg < 0)) {
            return
        }
        if (parsedRpe !== null && (Number.isNaN(parsedRpe) || parsedRpe < 1 || parsedRpe > 10)) {
            return
        }

        const updates: ExerciseSetUpdates = {}
        if (parsedSetNumber !== exerciseSet.set_number) {
            updates.setNumber = parsedSetNumber
        }
        if (parsedReps !== exerciseSet.reps) {
            updates.reps = parsedReps
        }
        if (parsedWeightKg !== exerciseSet.weight_kg) {
            updates.weightKg = parsedWeightKg
        }
        if (parsedRpe !== exerciseSet.rpe) {
            updates.rpe = parsedRpe
        }

        if (Object.keys(updates).length === 0) {
            setIsEditing(false)
            return
        }

        onUpdate(exerciseId, exerciseSet.id, updates)
        setIsEditing(false)
    }

    function handleCancel() {
        setIsEditing(false)
    }

    function handleEdit() {
        setSetNumber(String(exerciseSet.set_number))
        setReps(String(exerciseSet.reps))
        setWeightKg(exerciseSet.weight_kg === null ? '' : String(exerciseSet.weight_kg))
        setRpe(exerciseSet.rpe === null ? '' : String(exerciseSet.rpe))
        setIsEditing(true)
    }

    function handleDelete() {
        onDelete(exerciseId, exerciseSet.id)
    }

    return (
        <div>
            {isEditing ?
                <div>
                    <form onSubmit={handleSave}>
                        <input
                            type='number'
                            min='1'
                            value={setNumber}
                            onChange={event => setSetNumber(event.target.value)}
                        />
                        <input
                            type='number'
                            min='0'
                            value={reps}
                            onChange={event => setReps(event.target.value)}
                        />
                        <input
                            type='number'
                            min='0'
                            step='0.5'
                            value={weightKg}
                            onChange={event => setWeightKg(event.target.value)}
                        />
                        <input
                            type='number'
                            min='1'
                            max='10'
                            step='0.5'
                            value={rpe}
                            onChange={event => setRpe(event.target.value)}
                        />
                        <button type='submit'>
                            Save
                        </button>
                    </form>
                    <button onClick={handleCancel}>
                        Cancel
                    </button>
                </div>
                :
                <div>
                    <p>
                        Set {exerciseSet.set_number}: {exerciseSet.reps} reps
                        {exerciseSet.weight_kg !== null && ` x ${exerciseSet.weight_kg}kg`}
                        {exerciseSet.rpe !== null && ` @ RPE ${exerciseSet.rpe}`}
                    </p>
                    <button onClick={handleEdit}>
                        Edit
                    </button>
                    <button onClick={handleDelete}>
                        Delete
                    </button>
                </div>
            }
        </div>
    )
}

export default ExerciseSetItem
