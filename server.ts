import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import { verifyFirebaseIdToken, AuthVerificationError } from "./server/authVerify";
import * as LB from "./server/leaderboardService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] }
  });

  // --- SOCKET.IO (currently unused by client, but kept for future low-latency sync) ---
  io.on("connection", (socket) => {
    console.log(`[Socket] User connected: ${socket.id}`);
    socket.on("join-room", (roomId) => {
      socket.join(roomId);
      console.log(`[Socket] User ${socket.id} joined room: ${roomId}`);
    });
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${socket.id}`);
    });
  });

  // --- MEDIA PROXY ---
  // Server-side fetch bypasses browser CORS + Referer blocks from Showdown / PokeAPI.
  // Used for audio (move SFX, cries, BGM) and battle backgrounds.
  const mediaProxy: express.RequestHandler = async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      res.status(400).send("No URL provided");
      return;
    }

    // Basic allow-list to prevent SSRF. Extend as needed.
    const ALLOWED_HOSTS = [
      "raw.githubusercontent.com",
      "cdn.jsdelivr.net",
      "play.pokemonshowdown.com",
      "cdn.pixabay.com",
      "www.soundjay.com",
    ];
    try {
      const u = new URL(targetUrl);
      if (!ALLOWED_HOSTS.some((h) => u.hostname === h || u.hostname.endsWith("." + h))) {
        res.status(400).send(`Host not allowed: ${u.hostname}`);
        return;
      }
    } catch {
      res.status(400).send("Invalid URL");
      return;
    }

    try {
      console.log(`[Proxy] Fetching: ${targetUrl}`);
      // Only impersonate a Showdown referer when actually fetching Showdown assets.
      // Other hosts (pixabay, pokeapi) 403 when they see a mismatched referer.
      const headers: Record<string, string> = {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      };
      if (targetUrl.includes("pokemonshowdown.com") || targetUrl.includes("smogon/pokemon-showdown")) {
        headers["Referer"] = "https://play.pokemonshowdown.com/";
      }
      const response = await fetch(targetUrl, {
        redirect: "follow",
        headers,
      });

      if (!response.ok) {
        console.warn(`[Proxy] Upstream ${response.status} for: ${targetUrl}`);
        res.status(response.status).send(`Upstream returned ${response.status}`);
        return;
      }

      const contentType = response.headers.get("content-type") || "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    } catch (error) {
      console.error(`[Proxy] Error for ${targetUrl}:`, error);
      res.status(500).send(`Proxy Error: ${(error as Error).message}`);
    }
  };

  app.get("/api/audio-proxy", mediaProxy);
  app.get("/api/media-proxy", mediaProxy);

  // --- LEADERBOARD (tamper-proof) ---
  //
  // Clients never submit a pre-computed score; they submit a raw ScoreInputs
  // snapshot and we re-run the weighted formula server-side. Every request is
  // authenticated with a Firebase ID token (verified via Google JWKS) and the
  // board is keyed on the verified UID so impersonation is impossible. See
  // server/leaderboardService.ts for the clamps + plausibility gate + journal.
  await LB.loadLeaderboard();

  app.use(express.json({ limit: "16kb" }));

  type AuthedRequest = express.Request & { auth?: { uid: string; isAnonymous: boolean } };

  const requireAuth: express.RequestHandler = async (req, res, next) => {
    const header = req.header("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      res.status(401).json({ error: "missing-token" });
      return;
    }
    try {
      const verified = await verifyFirebaseIdToken(token);
      (req as AuthedRequest).auth = { uid: verified.uid, isAnonymous: verified.isAnonymous };
      next();
    } catch (err) {
      const reason = err instanceof AuthVerificationError ? err.reason : "unknown";
      res.status(401).json({ error: "unauthorized", reason });
    }
  };

  app.post("/api/leaderboard/session/start", requireAuth, (req, res) => {
    const { uid } = (req as AuthedRequest).auth!;
    const session = LB.startSession(uid);
    res.json(session);
  });

  app.post("/api/leaderboard/submit", requireAuth, async (req, res) => {
    const { uid, isAnonymous } = (req as AuthedRequest).auth!;
    const body = (req.body ?? {}) as {
      sessionId?: string;
      name?: string;
      inputs?: Record<string, unknown>;
    };
    if (typeof body.sessionId !== "string" || !body.inputs || typeof body.inputs !== "object") {
      res.status(400).json({ error: "invalid-payload" });
      return;
    }
    const result = await LB.submit({
      uid,
      name: String(body.name || "Anon"),
      sessionId: body.sessionId,
      isAnonymous,
      inputs: body.inputs as Partial<Parameters<typeof LB.submit>[0]["inputs"]>,
    });
    if (result.ok === false) {
      res.status(409).json({ error: result.reason });
      return;
    }
    res.json({ entry: result.entry, isNewBest: result.isNewBest });
  });

  app.get("/api/leaderboard/top", (req, res) => {
    const limit = parseInt((req.query.limit as string) || "50", 10);
    const windowParam = (req.query.window as string) === "weekly" ? "weekly" : "all";
    res.json({ entries: LB.top(limit, windowParam), window: windowParam });
  });

  app.get("/api/leaderboard/stats", (_req, res) => {
    res.json(LB.stats());
  });

  // --- Healthcheck (for Render/Fly/Railway) ---
  app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

  // --- Vite (dev) or static (prod) ---
  if (!IS_PROD) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Express 5 changed path-to-regexp syntax. `*` is no longer a valid route;
    // we use middleware here instead for the SPA catch-all.
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}  (${IS_PROD ? "production" : "development"})`);
    console.log(`[Server] Media Proxy ready at /api/media-proxy?url=...`);
    console.log(`[Server] Socket.io enabled.`);
  });
}

startServer();
