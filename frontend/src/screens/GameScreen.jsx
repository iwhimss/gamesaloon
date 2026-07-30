import { useMemo, useState } from 'react';
import Tile from '../components/Tile';
import Mascot from '../components/Mascot';
import PlayerSeat from '../components/PlayerSeat';
import { assignSeats } from '../lib/seatLayout';

export default function GameScreen({ game, room, user, onDraw, onDiscard, onFinishHand, onLeave, error }) {
  const [selectedTileId, setSelectedTileId] = useState(null);

  const nameByUserId = useMemo(() => {
    const map = {};
    for (const p of room.players) map[p.userId] = p.name;
    return map;
  }, [room.players]);

  const seatPlayers = useMemo(
    () => game.players.map((p) => ({ ...p, name: nameByUserId[p.userId] ?? '—' })),
    [game.players, nameByUserId],
  );

  const seats = useMemo(() => assignSeats(seatPlayers, user.id), [seatPlayers, user.id]);

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

  function discardTileFor(seatPlayer) {
    if (!seatPlayer || !game.topDiscard || game.lastDiscardBy !== seatPlayer.userId) return null;
    return game.topDiscard;
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
    <main className="screen game-screen">
      <div className="topbar">
        <h1>{room.name}</h1>
        <button className="button button-ghost" onClick={onLeave}>Masadan ayrıl</button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="table-scene">
        <div className="seat seat-top">
          <PlayerSeat player={seats.top} isTurn={game.currentPlayerId === seats.top?.userId} discardTile={discardTileFor(seats.top)} />
        </div>
        <div className="seat seat-left">
          <PlayerSeat player={seats.left} isTurn={game.currentPlayerId === seats.left?.userId} discardTile={discardTileFor(seats.left)} />
        </div>
        <div className="seat seat-right">
          <PlayerSeat player={seats.right} isTurn={game.currentPlayerId === seats.right?.userId} discardTile={discardTileFor(seats.right)} />
        </div>

        <div className="round-table">
          <div className="table-center">
            <div className="table-center-tiles">
              <div className="table-center-tile">
                <span className="field-label">Gösterge</span>
                <Tile tile={game.indicatorTile} />
              </div>
              <div className="table-center-tile">
                <span className="field-label">Okey</span>
                <Tile tile={game.okeyTile} />
              </div>
            </div>
            <p className="table-center-count">{game.drawPileCount} taş kaldı</p>
          </div>
        </div>
      </div>

      <section className="card own-area">
        <div className="own-area-header">
          <Mascot userId={user.id} name={user.name} isTurn={isMyTurn} size={48} />
          {isMyTurn ? (
            <span className="badge">Sıra sende</span>
          ) : (
            <span className="subtitle">Sıra {nameByUserId[game.currentPlayerId] ?? 'diğer oyuncuda'}.</span>
          )}
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
