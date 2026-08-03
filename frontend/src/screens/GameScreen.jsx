import { useEffect, useMemo, useState } from 'react';
import { DndContext, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import Tile from '../components/Tile';
import DraggableTile from '../components/DraggableTile';
import DragSourceTile from '../components/DragSourceTile';
import DropZone from '../components/DropZone';
import Mascot from '../components/Mascot';
import PlayerSeat from '../components/PlayerSeat';
import { assignSeats } from '../lib/seatLayout';

function sortByColorAndNumber(tiles) {
  return [...tiles].sort((a, b) => {
    if (a.isFakeOkey || b.isFakeOkey) return (a.isFakeOkey ? 1 : 0) - (b.isFakeOkey ? 1 : 0);
    if (a.color !== b.color) return a.color.localeCompare(b.color);
    return a.number - b.number;
  });
}

const EMOJI_OPTIONS = ['👍', '😂', '😮', '😡', '❤️', '🎉'];

export default function GameScreen({ game, room, user, onDraw, onDiscard, onFinishHand, onLeave, onOpenSettings, onSendEmoji, activeEmojis, error }) {
  const orderKey = `gamesaloon_hand_order_${room.code}`;
  const [handOrder, setHandOrder] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(orderKey)) ?? [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    setHandOrder((prev) => {
      const currentIds = game.hand.map((t) => t.id);

      let next;
      if (prev.length === 0) {
        next = sortByColorAndNumber(game.hand).map((t) => t.id);
      } else {
        const currentIdSet = new Set(currentIds);
        const kept = prev.filter((id) => currentIdSet.has(id));
        const additions = currentIds.filter((id) => !kept.includes(id));
        next = [...kept, ...additions];
      }

      localStorage.setItem(orderKey, JSON.stringify(next));
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.hand, orderKey]);

  const orderedHand = useMemo(() => {
    const byId = Object.fromEntries(game.hand.map((t) => [t.id, t]));
    return handOrder.map((id) => byId[id]).filter(Boolean);
  }, [handOrder, game.hand]);

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

  const [remainingSeconds, setRemainingSeconds] = useState(null);

  useEffect(() => {
    if (!game.turnDeadline) {
      setRemainingSeconds(null);
      return undefined;
    }

    function tick() {
      setRemainingSeconds(Math.max(0, Math.round((game.turnDeadline - Date.now()) / 1000)));
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [game.turnDeadline]);

  const isMyTurn = game.currentPlayerId === user.id;
  const canDraw = isMyTurn && game.turnPhase === 'draw';
  const canDiscardOrFinish = isMyTurn && game.turnPhase === 'discard';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function discardTileFor(seatPlayer) {
    if (!seatPlayer || !game.topDiscard || game.lastDiscardBy !== seatPlayer.userId) return null;
    return game.topDiscard;
  }

  function handleDragEnd({ active, over }) {
    if (!over) return;

    // Istaka bir SortableContext içerdiği için elin üstüne bırakılan bir taş,
    // "hand-zone" yerine altındaki taşın id'sini döndürebilir — ikisini de kabul et.
    const isOverHand = over.id === 'hand-zone' || handOrder.includes(over.id);

    if (active.id === 'source-pile' && isOverHand && canDraw) {
      onDraw('pile');
      return;
    }

    if (active.id === 'source-discard' && isOverHand && canDraw && game.topDiscard) {
      onDraw('discard');
      return;
    }

    const isHandTile = handOrder.includes(active.id);

    if (isHandTile && over.id === 'discard-zone' && canDiscardOrFinish) {
      onDiscard(active.id);
      return;
    }

    if (isHandTile && active.id !== over.id && handOrder.includes(over.id)) {
      setHandOrder((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        const next = arrayMove(prev, oldIndex, newIndex);
        localStorage.setItem(orderKey, JSON.stringify(next));
        return next;
      });
    }
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
        <div className="topbar-right">
          <button className="icon-button" onClick={onOpenSettings} aria-label="Ayarlar">⚙️</button>
          <button className="button button-ghost" onClick={onLeave}>Masadan ayrıl</button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="table-scene">
          <div className="seat seat-top">
            <PlayerSeat player={seats.top} isTurn={game.currentPlayerId === seats.top?.userId} discardTile={discardTileFor(seats.top)} emoji={activeEmojis?.[seats.top?.userId]?.emoji} />
          </div>
          <div className="seat seat-left">
            <PlayerSeat player={seats.left} isTurn={game.currentPlayerId === seats.left?.userId} discardTile={discardTileFor(seats.left)} emoji={activeEmojis?.[seats.left?.userId]?.emoji} />
          </div>
          <div className="seat seat-right">
            <PlayerSeat player={seats.right} isTurn={game.currentPlayerId === seats.right?.userId} discardTile={discardTileFor(seats.right)} emoji={activeEmojis?.[seats.right?.userId]?.emoji} />
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
                <DragSourceTile
                  id="source-pile"
                  tile={{}}
                  faceDown
                  disabled={!canDraw || game.drawPileCount === 0}
                  label="Yığın"
                />
                <DragSourceTile
                  id="source-discard"
                  tile={game.topDiscard}
                  disabled={!canDraw || !game.topDiscard}
                  label="Atılan"
                />
              </div>
              <p className="table-center-count">{game.drawPileCount} taş kaldı</p>
            </div>
          </div>
        </div>

        <section className="card own-area">
          <div className="own-area-header">
            <Mascot userId={user.id} name={user.name} isTurn={isMyTurn} size={48} emoji={activeEmojis?.[user.id]?.emoji} />
            {isMyTurn ? (
              <span className="badge">Sıra sende</span>
            ) : (
              <span className="subtitle">Sıra {nameByUserId[game.currentPlayerId] ?? 'diğer oyuncuda'}.</span>
            )}
            {remainingSeconds != null && (
              <span className={`turn-timer${remainingSeconds <= 5 ? ' turn-timer-urgent' : ''}`}>
                ⏱ {remainingSeconds}s
              </span>
            )}
            <div className="emoji-picker">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="emoji-picker-button"
                  onClick={() => onSendEmoji(emoji)}
                  aria-label={`${emoji} gönder`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {canDraw && (
            <p className="subtitle">Yığından veya atılan taştan ıstakana sürükleyerek çek.</p>
          )}

          <DropZone id="hand-zone" active={canDraw} className="hand">
            <SortableContext items={handOrder} strategy={horizontalListSortingStrategy}>
              {orderedHand.map((tile) => (
                <DraggableTile key={tile.id} tile={tile} />
              ))}
            </SortableContext>
          </DropZone>

          {canDiscardOrFinish && (
            <>
              <DropZone id="discard-zone" active className="discard-dropzone">
                <span>Taşı atmak için buraya sürükle</span>
              </DropZone>
              <div className="stack-row">
                <button className="button button-secondary" onClick={onFinishHand}>
                  Elimi bitir
                </button>
              </div>
            </>
          )}
        </section>
      </DndContext>
    </main>
  );
}
