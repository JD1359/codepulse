/**
 * middleware/authMiddleware.js
 * JWT verification for REST routes and Socket.io connections.
 */

const jwt = require("jsonwebtoken");

// ── REST Middleware ───────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    res.status(401).json({ error: msg });
  }
}

// ── Socket.io Middleware ──────────────────────────────────────────────────────
// Reads token from socket.handshake.auth.token
function verifySocketToken(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Authentication token required"));

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
}

module.exports = { authMiddleware, verifySocketToken };
