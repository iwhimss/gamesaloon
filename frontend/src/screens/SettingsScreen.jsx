import { useState } from 'react';
import { getSettings, saveSettings } from '../lib/settings';
import { playDraw } from '../audio/sounds';

export default function SettingsScreen({ onClose }) {
  const [settings, setSettings] = useState(getSettings());

  function update(partial) {
    setSettings(saveSettings(partial));
  }

  return (
    <main className="screen screen-center">
      <div className="card card-wide">
        <div className="topbar">
          <h1>⚙️ Ayarlar</h1>
          <button className="button button-ghost" onClick={onClose}>Kapat</button>
        </div>

        <div className="stack">
          <label className="settings-row">
            <span>Ses efektleri</span>
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => update({ soundEnabled: e.target.checked })}
            />
          </label>

          <label className="settings-row">
            <span>Ses seviyesi</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.soundVolume}
              disabled={!settings.soundEnabled}
              onChange={(e) => update({ soundVolume: Number(e.target.value) })}
            />
          </label>

          <button className="button button-secondary" onClick={playDraw} disabled={!settings.soundEnabled}>
            Test sesi çal
          </button>
        </div>
      </div>
    </main>
  );
}
