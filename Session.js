/**
 * models/Session.js — CodePulse Coding Session Schema
 */
const mongoose = require("mongoose");

const ExecutionLogSchema = new mongoose.Schema({
  language:   String,
  code:       String,
  stdout:     String,
  stderr:     String,
  exitCode:   Number,
  duration:   Number,   // ms
  executedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  executedAt: { type: Date, default: Date.now },
}, { _id: false });

const SessionSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  title: {
    type: String,
    default: "Untitled Session",
    maxlength: 100,
  },
  language: {
    type: String,
    enum: ["python", "javascript", "java", "cpp", "go"],
    default: "python",
  },
  code: {
    type: String,
    default: "",
    maxlength: 50000,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  isPublic:       { type: Boolean, default: false },
  executionLogs:  [ExecutionLogSchema],
  lastActiveAt:   { type: Date, default: Date.now },
}, { timestamps: true });

// Auto-update lastActiveAt on save
SessionSchema.pre("save", function (next) {
  this.lastActiveAt = new Date();
  next();
});

// Compound index for fast owner queries
SessionSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("Session", SessionSchema);
