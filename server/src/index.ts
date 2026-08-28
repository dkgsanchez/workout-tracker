import express from 'express';

const app = express();
app.use(express.json());
const PORT = 3000;
const workouts = [
    {
        id: 1,
        name: "Push day",
        completed: true
    },
    {
        id: 2,
        name: "Pull day",
        completed: false
    }
    ];

app.get('/', (req, res) => {
    res.send('Workout Tracker API');
});

app.get('/workouts', (req, res) => {
    res.json(workouts);
});

app.get('/workouts/:id', (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({message: "ID must be a positive integer."});
    }

    const workout = workouts.find((workout) => workout.id === id);
    if (workout === undefined) {
        return res.status(404).json({message: "Workout does not exist."});
    }

    return res.json(workout);
});

app.post('/workouts', (req, res) => {
    const { name, completed } = req.body;
    if (typeof name !== 'string') {
        return res.status(400).json({message: "Name must be a string."});
    }
    if (name.trim().length === 0) {
        return res.status(400).json({message: "Name cannot be empty."});
    }
    if (typeof completed !== 'boolean') {
        return res.status(400).json({message: "Completed must be a boolean (true/false)."});
    }

    const workout = {
        id: workouts.length + 1,
        name: name.trim(),
        completed
    }; 
    workouts.push(workout);

    return res.status(201).json(workout);
});

app.listen(PORT, () => {
    console.log('Server running on port 3000');
});
