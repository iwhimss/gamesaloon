import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config/index.js';
import { healthRouter } from './routes/health.js';
import { guestRouter } from './routes/guest.js';
import { registerSockets } from './sockets/index.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use(healthRouter);
app.use(guestRouter);

const httpServer = http.createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });
registerSockets(io);

httpServer.listen(config.port, () => {
  console.log(`[backend] http://localhost:${config.port} (${config.nodeEnv})`);
});
