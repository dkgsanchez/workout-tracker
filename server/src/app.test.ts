import request from 'supertest';
import { expect, test, beforeEach, describe } from 'vitest';
import { app } from './app.js';
import { pool } from './db.js';
import type { Workout } from './types/workout.js';
import type { Exercise } from './types/exercise.js';
import { ExerciseSet } from './types/exerciseSet.js';

describe('database-backed workout routes', () => {
    beforeEach(async () => {
        if (process.env.DB_NAME !== 'workout_tracker_test') {
            throw new Error('Tests must use workout_tracker_test database.');
        }    
        await pool.query('DELETE FROM workouts');
    });

    test('GET /workouts returns empty array when no workouts exist', async () => {
        const response = await request(app).get('/workouts');
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('GET /workouts returns an array with one known workout', async () => {
        await pool.query(
            'INSERT INTO workouts (name, completed) VALUES ($1, $2)',
            ['Test Workout', true]
        );

        const response = await request(app).get('/workouts');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(1);
        expect(response.body[0].name).toBe('Test Workout');
        expect(response.body[0].completed).toBe(true);
    });

    test('GET /workouts/:id returns the requested workout', async () => {
        const result = await pool.query<Workout>(
            'INSERT INTO workouts (name, completed) VALUES ($1, $2) RETURNING *',
            ['Specific Workout', false]);
        
        const workout = result.rows[0];
        const { id } = workout;
        const response = await request(app).get(`/workouts/${id}`);
        
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Specific Workout');
        expect(response.body.completed).toBe(false);
    });

    test('POST /workouts creates and persists a workout', async () => {
        const response = await request(app).post('/workouts').send({name: 'Push day'});

        expect(response.status).toBe(201);
        expect(response.body.name).toBe('Push day'); 
        expect(response.body.completed).toBe(false);

        const result = await pool.query<Workout>('SELECT * from workouts');
        expect(result.rows.length).toBe(1);

        const workout = result.rows[0];
        expect(workout.name).toBe('Push day');
        expect(workout.completed).toBe(false);
    });

    test('PATCH /workouts/:id updates and persists a workout', async () => {
        // insert a new workout with SQL directly
        let result = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
            );
        let workout = result.rows[0];
        const { id } = workout;

        // send PATCH request to update workout
        const response = await request(app).patch(`/workouts/${id}`).send({name: 'Updated Push day', completed: true});

        // check response
        expect(response.status).toBe(200);
        expect(response.body.name).toBe('Updated Push day');
        expect(response.body.completed).toBe(true);
        
        // check database persistence
        result = await pool.query<Workout>('SELECT * FROM workouts WHERE id = $1', [id]);
        workout = result.rows[0];
        expect(workout.name).toBe('Updated Push day');
        expect(workout.completed).toBe(true);
        
    });

    test('DELETE /workouts/:id deletes a workout with database persistence', async () => {
        let result = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        let workout = result.rows[0];
        const { id } = workout;

        const response = await request(app).delete(`/workouts/${id}`);
        
        expect(response.status).toBe(204);
        
        result = await pool.query<Workout>(
            'SELECT * FROM workouts WHERE id = $1',
            [id]
        );
        expect(result.rows.length).toBe(0);
    });

    test('GET /workouts/:id returns 404 for non-existent workout', async () => {
        const response = await request(app).get('/workouts/1');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: 'Workout does not exist.'});
    });

    test('PATCH /workouts/:id returns 404 for non-existent workout', async () => {
        const response = await request(app).patch('/workouts/999').send({completed: true});
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Workout does not exist."});
    });

    test('DELETE /workouts/:id returns 404 for non-existent workout', async () => {
        const response = await request(app).delete('/workouts/999');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Workout does not exist."});
    });

    test('GET /workouts/:id/exercises returns 400 for invalid workout ID', async () => {
        const response = await request(app).get('/workouts/abc/exercises');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "ID must be a positive integer."});
    });

    test('GET /workouts/:id/exercises returns 404 for non-existent workout', async () => {
        const response = await request(app).get('/workouts/99999/exercises');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Workout does not exist."});
    });

    test('GET /workouts/:id/exercises returns empty array when workout has no exercises', async () => {
        const createWorkoutResponse = await request(app).post('/workouts').send({
            name: 'Exercise Test Workout',
            completed: false 
        });
        expect(createWorkoutResponse.status).toBe(201);
        const workoutId = createWorkoutResponse.body.id;
        const response = await request(app).get(`/workouts/${workoutId}/exercises`);
        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
    });

    test('GET /workouts/:id/exercises returns exercises for workout', async () => {
        const createWorkoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workout = createWorkoutResult.rows[0];
        const { id } = workout;
        await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2)',
            [id, 'Bench press']
        );

        const response = await request(app).get(`/workouts/${id}/exercises`);
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({ workout_id: id, name: 'Bench press'});
    });

    test('POST /workouts/:id/exercises creates an exercise', async () => {
        const result = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workout = result.rows[0];
        const { id } = workout;
        const response = await request(app)
            .post(`/workouts/${id}/exercises`)
            .send({ name: "Bench press" }
        );
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            workout_id: id,
            name: "Bench press"
        });
        expect(response.body.id).toEqual(expect.any(Number));
    });

    test('POST workouts/:id/exercises returns 400 for invalid workout ID', async () => {
        const response = await request(app)
            .post('/workouts/abc/exercises')
            .send({ name: "Bench press" });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "ID must be a positive integer."});
    });

    test('POST workouts/:id/exercises returns 400 for non-string exercise name', async () => {
        const response = await request(app)
            .post('/workouts/1/exercises')
            .send({ name: 1 });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Exercise name must be a string."});
    });

    test('POST /workouts/:id/exercises returns 400 for empty exercise name', async () => {
        const response = await request(app)
            .post('/workouts/1/exercises')
            .send({ name: "     "});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Exercise name cannot be empty."});
    });

    test('POST /workouts/:id/exercises returns 400 for exercise name over 100 characters.', async () => {
        const response = await request(app)
            .post('/workouts/1/exercises')
            .send({ name: "a".repeat(101) });
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Exercise name must be 100 characters or less."});
    });

    test('POST /workouts/:id/exercises returns 404 for non-existent workout', async () => {
        const response = await request(app)
            .post('/workouts/99999/exercises')
            .send({ name: "Bench press "});
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Workout does not exist." });
    });

    test('DELETE /workouts/:workoutId/exercises/:exerciseId deletes an exercise', async () => {
        const createWorkoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = createWorkoutResult.rows[0].id;
        const createExerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = createExerciseResult.rows[0].id;
        const response = await request(app)
            .delete(`/workouts/${workoutId}/exercises/${exerciseId}`);
        expect(response.status).toBe(204);
        const checkResult = await pool.query<Exercise>(
            'SELECT * FROM exercises WHERE id = $1',
            [exerciseId]
        ); 
        expect(checkResult.rows).toHaveLength(0);
    });

    test('DELETE /workouts/:workoutId/exercises/:exerciseId returns 400 for invalid workout ID', async () => {
        const response = await request(app).delete('/workouts/abc/exercises/999999');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Workout ID must be a positive integer." });
    });

    test('DELETE /workouts/:workoutId/exercises/:exerciseId returns 400 for invalid exercise ID', async () => {
        const response = await request(app).delete('/workouts/999999/exercises/abc');
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Exercise ID must be a positive integer." });
    });

    test('DELETE /workouts/:workoutId/exercises/:exerciseId returns 404 for non-existent workout', async () => {
        const response = await request(app).delete('/workouts/999999/exercises/999999');
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Workout does not exist." });
    });

    test('DELETE /workouts/:workoutId/exercises/:exerciseId returns 404 for non-existent exercise', async () => {
        const result = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = result.rows[0].id;
        const response = await request(app).delete(`/workouts/${workoutId}/exercises/999999`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Exercise not found for this workout." });
    });

    test('DELETE /workouts/:workoutId/exercises/:exerciseId returns 404 when exercise belongs to another workout', async () => {
        const createWorkout1Result = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const createWorkout2Result = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Pull day']
        );
        const workout1Id = createWorkout1Result.rows[0].id;
        const workout2Id = createWorkout2Result.rows[0].id;
        const createExerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workout1Id, 'Bench press']
        );
        const exerciseId = createExerciseResult.rows[0].id;
        const response = await request(app)
            .delete(`/workouts/${workout2Id}/exercises/${exerciseId}`);
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Exercise not found for this workout." });
        const checkResult = await pool.query<Exercise>(
            'SELECT * FROM exercises WHERE id = $1',
            [exerciseId]
        );
        expect(checkResult.rows).toHaveLength(1);
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId updates an exercise', async () => {
        const createWorkoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = createWorkoutResult.rows[0].id;
        const createExerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (name, workout_id) VALUES ($1, $2) RETURNING *',
            ['Bench press', workoutId]
        );
        const exerciseId = createExerciseResult.rows[0].id;
        const response = await request(app)
            .patch(`/workouts/${workoutId}/exercises/${exerciseId}`)
            .send({ name: 'Incline dumbbell press'}      
        ); 
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({ 
            id: exerciseId, 
            workout_id: workoutId, 
            name: 'Incline dumbbell press'}
        );
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 400 for invalid workout ID', async () => {
        const response = await request(app)
            .patch('/workouts/abc/exercises/999999')
            .send({name: 'Incline dumbbell press'}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Workout ID must be a positive integer."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 400 for invalid exercise ID', async () => {
        const response = await request(app)
            .patch('/workouts/999999/exercises/abc')
            .send({name: 'Incline dumbbell press'}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Exercise ID must be a positive integer."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 400 for non-string exercise name', async () => {
        const response = await request(app)
            .patch('/workouts/999999/exercises/999999')
            .send({name: 123}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Exercise name must be a string."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 400 for empty exercise name', async () => {
        const response = await request(app)
            .patch('/workouts/999999/exercises/999999')
            .send({name: '      '}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Exercise name cannot be empty."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 400 for exercise name over 100 characters', async () => {
        const response = await request(app)
            .patch('/workouts/999999/exercises/999999')
            .send({name: 'a'.repeat(101)}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({ message: "Exercise name must be 100 characters or less."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 404 for non-existent workout', async () => {
        const response = await request(app)
            .patch('/workouts/999999/exercises/999999')
            .send({name: 'Incline dumbbell press'}
        );
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Workout does not exist."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 404 for non-existent exercise', async () => {
        const createWorkoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = createWorkoutResult.rows[0].id;
        const response = await request(app)
            .patch(`/workouts/${workoutId}/exercises/999999`)
            .send({ name: 'Incline dumbbell press'}
        );
        expect(response.status).toBe(404);
        expect(response.body).toEqual({ message: "Exercise not found for this workout."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId returns 404 when exercise belongs to another workout', async () => {
        const createWorkoutResult1 = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const createWorkoutResult2 = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Pull day']
        );
        const workoutId1 = createWorkoutResult1.rows[0].id;
        const workoutId2 = createWorkoutResult2.rows[0].id;
        const createExerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (name, workout_id) VALUES ($1, $2) RETURNING *',
            ['Bench press', workoutId1]
        );
        const exerciseId = createExerciseResult.rows[0].id;
        const response = await request(app)
            .patch(`/workouts/${workoutId2}/exercises/${exerciseId}`)
            .send({ name: 'Incline dumbbell press'}      
        ); 
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Exercise not found for this workout."})
        const checkResult = await pool.query<Exercise>(
            'SELECT * FROM exercises WHERE id = $1 AND workout_id = $2 AND name = $3',
            [exerciseId, workoutId1, 'Bench press']);
        expect(checkResult.rows).toHaveLength(1);
    });

    test('GET /workouts/:workoutId/exercises/:exerciseId/sets returns sets for exercise', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;

        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;

        await pool.query(
            'INSERT INTO exercise_sets (exercise_id, set_number, reps, weight_kg, rpe) \
            VALUES ($1, $2, $3, $4, $5)',
            [exerciseId, 1, 8, 82.5, 8.5]
        );

        const response = await request(app).get(`/workouts/${workoutId}/exercises/${exerciseId}/sets`)
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(1);
        expect(response.body[0]).toMatchObject({
            exercise_id: exerciseId,
            set_number: 1,
            reps: 8,
            weight_kg: 82.5,
            rpe: 8.5
        });
    });

    test('GET /workouts/:workoutId/exercises/:exerciseId/sets returns no sets for exercise', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;

        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;

        const response = await request(app).get(`/workouts/${workoutId}/exercises/${exerciseId}/sets`)
        expect(response.status).toBe(200);
        expect(response.body).toHaveLength(0);
        expect(response.body).toEqual([]);
    });

    test('GET /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid workout ID', async () => {
        const response = await request(app).get(`/workouts/abc/exercises/999999/sets`)
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Workout ID must be a positive integer."})
    });

    test('GET /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid exercise ID', async () => {
        const response = await request(app).get(`/workouts/999999/exercises/abc/sets`)
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Exercise ID must be a positive integer."})
    });

    test('GET /workouts/:workoutId/exercises/:exerciseId/sets returns 404 for non-existent workout', async () => {
        const response = await request(app).get(`/workouts/999999/exercises/999999/sets`)
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Workout does not exist."})
    });

    test('GET /workouts/:workoutId/exercises/:exerciseId/sets returns 404 for non-existent exercise', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        const response = await request(app).get(`/workouts/${workoutId}/exercises/999999/sets`)
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Exercise not found for this workout."})
    });

    test('GET /workouts/:workoutId/exercises/:exerciseId/sets returns 404 when exercise belongs to another workout', async () => {
        const workoutResult1 = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId1 = workoutResult1.rows[0].id;

        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId1, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;

        const workoutResult2 = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Pull day']
        );
        const workoutId2 = workoutResult2.rows[0].id;

        const response = await request(app).get(`/workouts/${workoutId2}/exercises/${exerciseId}/sets`)
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Exercise not found for this workout."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets creates a set', async () => {
        // create workout using db
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        // create exercise using db
        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;
        // send http request to create set
        const response = await request(app)
            .post(`/workouts/${workoutId}/exercises/${exerciseId}/sets`)
            .send({
                setNumber: 1,
                reps: 8,
                weightKg: 82.5,
                rpe: 8.5
            });
        // assert
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            exercise_id: exerciseId,
            set_number: 1,
            reps: 8,
            weight_kg: 82.5,
            rpe: 8.5
        });
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets allows optional weight and RPE', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Push ups']
        );
        const exerciseId = exerciseResult.rows[0].id;
        const response = await request(app)
            .post(`/workouts/${workoutId}/exercises/${exerciseId}/sets`)
            .send({
                setNumber: 1,
                reps: 15
            });
        
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            exercise_id: exerciseId,
            set_number: 1,
            reps: 15,
            weight_kg: null,
            rpe: null
        });
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets allows 0 reps', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['One Rep Max test']
        );
        const workoutId = workoutResult.rows[0].id;
        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;
        const response = await request(app)
            .post(`/workouts/${workoutId}/exercises/${exerciseId}/sets`)
            .send({
                setNumber: 1,
                reps: 0,
                weightKg: 120,
                rpe: 10
            });
        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
                exercise_id: exerciseId,
                set_number: 1,
                reps: 0,
                weight_kg: 120,
                rpe: 10
        });
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid workout ID', async () => {
        const response = await request(app)
            .post('/workouts/abc/exercises/999999/sets')
            .send({setNumber: 1, reps: 8}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Workout ID must be a positive integer."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid exercise ID', async () => {
        const response = await request(app)
            .post('/workouts/999999/exercises/abc/sets')
            .send({setNumber: 1, reps: 8}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Exercise ID must be a positive integer."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid set number', async () => {
        let response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 0, reps: 8}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set number must be a positive integer."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: -10, reps: 8}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set number must be a positive integer."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1.5, reps: 8}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set number must be a positive integer."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 'abc', reps: 8}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set number must be a positive integer."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid reps', async () => {
        let response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: -10}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Reps must be an integer 0 or greater."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 8.5}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Reps must be an integer 0 or greater."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 'abc'}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Reps must be an integer 0 or greater."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid weight', async () => {
        let response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 10, weightKg: -10}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Weight must be a number 0 or greater."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 10, weightKg: 'abc'}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Weight must be a number 0 or greater."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 400 for invalid RPE', async () => {
        let response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 10, rpe: 0}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "RPE must be a number between 1 and 10."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 10, rpe: 11}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "RPE must be a number between 1 and 10."});

        response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 10, rpe: 'abc'}
        );
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "RPE must be a number between 1 and 10."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 404 for non-existent workout', async () => {
        const response = await request(app)
            .post('/workouts/999999/exercises/999999/sets')
            .send({setNumber: 1, reps: 8}
        );
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Workout does not exist."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 404 for non-existent exercise', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        
        const response = await request(app)
            .post(`/workouts/${workoutId}/exercises/999999/sets`)
            .send({setNumber: 1, reps: 8}
        );
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Exercise not found for this workout."});
    });

    test('POST /workouts/:workoutId/exercises/:exerciseId/sets returns 404 when exercise belongs to another workout', async () => {
        const workoutResult1 = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId1 = workoutResult1.rows[0].id;
        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId1, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;
        const workoutResult2 = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Pull day']
        );
        const workoutId2 = workoutResult2.rows[0].id;
        
        const response = await request(app)
            .post(`/workouts/${workoutId2}/exercises/${exerciseId}/sets`)
            .send({setNumber: 1, reps: 8}
        );
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Exercise not found for this workout."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId can update one property of a set', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;
        const setResult = await pool.query<ExerciseSet>(
            'INSERT INTO exercise_sets (exercise_id, set_number, reps, weight_kg, rpe) \
            VALUES ($1, $2, $3, $4, $5) \
            RETURNING *',
            [exerciseId, 1, 8, 80, 8]
        );
        const setId = setResult.rows[0].id;
        const response = await request(app)
            .patch(`/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`)
            .send({reps: 10});
        
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            id: setId,
            exercise_id: exerciseId, 
            set_number: 1,
            reps: 10,
            weight_kg: 80,
            rpe: 8
        });
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId can update multiple properties of a set', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;
        const setResult = await pool.query<ExerciseSet>(
            'INSERT INTO exercise_sets (exercise_id, set_number, reps, weight_kg, rpe) \
            VALUES ($1, $2, $3, $4, $5) \
            RETURNING *',
            [exerciseId, 1, 8, 80, 8]
        );
        const setId = setResult.rows[0].id;
        const response = await request(app)
            .patch(`/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`)
            .send({
                setNumber: 2,
                reps: 10,
                weightKg: 75,
                rpe: 9}
            );
        
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            id: setId,
            exercise_id: exerciseId, 
            set_number: 2,
            reps: 10,
            weight_kg: 75,
            rpe: 9
        });
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId can clear optional weight and RPE', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        const exerciseResult = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId = exerciseResult.rows[0].id;
        const setResult = await pool.query<ExerciseSet>(
            'INSERT INTO exercise_sets (exercise_id, set_number, reps, weight_kg, rpe) \
            VALUES ($1, $2, $3, $4, $5) \
            RETURNING *',
            [exerciseId, 1, 8, 80, 8]
        );
        const setId = setResult.rows[0].id;
        const response = await request(app)
            .patch(`/workouts/${workoutId}/exercises/${exerciseId}/sets/${setId}`)
            .send({
                weightKg: null,
                rpe: null
            });
        
        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            id: setId,
            exercise_id: exerciseId, 
            set_number: 1,
            reps: 8,
            weight_kg: null,
            rpe: null
        });
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for invalid workout ID', async () => {
        const response = await request(app).patch('/workouts/abc/exercises/999999/sets/999999').send({reps: 10});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Workout ID must be a positive integer."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for invalid exercise ID', async () => {
        const response = await request(app).patch('/workouts/999999/exercises/abc/sets/999999').send({reps: 10});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Exercise ID must be a positive integer."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for invalid set ID', async () => {
        const response = await request(app).patch('/workouts/999999/exercises/999999/sets/abc').send({reps: 10});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set ID must be a positive integer."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for empty update', async () => {
        const response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "No updates provided."})
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for invalid set number', async () => {
        let response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({setNumber: -1});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set number must be a positive integer."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({setNumber: 1.5});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set number must be a positive integer."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({setNumber: 'abc'});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Set number must be a positive integer."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for invalid reps', async () => {
        let response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({reps: -1});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Reps must be an integer 0 or greater."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({reps: 8.5});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Reps must be an integer 0 or greater."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({reps: 'abc'});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Reps must be an integer 0 or greater."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for invalid weight', async () => {
        let response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({weightKg: -10});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Weight must be a number 0 or greater, or null."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({weightKg: 'abc'});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "Weight must be a number 0 or greater, or null."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 400 for invalid RPE', async () => {
        let response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({rpe: -10});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "RPE must be a number between 1 and 10, or null."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({rpe: 0});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "RPE must be a number between 1 and 10, or null."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({rpe: 11});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "RPE must be a number between 1 and 10, or null."});

        response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({rpe: 'abc'});
        expect(response.status).toBe(400);
        expect(response.body).toEqual({message: "RPE must be a number between 1 and 10, or null."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 404 for non-existent workout', async () => {
        const response = await request(app).patch('/workouts/999999/exercises/999999/sets/999999').send({reps: 8});
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Workout does not exist."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 404 for non-existent exercise', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        const response = await request(app).patch(`/workouts/${workoutId}/exercises/999999/sets/999999`).send({reps: 8});
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message: "Exercise not found for this workout."});
    });

    test('PATCH /workouts/:workoutId/exercises/:exerciseId/sets/:setId returns 404 when set belongs to another exercise', async () => {
        const workoutResult = await pool.query<Workout>(
            'INSERT INTO workouts (name) VALUES ($1) RETURNING *',
            ['Push day']
        );
        const workoutId = workoutResult.rows[0].id;
        const exerciseResult1 = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Bench press']
        );
        const exerciseId1 = exerciseResult1.rows[0].id;
        const exerciseResult2 = await pool.query<Exercise>(
            'INSERT INTO exercises (workout_id, name) VALUES ($1, $2) RETURNING *',
            [workoutId, 'Pec fly']
        );
        const exerciseId2 = exerciseResult2.rows[0].id; 
        const setResult = await pool.query<ExerciseSet>(
            'INSERT INTO exercise_sets (exercise_id, set_number, reps, weight_kg, rpe) \
            VALUES ($1, $2, $3, $4, $5) \
            RETURNING *',
            [exerciseId1, 1, 8, 80, 8]
        );
        const setId = setResult.rows[0].id;
        const response = await request(app)
            .patch(`/workouts/${workoutId}/exercises/${exerciseId2}/sets/${setId}`)
            .send({reps: 10});
        
        expect(response.status).toBe(404);
        expect(response.body).toEqual({message:"Set not found for this exercise."});
    });


});

test('tests use test database', () => {
    expect(process.env.DB_NAME).toBe('workout_tracker_test');
});

test('GET / returns Workout Tracker API', async () => {
    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toBe('Workout Tracker API');
});

test('GET /workouts/abc returns 400 for invalid ID', async () => {
    const response = await request(app).get('/workouts/abc');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
        message: 'ID must be a positive integer.'
    });
});

test('POST /workouts returns 400 for invalid \'name\' property', async () => {
    const response = await request(app).post('/workouts').send({name: 123});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
        message: 'Name must be a string.'
    });
});

test ('POST /workouts returns 400 for invalid \'completed\' property', async () => {
    const response = await request(app).post('/workouts').send({name:'Push day', completed:123});
    expect(response.status).toBe(400);
    expect(response.body).toEqual({
        message: 'Completed must be a boolean (true/false).'
    });
});

test('PATCH /workouts/:id returns 400 for no body', async () => {
    const response = await request(app).patch('/workouts/999');
    expect(response.status).toBe(400);
    expect(response.body).toEqual({message: 'At least one field must be provided.'});
});