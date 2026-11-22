// Ember Duel — tiny synthesized sounds via WebAudio. No audio files.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, when = 0) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

export const sfx = {
  play: () => { tone(520, 0.12, 'triangle', 0.16); tone(780, 0.1, 'triangle', 0.12, 0.05); },
  draw: () => tone(660, 0.07, 'sine', 0.1),
  attack: () => { tone(180, 0.14, 'sawtooth', 0.14); tone(120, 0.16, 'sawtooth', 0.1, 0.04); },
  hurt: () => tone(220, 0.2, 'square', 0.08),
  heal: () => { tone(620, 0.12, 'sine', 0.12); tone(880, 0.16, 'sine', 0.1, 0.08); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.14, i * 0.12)); },
  lose: () => { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.26, 'triangle', 0.12, i * 0.14)); },
  click: () => tone(440, 0.05, 'sine', 0.08),
  turn: () => { tone(392, 0.1, 'sine', 0.1); tone(523, 0.12, 'sine', 0.1, 0.08); },
};
