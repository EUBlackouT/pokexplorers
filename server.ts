
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

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

  app.use(express.json({ limit: '50mb' }));

  // Socket.io logic
  const rooms = new Map<string, Set<string>>(); // Room ID -> Set of socket IDs
  const playerStates = new Map<string, any>(); // Socket ID -> Player State

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_room", (roomId) => {
      socket.join(roomId);
      let isHost = false;
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
        isHost = true;
      }
      rooms.get(roomId)!.add(socket.id);
      console.log(`Socket ${socket.id} joined room ${roomId} as host: ${isHost}`);
      
      socket.emit("room_joined", { isHost });
      
      // Notify others in the room
      socket.to(roomId).emit("player_joined", { id: socket.id });
    });

    socket.on("update_state", (data) => {
      const { roomId, state } = data;
      playerStates.set(socket.id, state);
      socket.to(roomId).emit("remote_player_update", { id: socket.id, state });
    });

    socket.on("battle_request", (data) => {
      const { roomId, targetId, playerInfo } = data;
      io.to(targetId).emit("battle_challenged", { challengerId: socket.id, playerInfo });
    });

    socket.on("battle_accept", (data) => {
      const { roomId, challengerId, acceptorInfo } = data;
      // Start a shared battle session
      const battleId = `battle_${Date.now()}`;
      io.to(challengerId).emit("battle_started", { battleId, opponentId: socket.id, opponentInfo: acceptorInfo, isLead: true });
      io.to(socket.id).emit("battle_started", { battleId, opponentId: challengerId, opponentInfo: data.challengerInfo, isLead: false });
    });

    socket.on("battle_action", (data) => {
      const { roomId, battleId, targetId, action } = data;
      io.to(targetId).emit("remote_battle_action", { action });
    });

    socket.on("game_sync", (data) => {
      const { roomId, state } = data;
      socket.to(roomId).emit("game_sync", state);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      playerStates.delete(socket.id);
      // Remove from rooms
      rooms.forEach((members, roomId) => {
        if (members.has(socket.id)) {
          members.delete(socket.id);
          io.to(roomId).emit("player_left", { id: socket.id });
        }
      });
    });
  });

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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
