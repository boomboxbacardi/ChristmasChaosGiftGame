# Christmas Chaos Game

A fast, fair, and delightfully chaotic gift-stealing party game. Built with Vite + React + TypeScript. Dark mode by default, holiday theme optional. The goal: people laugh, not rage-quit.

- Live demo: https://christmas-chaos-gift-exchange.vercel.app/
- No backend needed: it’s 100% client-side—just run and play.

## Why it’s fun (and fair)
- Equal rolls: everyone gets the same number of turns.
- Pure RNG: you can’t out-strategize the table—embrace the chaos.
- Two phases: gentle warmup → full-on mayhem.
- Guardrails: no infinite loops, locked packages are respected, and the log shows every move.

## Quick start
1) Install: `pnpm install`
2) Run dev server: `pnpm run dev`
3) Open the printed localhost URL (no backend to configure).
4) Add players, set total packages, hit “Randomize order & start”.
5) Roll the die and follow the log.

## How to play (short)
- Phase 1 (distribution): 5 rolls per player. Mix of “take from pile”, “give away”, “steal”, “rotate left/right”.
- Phase 2 (chaos): 3 rolls per player. Bigger swings: wipe, mega steal, swap all, extra rolls, lock one, roulette.
- After the last roll: open what you’ve got.

## Controls & UI
- Players & packages: add/remove players, adjust total pile.
- Randomize order: shows the order modal, start the game from there.
- Dice button: clear states (can roll / spinning / finished).
- Log: every action is recorded for transparency.
- Theme & language: holiday toggle + English/Swedish.

## Tech stack
- React + TypeScript + Vite
- State via custom hooks (no global store)
- CSS with theme variables (dark + holiday)

## Dev notes
- No server required; everything runs in the client.
- No sensitive data stored; theme/language use localStorage.
- Outcome tables live in `src/constants/tables.ts`, copy lives in `src/constants/messages.ts`.

## Contributing
- Install: `pnpm install`
- Dev server: `pnpm run dev`
- Lint/format: Biome config (runs on commit if enabled).
- Bugs/ideas: open an issue or PR.
