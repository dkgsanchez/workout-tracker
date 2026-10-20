import express from 'express';
import cors from 'cors';
import { router as workoutRouter } from './routes/workoutRoutes.js';
import { router as exerciseRouter } from './routes/exerciseRoutes.js';
import { router as exerciseSetRouter } from './routes/exerciseSetRoutes.js';

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173'
}));
app.use('/workouts', workoutRouter);
app.use('/workouts', exerciseRouter);
app.use('/workouts', exerciseSetRouter);

app.get('/', (req, res) => {
    res.send('Workout Tracker API');
});

export { app };