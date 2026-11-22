// Ember Duel — game rules and state. Pure logic, no DOM: the renderer reads this.
// Turn flow: draw a card, gain a mana crystal, play cards, then creatures attack.
// A ready creature (played on an earlier turn) attacks the enemy creature
// directly across from it, or the enemy hero when the slot is empty.
import { buildDeck, cardById } from './cards.js';

export const MAX_LIFE = 30;
export const MAX_MANA = 10;
export const MAX_BOARD = 5;
export const MAX_HAND = 10;

let nextUid = 1;

export function newGame(rng) {
  const state = {
    phase: 'title', // title | playing | won | lost
    turn: 1,
    active: 'me', // whose turn it is: 'me' | 'foe'
    rng,
    log: [],
    stats: { turns: 0, cardsPlayed: 0, damageDealt: 0, creaturesSummoned: 0 },
    me: newHero('me'),
    foe: newHero('foe'),
  };
  return state;
}

function newHero(who) {
  return {
    who,
    life: MAX_LIFE,
    mana: 0,
    manaMax: 0,
    deck: [],
    hand: [],
    board: [], // creature instances {uid, cardId, attack, health, ready}
    fatigue: 0,
  };
}

export function startMatch(state) {
  state.phase = 'playing';
  state.me.deck = shuffle(buildDeck(), state.rng);
  state.foe.deck = shuffle(buildDeck(), state.rng);
  for (let i = 0; i < 3; i++) { drawCard(state, state.me); drawCard(state, state.foe); }
  beginTurn(state, state.me);
  pushLog(state, 'sys', 'The duel begins. Ember Mage, your move.');
}

export function shuffle(deck, rng) {
  const d = deck.slice();
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

export function drawCard(state, hero) {
  if (hero.deck.length === 0) {
    hero.fatigue += 1;
    hero.life -= hero.fatigue;
    pushLog(state, 'sys', `${heroName(hero)} runs out of cards and takes ${hero.fatigue} fatigue damage.`);
    checkEnd(state);
    return null;
  }
  const id = hero.deck.pop();
  if (hero.hand.length >= MAX_HAND) {
    pushLog(state, 'sys', `${heroName(hero)} draws ${cardById(id).name} but the hand is full — it burns away.`);
    return null;
  }
  hero.hand.push({ uid: nextUid++, cardId: id });
  return id;
}

export function beginTurn(state, hero) {
  state.active = hero.who;
  hero.manaMax = Math.min(MAX_MANA, hero.manaMax + 1);
  hero.mana = hero.manaMax;
  if (state.turn > 1 || hero.who === 'foe') drawCard(state, hero);
  for (const c of hero.board) c.ready = true;
  if (hero.who === 'me') state.stats.turns = state.turn;
  pushLog(state, 'sys', `Turn ${state.turn} — ${heroName(hero)} gains a mana crystal (${hero.manaMax}/${MAX_MANA}).`);
}

export function heroName(hero) {
  return hero.who === 'me' ? 'Ember Mage' : 'Rune Warden';
}

export function canPlay(state, hero, handCard) {
  if (state.phase !== 'playing' || state.active !== hero.who) return false;
  const card = cardById(handCard.cardId);
  if (hero.mana < card.cost) return false;
  if (card.kind === 'creature' && hero.board.length >= MAX_BOARD) return false;
  return true;
}

// Play a card from a hero's hand. Returns true when played.
export function playCard(state, hero, uid) {
  const idx = hero.hand.findIndex((h) => h.uid === uid);
  if (idx === -1) return false;
  const handCard = hero.hand[idx];
  if (!canPlay(state, hero, handCard)) return false;
  const card = cardById(handCard.cardId);
  hero.hand.splice(idx, 1);
  hero.mana -= card.cost;
  state.stats.cardsPlayed += 1;
  const foe = otherHero(state, hero);
  if (card.kind === 'creature') {
    hero.board.push({ uid: nextUid++, cardId: card.id, attack: card.attack, health: card.health, ready: false, justPlayed: true });
    state.stats.creaturesSummoned += 1;
    pushLog(state, hero.who, `${heroName(hero)} summons ${card.name} (${card.attack}/${card.health}).`);
  } else {
    resolveSpell(state, hero, foe, card);
  }
  checkEnd(state);
  return true;
}

function resolveSpell(state, hero, foe, card) {
  const fx = card.effect;
  if (fx.type === 'hero-damage') {
    foe.life -= fx.amount;
    if (hero.who === 'me') state.stats.damageDealt += fx.amount;
    pushLog(state, hero.who, `${card.name} strikes ${heroName(foe)} for ${fx.amount} damage.`);
  } else if (fx.type === 'heal') {
    const healed = Math.min(fx.amount, MAX_LIFE - hero.life);
    hero.life += healed;
    pushLog(state, hero.who, `${card.name} restores ${healed} life to ${heroName(hero)}.`);
  } else if (fx.type === 'draw') {
    for (let i = 0; i < fx.amount; i++) drawCard(state, hero);
    pushLog(state, hero.who, `${card.name} draws ${fx.amount} cards.`);
  } else if (fx.type === 'mana') {
    hero.mana += fx.amount;
    pushLog(state, hero.who, `${card.name} blooms: +${fx.amount} mana this turn.`);
  } else if (fx.type === 'board-damage') {
    for (const c of foe.board.slice()) damageCreature(state, foe, c, fx.amount);
    pushLog(state, hero.who, `${card.name} shakes the board for ${fx.amount} damage.`);
  }
  pruneBoard(state, foe);
  checkEnd(state);
}

// End-of-turn combat: each ready creature attacks across, else the enemy hero.
// Returns a list of strikes for the renderer to animate: {attackerUid, targetUid|null, damage}.
export function combatPhase(state, hero) {
  const foe = otherHero(state, hero);
  const strikes = [];
  for (const creature of hero.board.slice()) {
    if (!creature.ready) continue;
    creature.ready = false;
    const slot = hero.board.indexOf(creature);
    const target = foe.board[slot] ?? null;
    const card = cardById(creature.cardId);
    if (target) {
      strikes.push({ attackerUid: creature.uid, targetUid: target.uid, damage: creature.attack, targetHero: false });
      pushLog(state, hero.who, `${card.name} hits ${cardById(target.cardId).name} for ${creature.attack}.`);
      damageCreature(state, foe, target, creature.attack);
    } else {
      strikes.push({ attackerUid: creature.uid, targetUid: null, damage: creature.attack, targetHero: true });
      foe.life -= creature.attack;
      if (hero.who === 'me') state.stats.damageDealt += creature.attack;
      pushLog(state, hero.who, `${card.name} strikes ${heroName(foe)} for ${creature.attack}.`);
    }
    pruneBoard(state, foe);
    if (checkEnd(state)) break;
  }
  return strikes;
}

function damageCreature(state, hero, creature, amount) {
  creature.health -= amount;
  creature.hurt = true;
}

function pruneBoard(state, hero) {
  for (const c of hero.board.slice()) {
    if (c.health <= 0) {
      hero.board.splice(hero.board.indexOf(c), 1);
      pushLog(state, 'sys', `${cardById(c.cardId).name} crumbles to dust.`);
    }
  }
}

export function otherHero(state, hero) {
  return hero.who === 'me' ? state.foe : state.me;
}

export function endTurn(state) {
  if (state.phase !== 'playing' || state.active !== 'me') return false;
  combatPhase(state, state.me);
  if (state.phase !== 'playing') return true;
  state.turn += 1;
  beginTurn(state, state.foe);
  return true;
}

export function checkEnd(state) {
  if (state.phase !== 'playing') return state.phase !== 'playing';
  if (state.foe.life <= 0 && state.me.life <= 0) {
    state.phase = state.me.life >= state.foe.life ? 'won' : 'lost';
  } else if (state.foe.life <= 0) {
    state.phase = 'won';
  } else if (state.me.life <= 0) {
    state.phase = 'lost';
  }
  if (state.phase === 'won') pushLog(state, 'sys', 'Victory! The Rune Warden yields the table.');
  if (state.phase === 'lost') pushLog(state, 'sys', 'Defeat. The Warden’s runes hold the table.');
  return state.phase !== 'playing';
}

export function pushLog(state, who, text) {
  state.log.push({ who, text });
  if (state.log.length > 60) state.log.splice(0, state.log.length - 60);
}
