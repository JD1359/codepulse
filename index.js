/**
 * index.js — CodePulse Server Entry Point
 * Express + Socket.io + Redis Pub/Sub
 */

require("dotenv").config();
const express     = require("express");
const http        = require("http");
const { Server }  = require("socket.io");
const mongoose    = require("mongoose");
const cors        = require("cors");
const helmet      = require("helmet");
const rateLimit   = require("express-rate-limit");

const authRoutes    = require("./routes/auth");
const sessionRoutes = require("./routes/sessions");
const executeRoutes = require("./routes/execute");
const roomManager   = require("./services/roomManager");
const { verifySocketToken } = require("./middleware/authMiddleware");

const app    = express();
const server = http.createServer(app);
const PORT   = process.env.PORT || 5000;

// ── Socket.io Setup ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "50kb" }));

// Rate limit: 60 requests per minute per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: "Too many requests, slow down." },
}));

// ── REST Routes ───────────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/execute",  executeRoutes);

app.get("/api/ping", (req, res) => res.json({
  status: "ok",
  uptime: Math.floor(process.uptime()),
  service: "codepulse-server",
}));

// ── Socket.io Auth Middleware ─────────────────────────────────────────────────
io.use(verifySocketToken);

// ── Socket.io Connection Handler ──────────────────────────────────────────────
io.on("connection", (socket) => {
  const user = socket.user;
  console.log(`🔌 Connected: ${user.username} (${socket.id})`);

  // ── Join a coding room ──────────────────────────────────────────────────────
  socket.on("room:join", async ({ roomId }) => {
    socket.join(roomId);
    await roomManager.addUserToRoom(roomId, { id: user.id, username: user.username, socketId: socket.id });

    const state = await roomManager.getRoomState(roomId);
    socket.emit("room:state", state);                   // Send current code to joiner

    socket.to(roomId).emit("room:user_joined", {        // Tell others
      userId: user.id,
      username: user.username,
    });

    const users = await roomManager.getRoomUsers(roomId);
    io.to(roomId).emit("room:users", users);            // Broadcast updated user list
    console.log(`📎 ${user.username} joined room ${roomId}`);
  });

  // ── Code change (collaborative editing) ────────────────────────────────────
  socket.on("code:change", async ({ roomId, code, cursorPos }) => {
    // Publish to Redis so all server instances receive it (horizontal scaling)
    await roomManager.updateRoomCode(roomId, code);

    // Broadcast to everyone else in the room
    socket.to(roomId).emit("code:update", {
      code,
      cursorPos,
      userId: user.id,
      username: user.username,
    });
  });

  // ── Language change ─────────────────────────────────────────────────────────
  socket.on("language:change", async ({ roomId, language }) => {
    await roomManager.updateRoomLanguage(roomId, language);
    io.to(roomId).emit("language:update", { language, changedBy: user.username });
  });

  // ── Execution result broadcast ──────────────────────────────────────────────
  socket.on("execution:result", ({ roomId, result }) => {
    io.to(roomId).emit("execution:output", {
      ...result,
      executedBy: user.username,
      timestamp: new Date().toISOString(),
    });
  });

  // ── Cursor position sharing ─────────────────────────────────────────────────
  socket.on("cursor:move", ({ roomId, line, column }) => {
    socket.to(roomId).emit("cursor:update", {
      userId: user.id,
      username: user.username,
      line,
      column,
    });
  });

  // ── Leave room ──────────────────────────────────────────────────────────────
  socket.on("room:leave", async ({ roomId }) => {
    await handleLeave(socket, roomId, user, io);
  });

  // ── Disconnect ──────────────────────────────────────────────────────────────
  socket.on("disconnect", async () => {
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    for (const roomId of rooms) {
      await handleLeave(socket, roomId, user, io);
    }
    console.log(`❌ Disconnected: ${user.username}`);
  });
});

async function handleLeave(socket, roomId, user, io) {
  socket.leave(roomId);
  await roomManager.removeUserFromRoom(roomId, socket.id);
  socket.to(roomId).emit("room:user_left", { userId: user.id, username: user.username });
  const users = await roomManager.getRoomUsers(roomId);
  io.to(roomId).emit("room:users", users);
}

// ── Database ──────────────────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => { console.error("❌ MongoDB:", err.message); process.exit(1); });

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔴", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 CodePulse server running on port ${PORT}`);
  console.log(`   WebSocket ready · REST API ready`);
});

module.exports = { app, server, io };
