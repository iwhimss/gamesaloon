const ALLOWED_EMOJIS = ['👍', '😂', '😮', '😡', '❤️', '🎉'];
const RATE_LIMIT_MS = 2000;

const lastSentAt = new Map();

function fail(callback, message) {
  callback?.({ ok: false, error: message });
}

export function registerChatHandlers(io, socket) {
  const user = socket.data.user;

  socket.on('chat:emoji', ({ emoji } = {}, callback) => {
    const code = socket.data.currentRoom;
    if (!code) return fail(callback, 'Bir masada değilsiniz');
    if (!ALLOWED_EMOJIS.includes(emoji)) return fail(callback, 'Geçersiz emoji');

    const now = Date.now();
    const last = lastSentAt.get(user.sub) ?? 0;
    if (now - last < RATE_LIMIT_MS) return fail(callback, 'Çok hızlı emoji gönderiyorsun');
    lastSentAt.set(user.sub, now);

    io.to(code).emit('chat:emoji', { userId: user.sub, emoji });
    callback?.({ ok: true });
  });

  socket.on('disconnect', () => {
    lastSentAt.delete(user.sub);
  });
}

export { ALLOWED_EMOJIS };
