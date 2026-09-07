import express from 'express';
import { pool } from './db.js';

const app = express();
app.use(express.json());
const PORT = 3000;

type Workout = {
    id: number;
    name: string;
    completed: boolean;
};

type WorkoutUpdates = {
    name?: string;
    completed?: boolean;
};

app.get('/', (req, res) => {
    res.send('Workout Tracker API');
});

app.get('/workouts', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM workouts;');
        return res.json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

app.get('/workouts/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({message: "ID must be a positive integer."});
    }

    try { 
        const result = await pool.query('SELECT * FROM workouts WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({message: "Workout does not exist."});
        }

        return res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

app.post('/workouts', async (req, res) => {
    const { name, completed } = req.body;
    if (typeof name !== 'string') {
        return res.status(400).json({message: "Name must be a string."});
    }
    if (name.trim().length === 0) {
        return res.status(400).json({message: "Name cannot be empty."});
    }
    if (completed !== undefined && typeof completed !== 'boolean') {
        return res.status(400).json({message: "Completed must be a boolean (true/false)."});
    }

    try {
        if (completed !== undefined) {
            const result = await pool.query('INSERT INTO workouts (name, completed) VALUES ($1, $2) RETURNING *;', [name.trim(), completed]);
            return res.status(201).json(result.rows[0]);
        } else {
            const result = await pool.query('INSERT INTO workouts (name) VALUES ($1) RETURNING *;', [name.trim()]);
            return res.status(201).json(result.rows[0]);
        }
        
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

app.patch('/workouts/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "ID must be a positive integer." });
    }

    const updates: WorkoutUpdates = req.body;
    const { name, completed } = updates;

    if (name === undefined && completed === undefined) {
        return res.status(400).json({ message: "At least one field must be provided."});
    }

    if (name !== undefined && typeof name !== 'string') {
        return res.status(400).json({ message: "Name must be a string."});
    }

    if (name !== undefined && name.trim() === '') {
        return res.status(400).json({ message: "Name cannot be empty."});
    }

    if (completed !== undefined && typeof completed !== 'boolean') {
        return res.status(400).json({ message: "Completed must be a boolean (true/false)."});
    }

    try {
        if (name !== undefined && completed === undefined) {
            const result = await pool.query(
                'UPDATE workouts SET name = $1 WHERE id = $2 RETURNING *',
                 [name.trim(), id]
                );
            
            if (result.rows.length === 0) {
                return res.status(404).json({message: "Workout does not exist."});
            }

            return res.json(result.rows[0]);
        } else if (completed !== undefined && name === undefined) {
            const result = await pool.query(
                'UPDATE workouts SET completed = $1 WHERE id = $2 RETURNING *',
                 [completed, id]
                );

            if (result.rows.length === 0) {
                return res.status(404).json({message: "Workout does not exist."});
            }

            return res.json(result.rows[0]);
        } else if (completed !== undefined && name !== undefined) {
            const result = await pool.query(
                'UPDATE workouts SET name = $1, completed = $2 WHERE id = $3 RETURNING *',
                 [name.trim(), completed, id]
                );
            
            if (result.rows.length === 0) {
                return res.status(404).json({message: "Workout does not exist."});
            }

            return res.json(result.rows[0]);
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});

    }
});

app.delete('/workouts/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ message: "ID must be a positive integer."});
    }

    try {
        const result = await pool.query('DELETE FROM workouts where id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({message: "Workout does not exist."});
        }
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({message: "Internal server error."});
    }
});

app.listen(PORT, () => {
    console.log('Server running on port 3000');
});
