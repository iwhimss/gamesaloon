const COLOR_STYLES = {
  kirmizi: '#dc2626',
  sari: '#ca8a04',
  mavi: '#2563eb',
  siyah: '#111827',
};

export default function Tile({ tile, faceDown }) {
  if (faceDown) {
    return <div className="tile tile-facedown" aria-hidden="true" />;
  }

  const isJoker = tile.isFakeOkey;

  return (
    <div className="tile" style={{ color: isJoker ? '#7c3aed' : COLOR_STYLES[tile.color] }}>
      {isJoker ? '★' : tile.number}
    </div>
  );
}
