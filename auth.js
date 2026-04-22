/**
 * routes/auth.js — Auth Routes
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh
 * GET  /api/auth/me
 */

const express  = require("express");
const bcrypt   = require("bcryptjs");
const jwt      = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const User = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

function signAccess(user) {
  return jwt.sign(
    { id: user._id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );
}

function signRefresh(user) {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" }
  );
}

// ── Register ──────────────────────────────────────────────────────────────────
router.post("/register", [
  body("username").trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage("Username: 3-30 chars, letters/numbers/_ only"),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password min 8 characters"),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { username, email, password } = req.body;

    if (await User.findOne({ $or: [{ email }, { username }] })) {
      return res.status(409).json({ error: "Username or email already taken" });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username, email, passwordHash });

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);
    user.refreshToken  = await bcrypt.hash(refreshToken, 8);
    await user.save();

    res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// ── Login ─────────────────────────────────────────────────────────────────────
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken  = signAccess(user);
    const refreshToken = signRefresh(user);
    user.refreshToken  = await bcrypt.hash(refreshToken, 8);
    await user.save();

    res.json({ accessToken, refreshToken, user });
  } catch {
    res.status(500).json({ error: "Login failed" });
  }
});

// ── Refresh Token ─────────────────────────────────────────────────────────────
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ error: "User not found" });

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) return res.status(403).json({ error: "Invalid refresh token" });

    res.json({ accessToken: signAccess(user) });
  } catch {
    res.status(403).json({ error: "Token expired or invalid" });
  }
});

// ── Me ────────────────────────────────────────────────────────────────────────
router.get("/me", authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select("-passwordHash -refreshToken");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

module.exports = router;
