import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { guestLogin, BACKEND_URL } from './api/client';
import LoginScreen from './screens/LoginScreen';
import LobbyScreen from './screens/LobbyScreen';
import TableScreen from './screens/TableScreen';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gamesaloon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;

    const socket = io(BACKEND_URL, { auth: { token: user.token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => {
      setConnected(false);
      setRoom(null);
    });
    socket.on('connect_error', (err) => setError(err.message));
    socket.on('room:state', (state) => setRoom(state));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  async function handleLogin(name) {
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
    setRoom(null);
    setConnected(false);
  }

  function emitWithAck(event, payload) {
    return new Promise((resolve) => {
      setError('');
      socketRef.current?.emit(event, payload, (response) => {
        if (!response?.ok) setError(response?.error ?? 'Bir hata oluştu');
        else setRoom(response.room ?? room);
        resolve(response);
      });
    });
  }

  function handleCreateTable(payload) {
    return emitWithAck('room:create', payload);
  }

  function handleJoinTable(payload) {
    return emitWithAck('room:join', payload);
  }

  function handleLeaveTable() {
    socketRef.current?.emit('room:leave', {}, () => setRoom(null));
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} error={error} />;
  }

  if (!connected) {
    return (
      <main className="screen screen-center">
        <div className="card">
          <p className="subtitle">Sunucuya bağlanılıyor...</p>
          {error && <p className="error-text">{error}</p>}
        </div>
      </main>
    );
  }

  if (room) {
    return <TableScreen room={room} user={user} onLeave={handleLeaveTable} />;
  }

  return (
    <LobbyScreen
      user={user}
      onLogout={handleLogout}
      onCreate={handleCreateTable}
      onJoin={handleJoinTable}
      error={error}
    />
  );
}
