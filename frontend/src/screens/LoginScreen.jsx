import { useState } from 'react';

export default function LoginScreen({ onLogin, error }) {
  const [name, setName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    onLogin(name.trim());
  }

  return (
    <main className="screen screen-center">
      <div className="card">
        <h1>Oyun Salonu</h1>
        <p className="subtitle">Oynamaya başlamak için isminizi girin.</p>
        <form onSubmit={handleSubmit} className="stack">
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="İsminiz"
            maxLength={32}
            autoFocus
          />
          <button className="button button-primary" type="submit" disabled={!name.trim()}>
            Misafir olarak gir
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>
    </main>
  );
}
