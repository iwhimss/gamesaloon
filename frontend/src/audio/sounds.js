import { getSettings } from '../lib/settings';

let ctx;

function getContext() {
  if (!ctx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    ctx = new AudioContextClass();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone({ freq, duration = 0.15, type = 'sine', startGain = 0.2, delay = 0 }) {
  const settings = getSettings();
  if (!settings.soundEnabled || settings.soundVolume <= 0) return;

  const audioCtx = getContext();
  if (!audioCtx) return;

  const now = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(startGain * settings.soundVolume, now + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain).connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.03);
}

export function playDraw() {
  tone({ freq: 420, duration: 0.12, type: 'triangle' });
}

export function playDiscard() {
  tone({ freq: 260, duration: 0.14, type: 'triangle' });
}

export function playTurn() {
  tone({ freq: 600, duration: 0.1 });
  tone({ freq: 840, duration: 0.16, delay: 0.09 });
}

export function playWin() {
  [523, 659, 784, 1047].forEach((freq, i) => tone({ freq, duration: 0.2, delay: i * 0.11 }));
}

export function playLose() {
  [420, 320].forEach((freq, i) => tone({ freq, duration: 0.28, delay: i * 0.16, type: 'sawtooth', startGain: 0.14 }));
}

export function playJoin() {
  tone({ freq: 520, duration: 0.1 });
  tone({ freq: 720, duration: 0.12, delay: 0.08 });
}
