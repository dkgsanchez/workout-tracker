import express from 'express';
import { router as workoutRouter } from './routes/workoutRoutes.js';

const app = express();
const PORT = 3000;
app.use(express.json());
app.use('/workouts', workoutRouter);

app.get('/', (req, res) => {
    res.send('Workout Tracker API');
});

app.listen(PORT, () => {
    console.log('Server running on port 3000');
});
