# Hosting Pokémon Explorers for Multiplayer

Everything you need to put this game online so you and your friends can play
co-op / double-battle together. The game is a single Node process that
serves both the frontend and the `/api/media-proxy` endpoint.

---

## TL;DR — the three paths

| Path | Good for | Effort | Cost |
|---|---|---|---|
| **A. Ngrok tunnel from your PC** | Playing with friends in one session, _today_ | 5 min | Free |
| **B. Render.com** | Always-on, shareable URL, no DevOps | 15 min | Free tier works |
| **C. Fly.io / Railway / VPS** | Full control, low latency, scale later | 30 min | $5/mo |

All three paths use the same production command:

```bash
npm install
npm run build
npm start
```

`npm start` runs `NODE_ENV=production tsx server.ts` which:
- Reads `PORT` from env (defaults to 3000)
- Serves built assets from `./dist`
- Exposes `/api/media-proxy?url=...` for Pokémon cries
- Exposes `/api/audio-proxy` alias (for backward compat with old code)
- Exposes `/healthz` for uptime monitors
- Initialises Socket.io (reserved; current multiplayer uses Firestore only)

---

## Path A — "Play with my friend _right now_" (ngrok)

Best for testing the full loop before committing to a real deploy.

```powershell
# 1. Start the server locally
npm install
npm run build
npm start
# -> [Server] Running on http://localhost:3000

# 2. In a second terminal, open a public tunnel
#    (one-time install: https://ngrok.com/download, free signup)
ngrok http 3000
# -> Forwarding  https://xxxx-yyyy.ngrok-free.app -> http://localhost:3000
```

Send the `https://xxxx-yyyy.ngrok-free.app` URL to your friend.

**Gotcha:** because the repo ships with a bundled AI Studio Firebase config,
both of you sign in with Google via a popup — make sure popups aren't blocked.
The room code you create is a 6-character code; your friend types it in
"Join Room" and you'll be in the same overworld.

---

## Path B — Render.com (recommended for "always on")

1. Push this repo to GitHub.
2. Go to https://render.com -> New -> Web Service -> connect your repo.
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment variables** (optional, see `.env.example`):
     - Leave everything blank for a first deploy using the bundled Firebase
       config. The game will work immediately.
     - Later, set `VITE_FIREBASE_*` to point at your own Firebase project.
   - **Health check path:** `/healthz`
4. Deploy. Render gives you a `https://your-app.onrender.com` URL.

**Render free tier caveat:** the service sleeps after 15 min of inactivity.
First request after sleep takes ~30s to wake up. That's fine for casual play;
upgrade to Starter ($7/mo) for always-on.

---

## Path C — Fly.io (low-latency global edge)

```bash
npm install -g flyctl
fly auth signup
fly launch
# Answer prompts:
#   App name: pokexplorers-yourname
#   Region: pick closest to you and your friends
#   Postgres? No.  Redis? No.  Deploy now? Yes.
```

Fly will read `package.json` and auto-generate a `fly.toml` + `Dockerfile`.
If the auto-generated Dockerfile uses Node 20 (recommended), you're done.

Set env vars if you want your own Firebase:
```bash
fly secrets set VITE_FIREBASE_API_KEY=... VITE_FIREBASE_PROJECT_ID=... # etc.
fly deploy
```

---

## Path D — Railway (similar to Render, maybe the simplest UI)

1. https://railway.app -> New Project -> Deploy from GitHub repo.
2. Railway auto-detects Node. Just confirm:
   - Build: `npm install && npm run build`
   - Start: `npm start`
3. Click **Settings -> Generate Domain**. Share the URL.

---

## Firebase: use the shared config or your own?

This repo ships with `firebase-applet-config.json` pointing at an AI Studio
Firebase project. That means:

- **Pro:** Zero setup. Deploy and play.
- **Con:** It's a shared Google-owned project — it could be deleted or
  rate-limited without warning. Rooms you create live in someone else's DB.
- **Con:** Firebase API keys committed to a repo is _officially OK_ for web
  apps (Firestore rules are what gates access), but it's tidier to have your
  own.

### Switch to your own Firebase (~10 minutes)

1. https://console.firebase.google.com -> Add project.
2. Enable **Authentication -> Sign-in method -> Google** (one-click).
3. **Firestore Database -> Create Database -> Production mode -> pick region.**
4. Copy the web config: Project settings -> Your apps -> Web -> register app.
5. Put the values in a `.env` file at the repo root (or in your host's env
   panel). See `.env.example` for exact variable names.
6. Deploy the security rules from this repo:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules
   ```
7. **Redeploy** the web app. Now rooms live in your Firestore.

### Firebase auth origins

If friends can't sign in on your deployed URL, add it here:

> Firebase Console -> Authentication -> Settings -> Authorized domains ->
> Add your render.com / fly.dev / ngrok-free.app domain.

---

## Gemini (optional — for AI-generated battle backgrounds)

Without a key, the game uses anime-style SVG gradient backgrounds per biome
(included in the build, no network calls). These match AGENTS.md aesthetic
requirements.

If you want AI-generated infinite-variety backgrounds:

1. Get a key: https://aistudio.google.com/app/apikey
2. Set env var `GEMINI_API_KEY=AIza...` on your host.
3. Redeploy.

Note: this is a server-side env var, not `VITE_*`. It's embedded at build
time via `vite.config.ts`'s `define` block, so it won't leak to the client
unless you explicitly expose it.

---

## Troubleshooting

**"My friend can't hear any sounds."**
- Browsers block audio until the user interacts. The game has an "AUDIO ON"
  button on the main menu — make sure they click it.
- If _move_ SFX work but _BGM_ doesn't: check dev-tools console for the BGM
  URL. Pixabay blocked hotlinks as of 2025, so the game now synthesizes
  8-bit BGM procedurally in-browser — it should always work.

**"Multiplayer rooms show 'offline' in the console."**
- Your Firebase project doesn't have Firestore enabled, OR you forgot to
  deploy the rules from `firestore.rules`.
- Or the authorized-domains list doesn't include your deployment URL.

**"Port already in use" when running `npm start` twice locally.**
- `taskkill /F /IM node.exe` (Windows) or `pkill -f tsx` (Linux/Mac).

**"Error 500 on /api/media-proxy?url=..."**
- The proxy only allows a fixed set of upstream hosts (see `server.ts`
  `ALLOWED_HOSTS`). Add your host there if you're serving custom assets.

**Large bundle warning during build.**
- Yes, `App.tsx` is 442 KB. Code-splitting it is the top refactor target but
  not a shipping blocker.
