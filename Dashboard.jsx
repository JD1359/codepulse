/**
 * pages/Dashboard.jsx — User Dashboard
 * Lists user's sessions, lets them create new ones.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../hooks/useAuth";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const LANG_ICONS = { python: "🐍", javascript: "🟨", java: "☕", cpp: "⚙️", go: "🐹" };

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions,  setSessions]  = useState([]);
  const [creating,  setCreating]  = useState(false);
  const [newTitle,  setNewTitle]  = useState("");
  const [newLang,   setNewLang]   = useState("python");

  useEffect(() => {
    axios.get(`${API}/sessions`).then(res => setSessions(res.data)).catch(() => {});
  }, []);

  async function createSession() {
    if (creating) return;
    setCreating(true);
    try {
      const res = await axios.post(`${API}/sessions`, {
        title: newTitle || "Untitled Session",
        language: newLang,
      });
      navigate(`/room/${res.data.roomId}`);
    } catch {
      alert("Failed to create session");
    } finally {
      setCreating(false);
    }
  }

  function joinRoom() {
    const id = prompt("Enter Room ID:");
    if (id) navigate(`/room/${id.trim()}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e2e8f0", fontFamily: "sans-serif" }}>
      {/* Nav */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1e2d45", padding: "0 32px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          <span style={{ color: "#60a5fa" }}>Code</span><span style={{ color: "#f59e0b" }}>Pulse</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>👋 {user?.username}</span>
          <button onClick={logout} style={{ background: "transparent", border: "1px solid #1e2d45", color: "#9ca3af", padding: "5px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Create new session */}
        <div style={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Start a New Session</h2>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Session title (optional)"
              style={{ flex: 1, minWidth: 200, background: "#1a2235", border: "1px solid #1e2d45", color: "#e2e8f0", padding: "9px 14px", borderRadius: 8, fontSize: 14, outline: "none" }}
            />
            <select
              value={newLang}
              onChange={e => setNewLang(e.target.value)}
              style={{ background: "#1a2235", border: "1px solid #1e2d45", color: "#e2e8f0", padding: "9px 14px", borderRadius: 8, fontSize: 14, cursor: "pointer", outline: "none" }}
            >
              {Object.entries(LANG_ICONS).map(([v, icon]) => (
                <option key={v} value={v}>{icon} {v.charAt(0).toUpperCase() + v.slice(1)}</option>
              ))}
            </select>
            <button onClick={createSession} disabled={creating} style={{ background: "#2563eb", color: "white", border: "none", padding: "9px 24px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {creating ? "Creating..." : "+ New Session"}
            </button>
            <button onClick={joinRoom} style={{ background: "#1a2235", color: "#9ca3af", border: "1px solid #1e2d45", padding: "9px 20px", borderRadius: 8, fontSize: 14, cursor: "pointer" }}>
              🔗 Join Room
            </button>
          </div>
        </div>

        {/* Session list */}
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Your Sessions</h2>
        {sessions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#4b5563" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💻</div>
            <p>No sessions yet. Create one above!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {sessions.map(s => (
              <div
                key={s._id}
                onClick={() => navigate(`/room/${s.roomId}`)}
                style={{ background: "#111827", border: "1px solid #1e2d45", borderRadius: 10, padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#3b82f6"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "#1e2d45"}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>
                    {LANG_ICONS[s.language]} {s.title}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {s.language} · {new Date(s.lastActiveAt || s.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "#3b82f6" }}>Open →</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
