// Ember Duel — bootstrap, input and the AI turn loop.
import { runAiTurn } from './ai.js';
import { canPlay, endTurn, newGame, playCard, startMatch } from './engine.js';
import { render } from './render.js';
import { applyShot, mulberry32 } from './shots.js';
import { sfx, toggleMute } from './sound.js';

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '7');

let state = shot ? applyShot(shot, seed) : newGame(mulberry32((Math.random() * 1e9) | 0));
const ui = { selectedUid: null, lastPlayedUid: null, attackingUids: new Set(), aiRunning: false };
let lastLife = { me: state.me?.life ?? 30, foe: state.foe?.life ?? 30 };
let lastPhase = state.phase;

function draw() {
  render(state, ui);
  // Clear one-shot animation flags after the paint.
  for (const c of [...state.me.board, ...state.foe.board]) { c.hurt = false; c.justPlayed = false; }
  ui.lastPlayedUid = null;
  ui.attackingUids = new Set();
  // Sounds on life / phase changes.
  if (state.me.life < lastLife.me || state.foe.life < lastLife.foe) sfx.hurt();
  if (state.phase !== lastPhase) {
    if (state.phase === 'won') sfx.win();
    if (state.phase === 'lost') sfx.lose();
  }
  lastLife = { me: state.me.life, foe: state.foe.life };
  lastPhase = state.phase;
}

function afterPlayerAction() {
  draw();
  if (state.phase === 'playing' && state.active === 'foe' && !ui.aiRunning) {
    ui.aiRunning = true;
    runAiTurn(state, draw, () => { ui.aiRunning = false; draw(); });
  }
}

function tryPlay(uid) {
  const handCard = state.me.hand.find((h) => h.uid === uid);
  if (!handCard) return;
  if (!canPlay(state, state.me, handCard)) {
    ui.selectedUid = uid;
    draw();
    return;
  }
  const ok = playCard(state, state.me, uid);
  if (ok) {
    ui.selectedUid = null;
    ui.lastPlayedUid = state.me.board[state.me.board.length - 1]?.uid ?? null;
    sfx.play();
    afterPlayerAction();
  }
}

document.getElementById('app').addEventListener('click', (ev) => {
  const el = ev.target.closest('[data-action]');
  if (!el) return;
  const action = el.dataset.action;
  if (action === 'play') {
    sfx.click();
    startMatch(state);
    lastLife = { me: state.me.life, foe: state.foe.life };
    draw();
  } else if (action === 'card') {
    const uid = Number(el.dataset.uid);
    if (ui.selectedUid === uid) { ui.selectedUid = null; draw(); return; }
    tryPlay(uid);
  } else if (action === 'end-turn') {
    if (state.phase === 'playing' && state.active === 'me' && !ui.aiRunning) {
      sfx.turn();
      endTurn(state);
      afterPlayerAction();
    }
  } else if (action === 'again' || action === 'restart') {
    sfx.click();
    state = newGame(mulberry32((Math.random() * 1e9) | 0));
    ui.selectedUid = null; ui.aiRunning = false;
    startMatch(state);
    draw();
  } else if (action === 'title') {
    sfx.click();
    state = newGame(mulberry32((Math.random() * 1e9) | 0));
    ui.selectedUid = null; ui.aiRunning = false;
    draw();
  } else if (action === 'mute') {
    toggleMute();
    draw();
  }
});

document.addEventListener('keydown', (ev) => {
  if (state.phase !== 'playing') {
    if ((ev.key === 'r' || ev.key === 'R') && (state.phase === 'won' || state.phase === 'lost')) {
      state = newGame(mulberry32((Math.random() * 1e9) | 0));
      ui.selectedUid = null; ui.aiRunning = false;
      startMatch(state);
      draw();
    }
    return;
  }
  if (state.active !== 'me' || ui.aiRunning) return;
  if (ev.key >= '1' && ev.key <= '9') {
    const idx = Number(ev.key) - 1;
    const handCard = state.me.hand[idx];
    if (handCard) tryPlay(handCard.uid);
  } else if (ev.key === 'Enter' || ev.key === ' ') {
    ev.preventDefault();
    endTurn(state);
    afterPlayerAction();
  } else if (ev.key === 'Escape') {
    ui.selectedUid = null;
    draw();
  } else if (ev.key === 'm' || ev.key === 'M') {
    toggleMute();
    draw();
  }
});

draw();
