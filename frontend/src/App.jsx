import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { guestLogin, BACKEND_URL } from './api/client';
import LoginScreen from './screens/LoginScreen';
import LobbyScreen from './screens/LobbyScreen';
import TableScreen from './screens/TableScreen';
import GameScreen from './screens/GameScreen';
import HandEndScreen from './screens/HandEndScreen';
import SettingsScreen from './screens/SettingsScreen';
import { playDiscard, playDraw, playJoin, playLose, playTurn, playWin } from './audio/sounds';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('gamesaloon_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [connected, setConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [game, setGame] = useState(null);
  const [handResult, setHandResult] = useState(null);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const socketRef = useRef(null);
  const prevGameRef = useRef(null);
  const prevPlayerCountRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;

    const socket = io(BACKEND_URL, { auth: { token: user.token } });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => {
      setConnected(false);
      setRoom(null);
      setGame(null);
    });
    socket.on('connect_error', (err) => setError(err.message));
    socket.on('room:state', (state) => {
      if (prevPlayerCountRef.current != null && state.players.length > prevPlayerCountRef.current) {
        playJoin();
      }
      prevPlayerCountRef.current = state.players.length;

      setRoom(state);
      if (state.status !== 'oynanıyor') setGame(null);
    });
    socket.on('room:kicked', () => {
      setRoom(null);
      setGame(null);
      setError('Masadan çıkarıldınız');
    });
    socket.on('game:state', (state) => {
      const prev = prevGameRef.current;
      if (prev && prev.currentPlayerId !== state.currentPlayerId && state.currentPlayerId === user.id) {
        playTurn();
      }
      if (prev && state.discardCount > prev.discardCount && state.lastDiscardBy !== user.id) {
        playDiscard();
      }
      prevGameRef.current = state;
      setGame(state);
    });
    socket.on('game:handEnded', (result) => {
      if (result.winnerId === user.id) playWin();
      else if (result.winnerId) playLose();
      prevGameRef.current = null;
      setHandResult(result);
      setGame(null);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      prevGameRef.current = null;
      prevPlayerCountRef.current = null;
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
    setGame(null);
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
    socketRef.current?.emit('room:leave', {}, () => {
      setRoom(null);
      setGame(null);
    });
  }

  function handleKick(targetUserId) {
    return emitWithAck('host:kick', { targetUserId });
  }

  function handleChangePassword(password) {
    return emitWithAck('host:changePassword', { password });
  }

  function handleTransferHost(targetUserId) {
    return emitWithAck('host:transfer', { targetUserId });
  }

  function handleRename(name) {
    return emitWithAck('host:rename', { name });
  }

  function handleChangeGameType(gameType) {
    return emitWithAck('host:changeGameType', { gameType });
  }

  function handleStartGame() {
    return emitWithAck('game:start', {});
  }

  function handleDraw(source) {
    setError('');
    socketRef.current?.emit('game:action', { type: 'draw', payload: { source } }, (response) => {
      if (!response?.ok) setError(response?.error ?? 'İşlem başarısız');
      else playDraw();
    });
  }

  function handleDiscard(tileId) {
    setError('');
    socketRef.current?.emit('game:action', { type: 'discard', payload: { tileId } }, (response) => {
      if (!response?.ok) setError(response?.error ?? 'İşlem başarısız');
      else playDiscard();
    });
  }

  function handleFinishHand() {
    setError('');
    socketRef.current?.emit('game:action', { type: 'finishHand', payload: {} }, (response) => {
      if (!response?.ok) setError(response?.error ?? 'İşlem başarısız');
    });
  }

  function dismissHandResult() {
    setHandResult(null);
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

  if (showSettings) {
    return <SettingsScreen onClose={() => setShowSettings(false)} />;
  }

  if (handResult && room) {
    return <HandEndScreen result={handResult} room={room} user={user} onContinue={dismissHandResult} />;
  }

  if (room && room.status === 'oynanıyor' && game) {
    return (
      <GameScreen
        game={game}
        room={room}
        user={user}
        onDraw={handleDraw}
        onDiscard={handleDiscard}
        onFinishHand={handleFinishHand}
        onLeave={handleLeaveTable}
        onOpenSettings={() => setShowSettings(true)}
        error={error}
      />
    );
  }

  if (room) {
    return (
      <TableScreen
        room={room}
        user={user}
        onLeave={handleLeaveTable}
        onKick={handleKick}
        onChangePassword={handleChangePassword}
        onTransferHost={handleTransferHost}
        onRename={handleRename}
        onChangeGameType={handleChangeGameType}
        onStartGame={handleStartGame}
        onOpenSettings={() => setShowSettings(true)}
        error={error}
      />
    );
  }

  return (
    <LobbyScreen
      user={user}
      onLogout={handleLogout}
      onCreate={handleCreateTable}
      onJoin={handleJoinTable}
      onOpenSettings={() => setShowSettings(true)}
      error={error}
    />
  );
}
