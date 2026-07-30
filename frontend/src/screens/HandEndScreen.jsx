export default function HandEndScreen({ result, room, user, onContinue }) {
  const nameByUserId = Object.fromEntries(room.players.map((p) => [p.userId, p.name]));
  const winnerName = result.winnerId ? nameByUserId[result.winnerId] ?? '—' : null;

  return (
    <main className="screen screen-center">
      <div className="card card-wide">
        <h1>{result.draw ? 'El berabere bitti' : `${winnerName} eli bitirdi!`}</h1>
        <p className="subtitle">
          {result.draw ? 'Taş yığını bitti, kimse elini bitiremedi.' : 'Puanlar güncellendi.'}
        </p>

        {!result.draw && (
          <ul className="player-list">
            {Object.entries(result.scores).map(([userId, score]) => (
              <li key={userId} className="player-list-item">
                <span>{nameByUserId[userId] ?? '—'}</span>
                {Number(userId) === user.id && <span className="badge badge-muted">Sen</span>}
                <span className={score >= 0 ? 'status-ok' : 'status-down'}>
                  {score >= 0 ? `+${score}` : score}
                </span>
              </li>
            ))}
          </ul>
        )}

        {result.sessionScores && (
          <>
            <h2>Oturum toplamı</h2>
            <ul className="player-list">
              {Object.entries(result.sessionScores).map(([userId, score]) => (
                <li key={userId} className="player-list-item">
                  <span>{nameByUserId[userId] ?? '—'}</span>
                  <span className={score >= 0 ? 'status-ok' : 'status-down'}>
                    {score >= 0 ? `+${score}` : score}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <button className="button button-primary" onClick={onContinue}>Masaya dön</button>
      </div>
    </main>
  );
}
