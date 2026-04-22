/**
 * components/Toolbar.jsx — Editor Toolbar
 * Language selector, Run button, share link, active users.
 */

const LANGUAGES = [
  { value: "python",     label: "🐍 Python" },
  { value: "javascript", label: "🟨 JavaScript" },
  { value: "java",       label: "☕ Java" },
  { value: "cpp",        label: "⚙️ C++" },
  { value: "go",         label: "🐹 Go" },
];

export default function Toolbar({ language, onLanguageChange, onRun, loading, users = [], roomId, connected }) {
  function copyLink() {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url).then(() => alert("Room link copied!"));
  }

  return (
    <div style={toolbarStyle}>
      {/* Left: Logo + language */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={logoStyle}>
          <span style={{ color: "#60a5fa" }}>Code</span>
          <span style={{ color: "#f59e0b" }}>Pulse</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#10b981" : "#ef4444", marginLeft: 6, display: "inline-block" }} title={connected ? "Connected" : "Disconnected"} />
        </div>

        <select
          value={language}
          onChange={e => onLanguageChange(e.target.value)}
          style={selectStyle}
        >
          {LANGUAGES.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      {/* Center: Active users */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {users.slice(0, 5).map((u, i) => (
          <div
            key={i}
            title={u.username}
            style={{
              width: 28, height: 28, borderRadius: "50%",
              background: USER_COLORS[i % USER_COLORS.length],
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "white",
              border: "2px solid #1e2d45",
            }}
          >
            {u.username?.[0]?.toUpperCase() || "?"}
          </div>
        ))}
        {users.length > 5 && (
          <span style={{ fontSize: 11, color: "#6b7280" }}>+{users.length - 5}</span>
        )}
        {users.length > 0 && (
          <span style={{ fontSize: 11, color: "#6b7280", marginLeft: 4 }}>
            {users.length} online
          </span>
        )}
      </div>

      {/* Right: Share + Run */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {roomId && (
          <button onClick={copyLink} style={shareBtnStyle} title="Copy room link">
            🔗 Share
          </button>
        )}

        <button
          onClick={onRun}
          disabled={loading}
          style={{
            ...runBtnStyle,
            background: loading ? "#1d4ed8" : "#2563eb",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "⚙️ Running..." : "▶ Run"}
        </button>
      </div>
    </div>
  );
}

const USER_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"];

const toolbarStyle = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "0 16px", height: 52,
  background: "#111827", borderBottom: "1px solid #1e2d45",
};

const logoStyle = {
  fontSize: 16, fontWeight: 800, fontFamily: "sans-serif",
  letterSpacing: "-0.5px", display: "flex", alignItems: "center",
};

const selectStyle = {
  background: "#1a2235", border: "1px solid #1e2d45", color: "#e2e8f0",
  borderRadius: 6, padding: "5px 10px", fontSize: 13, cursor: "pointer", outline: "none",
};

const shareBtnStyle = {
  background: "transparent", border: "1px solid #1e2d45", color: "#9ca3af",
  borderRadius: 6, padding: "6px 14px", fontSize: 13, cursor: "pointer",
};

const runBtnStyle = {
  border: "none", color: "white", borderRadius: 6,
  padding: "7px 20px", fontSize: 13, fontWeight: 700,
  transition: "background 0.15s",
};
