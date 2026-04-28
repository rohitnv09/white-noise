import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import profileRoutes from './routes/profiles.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/profiles', profileRoutes);

app.use(errorHandler);

export default app;
