import { useEffect, useState } from 'react';
import { fetchTables } from '../api/client';

export default function LobbyScreen({ user, onLogout, onCreate, onJoin, error }) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createName, setCreateName] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  async function loadTables() {
    setLoading(true);
    try {
      const data = await fetchTables(user.token);
      setTables(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTables();
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    onCreate({ name: createName.trim() || undefined, gameType: 'okey', password: createPassword.trim() || undefined });
  }

  function handleJoin(e) {
    e.preventDefault();
    onJoin({ code: joinCode.trim().toUpperCase(), password: joinPassword.trim() || undefined });
  }

  return (
    <main className="screen">
      <header className="topbar">
        <h1>🃏 Oyun Salonu</h1>
        <div className="topbar-right">
          <span>Merhaba, {user.name}</span>
          <button className="button button-ghost" onClick={onLogout}>Çıkış yap</button>
        </div>
      </header>

      {error && <p className="error-text">{error}</p>}

      <section className="grid">
        <div className="card">
          <h2>Yeni masa kur</h2>
          <p className="subtitle">Okey masası — 4 oyuncu.</p>
          <form onSubmit={handleCreate} className="stack">
            <input
              className="input"
              type="text"
              placeholder="Masa adı (opsiyonel)"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              maxLength={64}
            />
            <input
              className="input"
              type="text"
              placeholder="Şifre (opsiyonel)"
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
            />
            <button className="button button-primary" type="submit">Masa Kur</button>
          </form>
        </div>

        <div className="card">
          <h2>Kod ile katıl</h2>
          <form onSubmit={handleJoin} className="stack">
            <input
              className="input"
              placeholder="Masa kodu"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              maxLength={6}
            />
            <input
              className="input"
              type="text"
              placeholder="Şifre (varsa)"
              value={joinPassword}
              onChange={(e) => setJoinPassword(e.target.value)}
            />
            <button className="button button-primary" type="submit" disabled={!joinCode.trim()}>Katıl</button>
          </form>
        </div>
      </section>

      <section className="card">
        <div className="topbar">
          <h2>Açık masalar</h2>
          <button className="button button-ghost" onClick={loadTables}>Yenile</button>
        </div>

        {loading && <p className="subtitle">Yükleniyor...</p>}
        {!loading && tables.length === 0 && <p className="subtitle">Şu an açık masa yok. İlk masayı sen kur!</p>}

        <ul className="table-list">
          {tables.map((t) => (
            <li key={t.code} className="table-list-item">
              <span className="table-name">{t.name}</span>
              <span className="table-code">{t.code}</span>
              <span>{t.gameType === 'okey' ? 'Okey' : t.gameType}</span>
              <span>{t.playerCount}/{t.maxPlayers} oyuncu</span>
              <span>{t.passwordProtected ? '🔒 Şifreli' : 'Açık'}</span>
              <button
                className="button button-secondary"
                disabled={t.playerCount >= t.maxPlayers}
                onClick={() => {
                  setJoinCode(t.code);
                  if (!t.passwordProtected) onJoin({ code: t.code });
                }}
              >
                {t.passwordProtected ? 'Kodu doldur' : 'Katıl'}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
