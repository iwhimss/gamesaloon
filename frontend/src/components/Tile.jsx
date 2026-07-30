const COLOR_STYLES = {
  kirmizi: '#dc2626',
  sari: '#ca8a04',
  mavi: '#2563eb',
  siyah: '#111827',
};

export default function Tile({ tile, selected, onClick, faceDown }) {
  if (faceDown) {
    return <div className="tile tile-facedown" aria-hidden="true" />;
  }

  const isJoker = tile.isFakeOkey;

  return (
    <button
      type="button"
      className={`tile${selected ? ' tile-selected' : ''}`}
      style={{ color: isJoker ? '#7c3aed' : COLOR_STYLES[tile.color] }}
      onClick={onClick}
      disabled={!onClick}
    >
      {isJoker ? '★' : tile.number}
    </button>
  );
}
