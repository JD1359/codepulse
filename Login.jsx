/**
 * pages/Login.jsx — Login & Register Page
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [mode,     setMode]     = useState("login");   // "login" | "register"
  const [username, setUsername] = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={pageStyle}>
      {/* Background grid */}
      <div style={gridStyle} />

      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 32, fontWeight: 900, letterSpacing: "-1px" }}>
            <span style={{ color: "#60a5fa" }}>Code</span>
            <span style={{ color: "#f59e0b" }}>Pulse</span>
          </div>
          <p style={{ color: "#6b7280", fontSize: 13, marginTop: 6 }}>
            Real-time collaborative code execution
          </p>
        </div>

        {/* Tab switch */}
        <div style={{ display: "flex", background: "#0a0e1a", borderRadius: 8, padding: 4, marginBottom: 24 }}>
          {["login", "register"].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              style={{
                flex: 1, padding: "8px", border: "none", borderRadius: 6,
                fontSize: 13, fontWeight: 600, cursor: "pointer",
                background: mode === m ? "#1e2d45" : "transparent",
                color:      mode === m ? "#e2e8f0" : "#6b7280",
                transition: "all 0.15s",
              }}
            >
              {m === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <div style={fieldStyle}>
              <label style={labelStyle}>Username</label>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="jayadeep_g"
                required
                minLength={3}
                style={inputStyle}
              />
            </div>
          )}

          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              required
              style={inputStyle}
            />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={mode === "register" ? "Min 8 characters" : "Your password"}
              required
              minLength={mode === "register" ? 8 : 1}
              style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: "#1f1315", border: "1px solid #7f1d1d", color: "#f87171", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 16 }}>
              ❌ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", borderRadius: 8, border: "none",
              background: loading ? "#1d4ed8" : "#2563eb",
              color: "white", fontSize: 14, fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
          >
            {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        {/* Features footer */}
        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #1e2d45" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { icon: "⚡", text: "Real-time collaboration" },
              { icon: "🐳", text: "Docker sandboxed execution" },
              { icon: "🌐", text: "5+ languages supported" },
              { icon: "🔒", text: "JWT secured sessions" },
            ].map((f, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6b7280" }}>
                <span>{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#0a0e1a",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  position: "relative",
  overflow: "hidden",
};

const gridStyle = {
  position: "absolute",
  inset: 0,
  backgroundImage: `linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)`,
  backgroundSize: "40px 40px",
};

const cardStyle = {
  background: "#111827",
  border: "1px solid #1e2d45",
  borderRadius: 16,
  padding: 36,
  width: "100%",
  maxWidth: 400,
  position: "relative",
  zIndex: 1,
  fontFamily: "sans-serif",
  color: "#e2e8f0",
};

const fieldStyle = { marginBottom: 16 };

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#9ca3af",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const inputStyle = {
  width: "100%",
  background: "#0a0e1a",
  border: "1px solid #1e2d45",
  color: "#e2e8f0",
  padding: "10px 14px",
  borderRadius: 8,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};
