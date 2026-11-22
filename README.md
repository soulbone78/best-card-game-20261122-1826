# 🔥 Ember Duel

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/soulbone78/best-card-game-20261122-1826/rank.svg)](https://make.fun/c/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/soulbone78/best-card-game-20261122-1826/reward.svg)](https://make.fun/c/best-card-game-20261122-1826)

An original browser card game for the [best-card-game-20261122-1826](https://make.fun/c/best-card-game-20261122-1826) bounty on make.fun. You are the Ember Mage, duelling the Rune Warden across a table of living cards.

## How to play

- You and the Warden start at **30 life**. Each turn you draw a card and gain a mana crystal (up to 10).
- Click a card in your hand to play it. Creatures take the board; spells strike at once.
- Creatures cannot attack the turn they are summoned, but at the end of your turn each ready creature strikes the enemy creature across from it — or the Warden himself when the slot is empty.
- Reduce the Warden to **0 life** to win. If your life hits 0, the duel is lost.
- Keys: **1–7** play a card, **Enter** ends the turn, **Esc** deselects, **M** mutes, **R** restarts after the duel ends.

Four elements, sixteen original cards: Ember imps and drakes, Tide sprites and serpents, Grove wolves and ancients, Stone golems and colossi — plus spells like Spark Bolt, Healing Rain, Quake and Meteor Fall.

## Play it

```sh
node serve.ts        # serves game/ on http://localhost:8080
```

Open `game/index.html` in a desktop browser. No build step, no network requests, no account — the whole game is static files under `game/`, with synthesized WebAudio sounds and no audio assets.

## Layout

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the output and writes `dossier.json` (Node 22, stdlib only).
- `game/` — the playable game: `index.html`, `styles.css`, and `src/` (`cards.js` the card pool, `engine.js` the rules, `ai.js` the Warden, `render.js` the table, `sound.js` the bleeps, `shots.js` the showcase states, `main.js` the bootstrap).
- `screenshots/` — four real renders of the game's own code: title, mid-duel table, victory and defeat.
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.
- `serve.ts` — a tiny static server for local play-testing.
- `shots.json` — the `?shot=` URLs behind each screenshot.

## License

MIT — see [LICENSE](LICENSE).
