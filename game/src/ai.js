// Ember Duel — the Rune Warden, a simple heuristic opponent.
// Each AI step plays one card, waits a beat so the player can follow, then
// either plays again or ends the turn. Called from main.js on the foe's turn.
import { cardById } from './cards.js';
import { beginTurn, canPlay, combatPhase, otherHero, playCard } from './engine.js';

const STEP_MS = 750;

export function runAiTurn(state, onStep, onDone) {
  let guard = 0;
  const step = () => {
    if (state.phase !== 'playing' || state.active !== 'foe') { onDone(); return; }
    if (guard++ > 40) { finish(); return; }
    const pick = chooseCard(state, state.foe);
    if (pick) {
      playCard(state, state.foe, pick.uid);
      onStep();
      setTimeout(step, STEP_MS);
    } else {
      finish();
    }
  };
  const finish = () => {
    if (state.phase !== 'playing' || state.active !== 'foe') { onDone(); return; }
    combatPhase(state, state.foe);
    onStep();
    if (state.phase !== 'playing') { onDone(); return; }
    state.turn += 1;
    beginTurn(state, state.me);
    onStep();
    onDone();
  };
  setTimeout(step, 650);
}

// Pick the best affordable card: creatures first (biggest affordable that
// fits), then spells when their condition holds. Returns a hand card or null.
export function chooseCard(state, foe) {
  const me = otherHero(state, foe);
  const playable = foe.hand.filter((h) => canPlay(state, foe, h));
  if (playable.length === 0) return null;
  const creatures = playable
    .filter((h) => cardById(h.cardId).kind === 'creature')
    .sort((a, b) => cardById(b.cardId).cost - cardById(a.cardId).cost);
  if (creatures.length > 0 && foe.board.length < 5) return creatures[0];
  const spells = playable.filter((h) => cardById(h.cardId).kind === 'spell');
  for (const s of spells) {
    const fx = cardById(s.cardId).effect;
    if (fx.type === 'hero-damage' && (me.life <= fx.amount + 2 || foe.mana >= 6)) return s;
    if (fx.type === 'heal' && foe.life <= 20) return s;
    if (fx.type === 'draw' && foe.hand.length <= 2) return s;
    if (fx.type === 'mana' && foe.mana <= 2) return s;
    if (fx.type === 'board-damage' && me.board.length >= 2) return s;
  }
  // No good spell right now: play the cheapest creature if room, else nothing.
  if (creatures.length > 0 && foe.board.length < 5) return creatures[creatures.length - 1];
  return null;
}
