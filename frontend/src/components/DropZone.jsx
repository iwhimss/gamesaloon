import { useDroppable } from '@dnd-kit/core';

export default function DropZone({ id, active, className = '', children }) {
  const { setNodeRef, isOver } = useDroppable({ id, disabled: !active });

  const classes = [className, active ? 'dropzone-ready' : '', isOver && active ? 'dropzone-active' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={setNodeRef} className={classes}>
      {children}
    </div>
  );
}
