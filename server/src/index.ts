import app from './app.js';
import { getDatabase, closeDatabase } from './db/connection.js';

const PORT = process.env.PORT ?? 3001;

getDatabase();
console.log('[Server] Database initialized');

const server = app.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
});

function shutdown() {
  console.log('[Server] Shutting down...');
  server.close(() => {
    closeDatabase();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
