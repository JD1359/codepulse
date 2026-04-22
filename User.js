/**
 * models/User.js — CodePulse User Schema
 */
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  refreshToken: { type: String, default: null },
  avatar:       { type: String, default: null },  // URL or initials color
  stats: {
    sessionsCreated: { type: Number, default: 0 },
    executionsRun:   { type: Number, default: 0 },
  },
}, { timestamps: true });

UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model("User", UserSchema);
