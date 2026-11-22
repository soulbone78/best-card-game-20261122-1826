// Ember Duel — deterministic showcase states for screenshots.
// Each state is reached by actually playing the game with the real engine and
// the real AI (seeded), never by staging pixels: `play` stops mid-duel on the
// player's turn, `win`/`lose` play a whole duel to its end.
import { chooseCard } from './ai.js';
import { beginTurn, combatPhase, endTurn, newGame, playCard, startMatch } from './engine.js';

// Play one side's turn greedily: play affordable cards until none is good.
function greedyTurn(state, hero) {
  let guard = 0;
  while (guard++ < 30) {
    const pick = chooseCard(state, hero);
    if (!pick) break;
    playCard(state, hero, pick.uid);
    if (state.phase !== 'playing') return;
  }
  combatPhase(state, hero);
}

function autoDuel(state, playerPlays) {
  let guard = 0;
  while (state.phase === 'playing' && guard++ < 120) {
    if (state.active === 'me') {
      if (playerPlays) greedyTurn(state, state.me);
      else combatPhase(state, state.me);
      if (state.phase !== 'playing') break;
      state.turn += 1;
      beginTurn(state, state.foe);
    } else {
      greedyTurn(state, state.foe);
      if (state.phase !== 'playing') break;
      state.turn += 1;
      beginTurn(state, state.me);
    }
  }
}

function playTurns(state, n, playerPlays = true) {
  // Play n full rounds and stop at the START of the player's (n+1)-th turn,
  // so the frozen table shows the player's move with a fresh hand of mana.
  let done = 0;
  let guard = 0;
  while (state.phase === 'playing' && guard++ < 120) {
    if (state.active === 'me') {
      if (done >= n) break;
      if (playerPlays) greedyTurn(state, state.me);
      else combatPhase(state, state.me);
      if (state.phase !== 'playing') break;
      done += 1;
      state.turn += 1;
      beginTurn(state, state.foe);
    } else {
      greedyTurn(state, state.foe);
      if (state.phase !== 'playing') break;
      state.turn += 1;
      beginTurn(state, state.me);
    }
  }
}

// Build a state for `?shot=start|play|win|lose&seed=N`.
export function applyShot(shot, seed) {
  const rng = mulberry32(seed);
  const state = newGame(rng);
  if (shot === 'start') return state; // title screen
  startMatch(state);
  if (shot === 'play') {
    playTurns(state, 4, true);
    return state;
  }
  if (shot === 'win') {
    autoDuel(state, true);
    return state;
  }
  if (shot === 'lose') {
    autoDuel(state, false);
    return state;
  }
  return state;
}

// Small deterministic PRNG (mulberry32).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export { endTurn };
