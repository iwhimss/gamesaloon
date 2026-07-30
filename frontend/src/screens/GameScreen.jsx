import { useMemo, useState } from 'react';
import Tile from '../components/Tile';

export default function GameScreen({ game, room, user, onDraw, onDiscard, onFinishHand, onLeave, error }) {
  const [selectedTileId, setSelectedTileId] = useState(null);

  const nameByUserId = useMemo(() => {
    const map = {};
    for (const p of room.players) map[p.userId] = p.name;
    return map;
  }, [room.players]);

  const isMyTurn = game.currentPlayerId === user.id;
  const canDraw = isMyTurn && game.turnPhase === 'draw';
  const canDiscardOrFinish = isMyTurn && game.turnPhase === 'discard';

  const sortedHand = [...game.hand].sort((a, b) => {
    if (a.isFakeOkey || b.isFakeOkey) return (a.isFakeOkey ? 1 : 0) - (b.isFakeOkey ? 1 : 0);
    if (a.color !== b.color) return a.color.localeCompare(b.color);
    return a.number - b.number;
  });

  function handleDiscard() {
    if (!selectedTileId) return;
    onDiscard(selectedTileId);
    setSelectedTileId(null);
  }

  if (game.status === 'bitti') {
    return (
      <main className="screen screen-center">
        <div className="card card-wide">
          <h1>El bitti</h1>
          <p className="subtitle">Sonuç ekranına yönlendiriliyorsunuz...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="screen">
      <div className="topbar">
        <h1>Masa {room.code}</h1>
        <button className="button button-ghost" onClick={onLeave}>Masadan ayrıl</button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <section className="card">
        <div className="game-info">
          <div>
            <span className="field-label">Gösterge</span>
            <Tile tile={game.indicatorTile} />
          </div>
          <div>
            <span className="field-label">Okey taşı</span>
            <Tile tile={game.okeyTile} />
          </div>
          <div>
            <span className="field-label">Yığın</span>
            <p>{game.drawPileCount} taş kaldı</p>
          </div>
        </div>

        <ul className="player-list">
          {game.players.map((p) => (
            <li key={p.userId} className={`player-list-item${game.currentPlayerId === p.userId ? ' player-turn' : ''}`}>
              <span>{nameByUserId[p.userId] ?? '—'}</span>
              {p.userId === user.id && <span className="badge badge-muted">Sen</span>}
              <span className="subtitle">{p.tileCount} taş</span>
              {game.currentPlayerId === p.userId && <span className="badge">Sırası</span>}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Atılan taşlar</h2>
        <div className="discard-pile">
          {game.topDiscard ? <Tile tile={game.topDiscard} /> : <p className="subtitle">Henüz taş atılmadı</p>}
        </div>
        {canDraw && (
          <div className="stack-row">
            <button className="button button-primary" onClick={() => onDraw('pile')}>Yığından çek</button>
            <button
              className="button button-secondary"
              onClick={() => onDraw('discard')}
              disabled={!game.topDiscard}
            >
              Atılandan çek
            </button>
          </div>
        )}
        {!isMyTurn && <p className="subtitle">Sıra {nameByUserId[game.currentPlayerId] ?? 'diğer oyuncuda'}.</p>}
      </section>

      <section className="card">
        <h2>Elin</h2>
        <div className="hand">
          {sortedHand.map((tile) => (
            <Tile
              key={tile.id}
              tile={tile}
              selected={selectedTileId === tile.id}
              onClick={canDiscardOrFinish ? () => setSelectedTileId(tile.id === selectedTileId ? null : tile.id) : undefined}
            />
          ))}
        </div>
        {canDiscardOrFinish && (
          <div className="stack-row">
            <button className="button button-primary" onClick={handleDiscard} disabled={!selectedTileId}>
              Seçili taşı at
            </button>
            <button className="button button-secondary" onClick={onFinishHand}>
              Elimi bitir
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
