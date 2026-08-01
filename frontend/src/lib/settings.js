const KEY = 'gamesaloon_settings';
const DEFAULTS = { soundEnabled: true, soundVolume: 0.6 };

export function getSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    return { ...DEFAULTS, ...stored };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(partial) {
  const next = { ...getSettings(), ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
