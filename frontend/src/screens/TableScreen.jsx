export default function TableScreen({ room, user, onLeave }) {
  const isHost = room.hostUserId === user.id;

  return (
    <main className="screen screen-center">
      <div className="card card-wide">
        <div className="topbar">
          <div>
            <h1>Masa {room.code}</h1>
            <p className="subtitle">
              {room.gameType === 'okey' ? 'Okey' : room.gameType} · {room.players.length}/{room.maxPlayers} oyuncu
              {room.passwordProtected ? ' · 🔒 Şifreli' : ''}
            </p>
          </div>
          <button className="button button-ghost" onClick={onLeave}>Masadan ayrıl</button>
        </div>

        <ul className="player-list">
          {room.players.map((p) => (
            <li key={p.userId} className="player-list-item">
              <span>{p.name}</span>
              {p.userId === room.hostUserId && <span className="badge">Host</span>}
              {p.userId === user.id && <span className="badge badge-muted">Sen</span>}
              <span className={p.connected ? 'status-ok' : 'status-down'}>
                {p.connected ? 'Bağlı' : 'Bağlı değil'}
              </span>
            </li>
          ))}
        </ul>

        {isHost ? (
          <p className="subtitle">Tüm oyuncular hazır olduğunda oyunu başlatabilirsin.</p>
        ) : (
          <p className="subtitle">Host'un oyunu başlatması bekleniyor...</p>
        )}
      </div>
    </main>
  );
}
