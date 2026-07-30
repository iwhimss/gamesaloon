import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { guestLogin, BACKEND_URL } from './api/client';
import './App.css';

export default function App() {
  const [name, setName] = useState('');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gamesaloon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const socket = io(BACKEND_URL, { auth: { token: user.token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', (err) => setError(err.message));

    return () => socket.disconnect();
  }, [user]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');

    try {
      const { token, user: guestUser } = await guestLogin(name);
      const stored = { ...guestUser, token };
      localStorage.setItem('gamesaloon_user', JSON.stringify(stored));
      setUser(stored);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem('gamesaloon_user');
    socketRef.current?.disconnect();
    setUser(null);
    setConnected(false);
  }

  if (!user) {
    return (
      <main className="app">
        <h1>Oyun Salonu</h1>
        <form onSubmit={handleLogin}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsminizi girin"
            maxLength={32}
          />
          <button type="submit">Misafir olarak gir</button>
        </form>
        {error && <p className="error">{error}</p>}
      </main>
    );
  }

  return (
    <main className="app">
      <h1>Oyun Salonu</h1>
      <p>Hoş geldin, {user.name}</p>
      <p>
        Sunucu bağlantısı:{' '}
        <span className={connected ? 'status-ok' : 'status-down'}>
          {connected ? 'Bağlandı' : 'Bağlantı yok'}
        </span>
      </p>
      {error && <p className="error">{error}</p>}
      <button onClick={handleLogout}>Çıkış yap</button>
    </main>
  );
}
