/**
 * services/roomManager.js — Redis-Backed Room State Manager
 *
 * Manages collaborative coding room state using Redis.
 * Each room stores: current code, language, and list of active users.
 * Redis enables horizontal scaling — multiple server instances
 * can share room state seamlessly.
 */

const { createClient } = require("redis");

const REDIS_URL  = process.env.REDIS_URL || "redis://localhost:6379";
const ROOM_TTL   = 60 * 60 * 24;  // 24 hours — rooms expire if inactive

let client = null;
let isConnected = false;

// In-memory fallback when Redis is unavailable (single-instance only)
const memoryStore = new Map();

async function getClient() {
  if (isConnected && client) return client;

  try {
    client = createClient({ url: REDIS_URL });
    client.on("error", (err) => {
      console.warn("⚠️  Redis error (falling back to memory):", err.message);
      isConnected = false;
    });
    await client.connect();
    isConnected = true;
    console.log("✅ Redis connected");
    return client;
  } catch (err) {
    console.warn("⚠️  Redis unavailable — using in-memory store (single instance only)");
    isConnected = false;
    return null;
  }
}

// ── Key helpers ───────────────────────────────────────────────────────────────
const keys = {
  code:     (roomId) => `room:${roomId}:code`,
  language: (roomId) => `room:${roomId}:language`,
  users:    (roomId) => `room:${roomId}:users`,
};

// ── Unified get/set with fallback ──────────────────────────────────────────────
async function redisGet(key) {
  const c = await getClient();
  if (c) return c.get(key);
  return memoryStore.get(key) || null;
}

async function redisSet(key, value, ttl = ROOM_TTL) {
  const c = await getClient();
  if (c) return c.set(key, value, { EX: ttl });
  memoryStore.set(key, value);
}

async function redisDel(key) {
  const c = await getClient();
  if (c) return c.del(key);
  memoryStore.delete(key);
}

// ── Room State ────────────────────────────────────────────────────────────────

async function getRoomState(roomId) {
  const [code, language, usersJson] = await Promise.all([
    redisGet(keys.code(roomId)),
    redisGet(keys.language(roomId)),
    redisGet(keys.users(roomId)),
  ]);

  return {
    roomId,
    code:     code     || "",
    language: language || "python",
    users:    usersJson ? JSON.parse(usersJson) : [],
  };
}

async function updateRoomCode(roomId, code) {
  await redisSet(keys.code(roomId), code);
}

async function updateRoomLanguage(roomId, language) {
  await redisSet(keys.language(roomId), language);
}

// ── User Management ───────────────────────────────────────────────────────────

async function getRoomUsers(roomId) {
  const json = await redisGet(keys.users(roomId));
  return json ? JSON.parse(json) : [];
}

async function addUserToRoom(roomId, user) {
  const users = await getRoomUsers(roomId);

  // Replace existing socket entry for same user (reconnect)
  const filtered = users.filter(u => u.id !== user.id);
  filtered.push({ ...user, joinedAt: Date.now() });

  await redisSet(keys.users(roomId), JSON.stringify(filtered));
}

async function removeUserFromRoom(roomId, socketId) {
  const users   = await getRoomUsers(roomId);
  const updated = users.filter(u => u.socketId !== socketId);
  await redisSet(keys.users(roomId), JSON.stringify(updated));
  return updated;
}

async function clearRoom(roomId) {
  await Promise.all([
    redisDel(keys.code(roomId)),
    redisDel(keys.language(roomId)),
    redisDel(keys.users(roomId)),
  ]);
}

// ── Init ──────────────────────────────────────────────────────────────────────
// Connect on startup (non-blocking)
getClient().catch(() => {});

module.exports = {
  getRoomState,
  updateRoomCode,
  updateRoomLanguage,
  getRoomUsers,
  addUserToRoom,
  removeUserFromRoom,
  clearRoom,
};
