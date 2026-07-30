import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { guestRouter } from './routes/guest.js';
import { tablesRouter } from './routes/tables.js';
import { gamesRouter } from './routes/games.js';
import { registerSockets } from './sockets/index.js';

process.on('unhandledRejection', (err) => {
  console.error('[unhandledRejection]', err);
});

const app = express();
app.use(cors());
app.use(express.json());
app.use(healthRouter);
app.use(guestRouter);
app.use(tablesRouter);
app.use(gamesRouter);

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
registerSockets(io);

httpServer.listen(config.port, () => {
  console.log(`[backend] http://localhost:${config.port} (${config.nodeEnv})`);
});
