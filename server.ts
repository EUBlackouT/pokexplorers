import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // --- SOCKET.IO LOGIC ---
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

  // --- AUDIO PROXY ENDPOINT ---
  // This bypasses CORS because the server (Node) fetches the file, not the browser.
  app.get("/api/audio-proxy", async (req, res) => {
    const audioUrl = req.query.url as string;
    if (!audioUrl) {
      return res.status(400).send("No URL provided");
    }

    try {
      console.log(`[Proxy] Fetching: ${audioUrl}`);
      const response = await fetch(audioUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://play.pokemonshowdown.com/'
        }
      });

      if (!response.ok) {
        console.warn(`[Proxy] Upstream 404/Error for: ${audioUrl}`);
        return res.status(response.status).send(`Upstream returned ${response.status}`);
      }

      // Set appropriate headers for streaming
      const contentType = response.headers.get("content-type") || "audio/mpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=3600");

      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
      
    } catch (error) {
      console.error(`[Proxy] Error for ${audioUrl}:`, error);
      res.status(500).send(`Proxy Error: ${(error as Error).message}`);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Audio Proxy ready at /api/audio-proxy?url=...`);
    console.log(`[Server] Socket.io enabled.`);
  });
}

startServer();
