/**
 * routes/sessions.js — Coding Session CRUD
 * GET    /api/sessions          — My sessions
 * POST   /api/sessions          — Create session
 * GET    /api/sessions/:roomId  — Get session by room ID
 * PUT    /api/sessions/:roomId  — Update title/language/code
 * DELETE /api/sessions/:roomId  — Delete session
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { body, validationResult } = require("express-validator");

const Session = require("../models/Session");
const User    = require("../models/User");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// ── GET my sessions ───────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const sessions = await Session.find({
      $or: [{ owner: req.user.id }, { collaborators: req.user.id }],
    })
      .select("-code -executionLogs")   // Exclude heavy fields from list view
      .sort({ lastActiveAt: -1 })
      .limit(50)
      .populate("owner", "username");

    res.json(sessions);
  } catch {
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

// ── POST create session ───────────────────────────────────────────────────────
router.post("/", [
  body("title").optional().trim().isLength({ max: 100 }),
  body("language").optional().isIn(["python", "javascript", "java", "cpp", "go"]),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, language } = req.body;
    const roomId  = uuidv4();

    const session = await Session.create({
      roomId,
      title:    title    || "Untitled Session",
      language: language || "python",
      code:     getStarterCode(language || "python"),
      owner:    req.user.id,
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { "stats.sessionsCreated": 1 } });

    res.status(201).json(session);
  } catch {
    res.status(500).json({ error: "Failed to create session" });
  }
});

// ── GET session by roomId ─────────────────────────────────────────────────────
router.get("/:roomId", async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.roomId })
      .populate("owner", "username")
      .populate("collaborators", "username");

    if (!session) return res.status(404).json({ error: "Session not found" });

    // Only owner and collaborators can access private sessions
    const isOwner        = session.owner._id.toString() === req.user.id;
    const isCollaborator = session.collaborators.some(c => c._id.toString() === req.user.id);

    if (!session.isPublic && !isOwner && !isCollaborator) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Add as collaborator if not already
    if (!isOwner && !isCollaborator) {
      session.collaborators.push(req.user.id);
      await session.save();
    }

    res.json(session);
  } catch {
    res.status(500).json({ error: "Failed to fetch session" });
  }
});

// ── PUT update session ────────────────────────────────────────────────────────
router.put("/:roomId", async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.roomId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can update session settings" });
    }

    const { title, language, code, isPublic } = req.body;
    if (title    !== undefined) session.title    = title;
    if (language !== undefined) session.language = language;
    if (code     !== undefined) session.code     = code;
    if (isPublic !== undefined) session.isPublic = isPublic;

    await session.save();
    res.json(session);
  } catch {
    res.status(500).json({ error: "Failed to update session" });
  }
});

// ── DELETE session ────────────────────────────────────────────────────────────
router.delete("/:roomId", async (req, res) => {
  try {
    const session = await Session.findOne({ roomId: req.params.roomId });
    if (!session) return res.status(404).json({ error: "Session not found" });
    if (session.owner.toString() !== req.user.id) {
      return res.status(403).json({ error: "Only the owner can delete a session" });
    }
    await session.deleteOne();
    res.json({ message: "Session deleted" });
  } catch {
    res.status(500).json({ error: "Failed to delete session" });
  }
});

// ── Starter code templates ────────────────────────────────────────────────────
function getStarterCode(language) {
  const templates = {
    python:     `# CodePulse — Python\nprint("Hello, CodePulse!")\n`,
    javascript: `// CodePulse — JavaScript\nconsole.log("Hello, CodePulse!");\n`,
    java:       `// CodePulse — Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, CodePulse!");\n    }\n}\n`,
    cpp:        `// CodePulse — C++\n#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, CodePulse!" << endl;\n    return 0;\n}\n`,
    go:         `// CodePulse — Go\npackage main\nimport "fmt"\nfunc main() {\n    fmt.Println("Hello, CodePulse!")\n}\n`,
  };
  return templates[language] || templates.python;
}

module.exports = router;
