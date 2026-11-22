// Ember Duel — DOM rendering. Rebuilds #app from the state on every change;
// CSS handles the look, this file only decides what shows where.
import { ELEMENTS, cardById } from './cards.js';
import { MAX_LIFE, canPlay, heroName } from './engine.js';
import { isMuted } from './sound.js';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function cardHtml(handCard, opts = {}) {
  const card = cardById(handCard.cardId);
  const el = ELEMENTS[card.element];
  const cls = ['card', `el-${card.element}`, card.kind];
  if (opts.selected) cls.push('selected');
  if (opts.unaffordable) cls.push('unaffordable');
  if (opts.justPlayed) cls.push('just-played');
  if (opts.attacking) cls.push('attacking');
  if (opts.hurt) cls.push('hurt');
  const stats = card.kind === 'creature'
    ? `<div class="stats"><span class="atk" title="Attack">${card.attack}</span><span class="hp" title="Health">${handCard.health ?? card.health}</span></div>`
    : '';
  return `<div class="${cls.join(' ')}" ${opts.action || ''}>
    <span class="cost" title="Mana cost">${card.cost}</span>
    <div class="cname">${esc(card.name)}</div>
    <div class="art" aria-hidden="true">${el.glyph}<span class="elem-tag">${el.tag}</span></div>
    <div class="ctext">${esc(card.text)}</div>
    ${stats}
  </div>`;
}

function heroRow(hero, opts) {
  const lifePct = Math.max(0, (hero.life / MAX_LIFE) * 100);
  const pips = Array.from({ length: 10 }, (_, i) =>
    `<span class="pip${i < hero.mana ? ' full' : ''}"></span>`).join('');
  return `<div class="hero-row ${opts.side}">
    <div class="portrait ${opts.side === 'opp' ? 'opp' : ''}">${opts.glyph}</div>
    <div>
      <div class="hero-name">${esc(opts.name)}</div>
      <div class="hero-sub">${esc(opts.sub)}</div>
    </div>
    <div class="life-wrap">
      <div class="life-label">LIFE</div>
      <div class="life-num">${Math.max(0, hero.life)}<span class="max"> / ${MAX_LIFE}</span></div>
      <div class="life-bar"><div class="life-fill ${opts.side === 'opp' ? 'opp-fill' : ''}" style="width:${lifePct}%"></div></div>
      <div class="mana-pips">${pips}</div>
    </div>
  </div>`;
}

function boardRow(hero, side, ui) {
  const cards = hero.board.map((c) => {
    const opts = {};
    if (ui.lastPlayedUid === c.uid) opts.justPlayed = true;
    if (ui.attackingUids && ui.attackingUids.has(c.uid)) opts.attacking = true;
    if (c.hurt) opts.hurt = true;
    return cardHtml(c, opts);
  }).join('');
  const empty = hero.board.length === 0
    ? `<div class="empty-note">${side === 'opp' ? 'The Warden has no creatures on the table.' : 'No creatures yet — play a creature card.'}</div>`
    : '';
  return `<div class="board-label">${side === 'opp' ? 'RUNE WARDEN’S CREATURES' : 'YOUR CREATURES — they strike at the end of your turn'}</div>
    <div class="board-row ${side === 'opp' ? 'opp-board' : ''}">${cards}${empty}</div>`;
}

export function renderTitle() {
  return `<div class="screen title-screen">
    <h1>🔥 EMBER DUEL 🔥</h1>
    <h2>A duel of cards, mana and nerve — you against the Rune Warden</h2>
    <div class="title-cards">
      ${cardHtml({ uid: 0, cardId: 'ember-drake' })}
      ${cardHtml({ uid: 0, cardId: 'tide-serpent' })}
      ${cardHtml({ uid: 0, cardId: 'meteor-fall' })}
    </div>
    <button class="btn" data-action="play">▶ &nbsp;PLAY THE DUEL</button>
    <div class="rules-box">
      <b>How to play:</b> You and the Warden start at <b>30 life</b>. Each turn you draw a
      card and gain a mana crystal (up to 10). Click a card in your hand to play it —
      creatures take the board, spells strike at once. Creatures cannot attack the turn
      they are summoned, but at the end of your turn each ready creature strikes the
      enemy creature across from it, or the Warden himself. Reduce the Warden to
      <b>0 life</b> to win. Keys: <b>1–7</b> play a card, <b>Enter</b> ends the turn, <b>R</b> restarts.
    </div>
    <div class="credit">An original game — its own cards, art and sounds. No network, no account, just the duel.</div>
  </div>`;
}

export function renderEnd(state) {
  const won = state.phase === 'won';
  const s = state.stats;
  return `<div class="screen end-screen ${won ? '' : 'lose'}">
    <h1>${won ? '🏆 VICTORY!' : '💀 DEFEAT'}</h1>
    <p>${won ? 'The Rune Warden bows. The table is yours, Ember Mage.' : 'The Warden’s runes hold the table. The embers fade… for now.'}</p>
    <div class="end-stats">
      <div class="stat-box"><div class="num">${s.turns}</div><div class="lbl">TURNS</div></div>
      <div class="stat-box"><div class="num">${s.cardsPlayed}</div><div class="lbl">CARDS PLAYED</div></div>
      <div class="stat-box"><div class="num">${s.damageDealt}</div><div class="lbl">DAMAGE DEALT</div></div>
      <div class="stat-box"><div class="num">${s.creaturesSummoned}</div><div class="lbl">CREATURES</div></div>
    </div>
    <div class="end-btns">
      <button class="btn" data-action="again">↻ &nbsp;DUEL AGAIN</button>
      <button class="btn ghost" data-action="title">TITLE SCREEN</button>
    </div>
  </div>`;
}

export function renderTable(state, ui) {
  const myTurn = state.active === 'me' && state.phase === 'playing';
  const hand = state.me.hand.map((h, i) => {
    const affordable = canPlay(state, state.me, h);
    return cardHtml(h, {
      selected: ui.selectedUid === h.uid,
      unaffordable: !affordable,
      action: `data-action="card" data-uid="${h.uid}" data-index="${i + 1}"`,
    });
  }).join('');
  const oppBacks = state.foe.hand.map(() => '<div class="card-back"></div>').join('');
  const log = state.log.slice(-14).map((e) =>
    `<div class="${e.who === 'me' ? 'me' : e.who === 'foe' ? 'foe' : 'sys'}">${esc(e.text)}</div>`).join('');
  const banner = state.phase === 'playing'
    ? (myTurn ? 'Your turn — play cards, then end the turn.' : 'The Rune Warden is thinking…')
    : '';
  return `<div class="table">
    <div class="main-col">
      ${heroRow(state.foe, { side: 'opp', glyph: '🧙', name: 'RUNE WARDEN', sub: 'Keeper of the old stones' })}
      <div class="opp-hand">${oppBacks}<span class="deck-count">${state.foe.hand.length} cards in hand</span></div>
      <div class="board">
        ${boardRow(state.foe, 'opp', ui)}
        <div class="vs-line"><span class="vs-badge">⚔ &nbsp;DUEL&nbsp; ⚔</span><span class="turn-banner">${esc(banner)}</span></div>
        ${boardRow(state.me, 'me', ui)}
      </div>
      <div class="hand-zone">
        ${heroRow(state.me, { side: 'me', glyph: '🔥', name: 'EMBER MAGE — YOU', sub: 'The flame answers to you' })}
        <div class="hand-label"><span>YOUR HAND — click a card to play it</span><span class="hint">keys 1–7 play · Enter ends turn</span></div>
        <div class="hand">${hand || '<div class="empty-note">Your hand is empty.</div>'}</div>
      </div>
    </div>
    <div class="side-col">
      <div class="turn-box">
        <div class="turn-big">TURN ${state.turn}</div>
        <div class="turn-sub">${myTurn ? 'Your move, Ember Mage.' : 'The Warden plots his next card.'}</div>
      </div>
      <button class="btn end-turn" data-action="end-turn" ${myTurn ? '' : 'disabled style="opacity:.45;cursor:default"'}>END TURN ⏎</button>
      <div class="mana-box">
        <b>Your mana:</b> ◆ ${state.me.mana} / ${state.me.manaMax}<br>
        <b>Warden’s mana:</b> ◆ ${state.foe.mana} / ${state.foe.manaMax}<br>
        <b>Decks:</b> you ${state.me.deck.length} · foe ${state.foe.deck.length}
      </div>
      <div class="log-box">
        <h3>DUEL LOG</h3>
        <div class="log-list">${log}</div>
      </div>
      <div class="side-foot">
        <button class="btn ghost small" data-action="mute">${isMuted() ? '🔇 UNMUTE' : '🔊 MUTE'}</button>
        <button class="btn ghost small" data-action="restart">↻ RESTART</button>
      </div>
    </div>
  </div>`;
}

export function render(state, ui) {
  const app = document.getElementById('app');
  const status = document.getElementById('status');
  if (state.phase === 'title') {
    app.innerHTML = renderTitle();
    status.textContent = 'Ember Duel title screen. Press Play to start the duel.';
  } else if (state.phase === 'won' || state.phase === 'lost') {
    app.innerHTML = renderEnd(state);
    status.textContent = state.phase === 'won'
      ? `Victory! You beat the Rune Warden in ${state.stats.turns} turns.`
      : `Defeat. The Rune Warden won in ${state.stats.turns} turns.`;
  } else {
    app.innerHTML = renderTable(state, ui);
    status.textContent = `Turn ${state.turn}. Your life ${state.me.life}, Warden life ${state.foe.life}, mana ${state.me.mana}.`;
  }
}
