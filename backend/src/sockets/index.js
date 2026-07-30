import { verifyToken } from '../middleware/auth.js';
import { registerRoomHandlers } from '../rooms/handlers.js';
import { registerHostHandlers } from '../rooms/hostHandlers.js';
import { registerGameHandlers } from '../rooms/gameHandlers.js';

export function registerSockets(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Yetkilendirme gerekli'));
    }

    try {
      socket.data.user = verifyToken(token);
      next();
    } catch {
      next(new Error('Geçersiz veya süresi dolmuş oturum'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[socket] bağlandı: ${socket.data.user.name} (${socket.id})`);

    registerRoomHandlers(io, socket);
    registerHostHandlers(io, socket);
    registerGameHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] ayrıldı: ${socket.data.user.name} (${reason})`);
    });
  });
}
