# Pokémon Explorers

A roguelike Pokémon co-op expedition — explore a dynamically generated world,
battle wild Pokémon, and meet friends in shared rooms for double battles.

Originally prototyped on Google AI Studio; this repo is the portable version.

## Stack

- **Frontend:** React 19, Vite 6, TypeScript, Tailwind v4, Framer Motion
- **Backend:** Node.js + Express 5 (serves Vite middleware in dev,
  static `dist` in prod) + Socket.io (reserved for future low-latency sync)
- **Multiplayer & persistence:** Firebase Auth + Firestore
- **Audio:** Web Audio API with procedural 8-bit BGM and per-type move SFX
  synthesis (no external audio dependencies); PokeAPI cries via server-side
  media proxy
- **AI (optional):** Gemini for infinite-variety battle backgrounds

## Run locally

Prereqs: **Node 20+**, **npm 10+**.

```bash
npm install
npm run dev     # http://localhost:3000
```

That's it — no API keys required. The game ships with a bundled Firebase
config for quick testing. See [HOSTING.md](./HOSTING.md) for how to use your
own.

## Production build

```bash
npm run build   # outputs ./dist
npm start       # NODE_ENV=production, serves ./dist + /api/media-proxy
```

## Playing with friends

See [HOSTING.md](./HOSTING.md) for four hosting recipes (ngrok, Render,
Fly.io, Railway) and how to spin up your own Firebase project.

Quick flow:

1. Player A hits **Online Play** → **Create Room** → reads out the 6-char code.
2. Player B hits **Online Play** → **Join Room** → enters the code.
3. Walk into each other to start a co-op double battle.

## Repository layout

```
App.tsx              — main game loop (currently monolithic, ~440KB; split-up pending)
index.tsx            — React entry
index.html           — HTML shell + global animations
index.css            — Tailwind v4 entry
server.ts            — Express + Vite-middleware + media proxy + socket.io
vite.config.ts       — Vite + Tailwind plugin + env exposure
firebase.ts          — Firebase init (env-driven with JSON fallback)
firebase-applet-config.json — bundled AI Studio Firebase config (fallback)
firestore.rules      — security rules (deploy to your own project)
components/          — HealthBar, Overworld, PokemonSprite, StarterSelect
data/                — abilities, moves, fusions, assignments
services/
  pokeService.ts     — battle math, damage, evolution, PokeAPI fetching
  mapData.ts         — procedural map / chunk / cave / puzzle generation
  itemData.ts        — items & shop definitions
  multiplayer.ts     — Firestore-based room sync & battle sync
  soundService.ts    — Web Audio engine (procedural BGM, type SFX, cries)
  imageService.ts    — battle backgrounds (SVG fallback + Gemini option)
types.ts             — shared TS types
```

## Design rules (see AGENTS.md)

- App name is **Pokémon Explorers**, never "Rift Explorers" or
  "Co-op Battle Monsters".
- Battle backgrounds: anime cel-shaded gradients, **no real-life photos**.
- BGM: 8-bit adventure / orchestral / intense battle only. **No rock music.**
- Title uses classic Pokémon yellow `#ffcb05` with blue `#3c5aa6` stroke.

## Known shortcuts / followups

- `App.tsx` is a single 440KB file. Needs splitting, but the TypeScript
  compiles cleanly and the app builds, so it's not a shipping blocker.
- `socket.io-client` is in deps but currently unused — multiplayer is 100%
  Firestore. Kept for future optimisation of low-latency move animations.
- Battle backgrounds are SVG gradients; upgrading them to PixelLab-generated
  anime PNGs is tracked as a follow-up.
