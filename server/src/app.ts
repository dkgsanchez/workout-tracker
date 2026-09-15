import express from 'express';
import { router as workoutRouter } from './routes/workoutRoutes.js';

const app = express();
app.use(express.json());
app.use('/workouts', workoutRouter);

app.get('/', (req, res) => {
    res.send('Workout Tracker API');
});

export { app };