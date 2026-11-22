// Ember Duel — the card pool. Original cards, four elements: Ember, Tide, Grove, Stone.
// A creature has attack/health and fights on the board; a spell resolves at once.
// Every card id is unique; `copies` says how many go into a 24-card deck.
export const ELEMENTS = {
  ember: { name: 'Ember', glyph: '🔥', tag: 'EMBER' },
  tide: { name: 'Tide', glyph: '💧', tag: 'TIDE' },
  grove: { name: 'Grove', glyph: '🌿', tag: 'GROVE' },
  stone: { name: 'Stone', glyph: '🪨', tag: 'STONE' },
};

export const CARD_POOL = [
  // -- creatures --
  { id: 'ember-imp', kind: 'creature', element: 'ember', name: 'Ember Imp', cost: 1, attack: 2, health: 1, text: 'Quick, hot, and reckless.', copies: 3 },
  { id: 'stone-pebble', kind: 'creature', element: 'stone', name: 'Pebble Guard', cost: 1, attack: 1, health: 3, text: 'Small. Stubborn. In the way.', copies: 2 },
  { id: 'tide-sprite', kind: 'creature', element: 'tide', name: 'Tide Sprite', cost: 2, attack: 2, health: 2, text: 'Rides the current into battle.', copies: 3 },
  { id: 'stone-golem', kind: 'creature', element: 'stone', name: 'Stone Golem', cost: 2, attack: 1, health: 4, text: 'It has never once hurried.', copies: 2 },
  { id: 'grove-wolf', kind: 'creature', element: 'grove', name: 'Grove Wolf', cost: 3, attack: 3, health: 3, text: 'Hunts in the hush between trees.', copies: 3 },
  { id: 'ember-drake', kind: 'creature', element: 'ember', name: 'Ember Drake', cost: 4, attack: 4, health: 4, text: 'Its shadow smells of smoke.', copies: 2 },
  { id: 'tide-serpent', kind: 'creature', element: 'tide', name: 'Tide Serpent', cost: 5, attack: 5, health: 5, text: 'The river, with teeth.', copies: 2 },
  { id: 'stone-colossus', kind: 'creature', element: 'stone', name: 'Stone Colossus', cost: 6, attack: 6, health: 7, text: 'A mountain that learned to walk.', copies: 1 },
  { id: 'grove-ancient', kind: 'creature', element: 'grove', name: 'Grove Ancient', cost: 7, attack: 7, health: 7, text: 'Older than the duel itself.', copies: 1 },
  { id: 'phoenix', kind: 'creature', element: 'ember', name: 'Ash Phoenix', cost: 8, attack: 8, health: 6, text: 'Burns brightest at the end.', copies: 1 },
  // -- spells --
  { id: 'spark-bolt', kind: 'spell', element: 'ember', name: 'Spark Bolt', cost: 1, text: 'Deal 2 damage to the enemy hero.', copies: 2, effect: { type: 'hero-damage', amount: 2 } },
  { id: 'mana-bloom', kind: 'spell', element: 'grove', name: 'Mana Bloom', cost: 0, text: 'Gain 2 mana crystals this turn.', copies: 2, effect: { type: 'mana', amount: 2 } },
  { id: 'healing-rain', kind: 'spell', element: 'tide', name: 'Healing Rain', cost: 2, text: 'Restore 5 life to your hero.', copies: 2, effect: { type: 'heal', amount: 5 } },
  { id: 'whispering-winds', kind: 'spell', element: 'grove', name: 'Whispering Winds', cost: 2, text: 'Draw 2 cards.', copies: 2, effect: { type: 'draw', amount: 2 } },
  { id: 'quake', kind: 'spell', element: 'stone', name: 'Quake', cost: 4, text: 'Deal 3 damage to all enemy creatures.', copies: 1, effect: { type: 'board-damage', amount: 3 } },
  { id: 'meteor-fall', kind: 'spell', element: 'ember', name: 'Meteor Fall', cost: 5, text: 'Deal 4 damage to the enemy hero.', copies: 1, effect: { type: 'hero-damage', amount: 4 } },
];

export function buildDeck() {
  const deck = [];
  for (const card of CARD_POOL) {
    for (let i = 0; i < card.copies; i++) deck.push(card.id);
  }
  return deck; // 24 cards
}

export function cardById(id) {
  return CARD_POOL.find((c) => c.id === id);
}
