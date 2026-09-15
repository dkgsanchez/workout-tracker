import request from 'supertest';
import { expect, test, beforeEach, describe } from 'vitest';
import { app } from './app.js';
import { pool } from './db.js';
import type { Workout } from './types/workout.js';

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