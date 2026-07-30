import { mascotColorFor } from '../lib/seatLayout';

export default function Mascot({ userId, name, isTurn, connected = true, size = 64, emoji }) {
  const color = mascotColorFor(userId);

  return (
    <div className="mascot-wrap">
      <div
        className={`mascot${isTurn ? ' mascot-turn' : ''}${!connected ? ' mascot-disconnected' : ''}`}
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 100 100" width={size} height={size}>
          <ellipse cx="50" cy="58" rx="38" ry="34" fill={color} />
          <circle cx="28" cy="24" r="10" fill={color} />
          <circle cx="72" cy="24" r="10" fill={color} />
          <circle cx="28" cy="24" r="4" fill="#fff" opacity="0.6" />
          <circle cx="72" cy="24" r="4" fill="#fff" opacity="0.6" />
          <ellipse cx="36" cy="52" rx="6" ry="8" fill="#1f2937" />
          <ellipse cx="64" cy="52" rx="6" ry="8" fill="#1f2937" />
          <circle cx="38" cy="49" r="2" fill="#fff" />
          <circle cx="66" cy="49" r="2" fill="#fff" />
          <path d="M38 70 Q50 80 62 70" stroke="#1f2937" strokeWidth="4" fill="none" strokeLinecap="round" />
          <ellipse cx="22" cy="62" rx="6" ry="4" fill={color} opacity="0.85" />
          <ellipse cx="78" cy="62" rx="6" ry="4" fill={color} opacity="0.85" />
        </svg>
        {emoji && <span className="mascot-emoji">{emoji}</span>}
      </div>
      <span className="mascot-name">{name}</span>
    </div>
  );
}
