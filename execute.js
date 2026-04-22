/**
 * routes/execute.js — Code Execution Endpoint
 * POST /api/execute — Submit code, get stdout/stderr back
 *
 * Each submission runs in an isolated Docker container with:
 *   - 50MB memory cap
 *   - 0.5 CPU limit
 *   - 10 second timeout
 *   - No network access inside container
 */

const express = require("express");
const { body, validationResult } = require("express-validator");

const { authMiddleware } = require("../middleware/authMiddleware");
const executor = require("../services/executor");
const Session  = require("../models/Session");
const User     = require("../models/User");

const router = express.Router();
router.use(authMiddleware);

// Execution rate limit — 10 per minute per user
const userExecutionCount = new Map();
const EXEC_LIMIT = 10;
const EXEC_WINDOW_MS = 60 * 1000;

function checkExecRateLimit(userId) {
  const now     = Date.now();
  const record  = userExecutionCount.get(userId) || { count: 0, windowStart: now };

  if (now - record.windowStart > EXEC_WINDOW_MS) {
    userExecutionCount.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= EXEC_LIMIT) return false;

  record.count++;
  userExecutionCount.set(userId, record);
  return true;
}

// ── POST /api/execute ─────────────────────────────────────────────────────────
router.post("/", [
  body("code").notEmpty().isLength({ max: 50000 }).withMessage("Code too long (max 50KB)"),
  body("language").isIn(["python", "javascript", "java", "cpp", "go"]),
  body("roomId").optional().isString(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  // Rate limiting
  if (!checkExecRateLimit(req.user.id)) {
    return res.status(429).json({ error: "Execution limit reached (10/min). Please wait." });
  }

  const { code, language, roomId } = req.body;
  const startTime = Date.now();

  try {
    // Run code in Docker container
    const result = await executor.run({ code, language });
    const duration = Date.now() - startTime;

    const executionLog = {
      language,
      code,
      stdout:     result.stdout,
      stderr:     result.stderr,
      exitCode:   result.exitCode,
      duration,
      executedBy: req.user.id,
    };

    // Save execution log to session if roomId provided
    if (roomId) {
      await Session.findOneAndUpdate(
        { roomId },
        {
          $push: { executionLogs: { $each: [executionLog], $slice: -50 } }, // Keep last 50
          $set:  { lastActiveAt: new Date() },
        }
      );
    }

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { "stats.executionsRun": 1 } });

    res.json({
      stdout:   result.stdout,
      stderr:   result.stderr,
      exitCode: result.exitCode,
      duration,
      language,
    });

  } catch (err) {
    console.error("❌ Execution error:", err.message);
    res.status(500).json({ error: "Execution failed", detail: err.message });
  }
});

module.exports = router;
