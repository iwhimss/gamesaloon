import Mascot from './Mascot';
import Tile from './Tile';

export default function PlayerSeat({ player, isTurn, discardTile, emoji }) {
  if (!player) return <div className="seat seat-empty" />;

  return (
    <div className="seat">
      <Mascot userId={player.userId} name={player.name} isTurn={isTurn} connected={player.connected !== false} emoji={emoji} />
      <span className="seat-tile-count">{player.tileCount} taş</span>
      {discardTile && (
        <div className="seat-discard">
          <Tile tile={discardTile} />
        </div>
      )}
    </div>
  );
}
