import { useDraggable } from '@dnd-kit/core';
import Tile from './Tile';

export default function DragSourceTile({ id, tile, faceDown, disabled, label }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, disabled });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    touchAction: 'none',
    cursor: disabled ? 'default' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="drag-source"
      {...(disabled ? {} : { ...attributes, ...listeners })}
    >
      <span className="field-label">{label}</span>
      {tile ? <Tile tile={tile} faceDown={faceDown} /> : <div className="tile tile-empty" aria-hidden="true" />}
    </div>
  );
}
