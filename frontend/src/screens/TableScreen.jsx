import { useEffect, useState } from 'react';
import { fetchGames } from '../api/client';

export default function TableScreen({ room, user, onLeave, onKick, onChangePassword, onTransferHost, onRename, onChangeGameType, onStartGame, onOpenSettings, error }) {
  const isHost = room.hostUserId === user.id;
  const isFull = room.players.length === room.maxPlayers;
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState(room.name);
  const [games, setGames] = useState([]);
  const [selectedGameType, setSelectedGameType] = useState(room.gameType);

  useEffect(() => {
    fetchGames().then(setGames);
  }, []);

  function submitPasswordChange(e) {
    e.preventDefault();
    onChangePassword(newPassword.trim() || undefined);
    setNewPassword('');
  }

  function submitRename(e) {
    e.preventDefault();
    onRename(newName.trim() || undefined);
  }

  function submitGameType(e) {
    e.preventDefault();
    onChangeGameType(selectedGameType);
  }

  return (
    <main className="screen screen-center">
      <div className="card card-wide">
        <div className="topbar">
          <div>
            <h1>{room.name}</h1>
            <p className="subtitle">
              Masa kodu: <strong>{room.code}</strong> · {room.gameType === 'okey' ? 'Okey' : room.gameType} · {room.players.length}/{room.maxPlayers} oyuncu
              {room.passwordProtected ? ' · 🔒 Şifreli' : ''}
            </p>
          </div>
          <div className="topbar-right">
            <button className="icon-button" onClick={onOpenSettings} aria-label="Ayarlar">⚙️</button>
            <button className="button button-ghost" onClick={onLeave}>Masadan ayrıl</button>
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <ul className="player-list">
          {room.players.map((p) => (
            <li key={p.userId} className="player-list-item">
              <span>{p.name}</span>
              {p.userId === room.hostUserId && <span className="badge">Host</span>}
              {p.userId === user.id && <span className="badge badge-muted">Sen</span>}
              <span className={p.connected ? 'status-ok' : 'status-down'}>
                {p.connected ? 'Bağlı' : 'Bağlı değil'}
              </span>
              {isHost && p.userId !== user.id && (
                <span className="player-actions">
                  <button className="button button-secondary" onClick={() => onTransferHost(p.userId)}>Host yap</button>
                  <button className="button button-danger" onClick={() => onKick(p.userId)}>At</button>
                </span>
              )}
            </li>
          ))}
        </ul>

        {isHost && (
          <form onSubmit={submitRename} className="stack host-panel">
            <label className="field-label" htmlFor="table-name">Masa adı</label>
            <div className="inline-form">
              <input
                id="table-name"
                className="input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={64}
              />
              <button className="button button-secondary" type="submit">Güncelle</button>
            </div>
          </form>
        )}

        {isHost && games.length > 1 && (
          <form onSubmit={submitGameType} className="stack host-panel">
            <label className="field-label" htmlFor="table-game-type">Oyun tipi</label>
            <div className="inline-form">
              <select
                id="table-game-type"
                className="input"
                value={selectedGameType}
                onChange={(e) => setSelectedGameType(e.target.value)}
              >
                {games.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
              <button className="button button-secondary" type="submit">Güncelle</button>
            </div>
          </form>
        )}

        {isHost && (
          <form onSubmit={submitPasswordChange} className="stack host-panel">
            <label className="field-label" htmlFor="table-password">Masa şifresi</label>
            <div className="inline-form">
              <input
                id="table-password"
                className="input"
                placeholder="Yeni şifre (boş bırakınca şifre kaldırılır)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button className="button button-secondary" type="submit">Güncelle</button>
            </div>
          </form>
        )}

        {isHost ? (
          <>
            <button className="button button-primary" onClick={onStartGame} disabled={!isFull}>
              {room.handCount > 0 ? 'Yeni El Başlat' : 'Oyunu Başlat'}
            </button>
            {!isFull && <p className="subtitle">Oyunu başlatmak için masanın dolu olması gerekir (4 oyuncu).</p>}
          </>
        ) : (
          <p className="subtitle">Host'un oyunu başlatması bekleniyor...</p>
        )}
      </div>

      {room.handCount > 0 && (
        <div className="card card-wide">
          <h2>Oturum skor tablosu ({room.handCount} el oynandı)</h2>
          <ul className="player-list">
            {room.players.map((p) => (
              <li key={p.userId} className="player-list-item">
                <span>{p.name}</span>
                {p.userId === user.id && <span className="badge badge-muted">Sen</span>}
                <span className={(room.sessionScores[p.userId] ?? 0) >= 0 ? 'status-ok' : 'status-down'}>
                  {(room.sessionScores[p.userId] ?? 0) >= 0 ? '+' : ''}{room.sessionScores[p.userId] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
