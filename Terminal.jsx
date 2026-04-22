/**
 * components/Terminal.jsx — Execution Output Terminal
 * Displays stdout, stderr, exit code, and execution duration.
 */

export default function Terminal({ output, loading }) {
  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={dotStyle("#f59e0b")} />
          <span style={labelStyle}>Running...</span>
          <span style={spinnerStyle}>⚙️</span>
        </div>
        <div style={bodyStyle}>
          <span style={{ color: "#6b7280", fontStyle: "italic" }}>Executing in Docker sandbox...</span>
        </div>
      </div>
    );
  }

  if (!output) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <span style={dotStyle("#4b5563")} />
          <span style={labelStyle}>Terminal</span>
        </div>
        <div style={bodyStyle}>
          <span style={{ color: "#4b5563" }}>Press Run to execute your code.</span>
        </div>
      </div>
    );
  }

  const { stdout, stderr, exitCode, duration, executedBy } = output;
  const success = exitCode === 0;
  const timedOut = exitCode === 124;

  return (
    <div style={containerStyle}>
      {/* Header bar */}
      <div style={headerStyle}>
        <span style={dotStyle(success ? "#10b981" : "#ef4444")} />
        <span style={labelStyle}>
          {timedOut ? "⏱️ Timed Out" : success ? "✅ Success" : "❌ Error"}
        </span>
        {duration && (
          <span style={{ color: "#6b7280", fontSize: 11, marginLeft: "auto" }}>
            {duration}ms {executedBy && `· by ${executedBy}`}
          </span>
        )}
      </div>

      {/* Output body */}
      <div style={bodyStyle}>
        {stdout && (
          <div>
            {stdout.split("\n").map((line, i) => (
              <div key={i} style={{ color: "#e2e8f0", lineHeight: 1.6 }}>
                {line || "\u00A0"}
              </div>
            ))}
          </div>
        )}

        {stderr && (
          <div style={{ marginTop: stdout ? 12 : 0 }}>
            <div style={{ color: "#f87171", marginBottom: 4, fontSize: 11, fontWeight: 600 }}>
              STDERR:
            </div>
            {stderr.split("\n").map((line, i) => (
              <div key={i} style={{ color: "#f87171", lineHeight: 1.6 }}>
                {line || "\u00A0"}
              </div>
            ))}
          </div>
        )}

        {!stdout && !stderr && (
          <span style={{ color: "#6b7280" }}>No output.</span>
        )}

        {/* Exit code */}
        <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #1e2d45", fontSize: 11, color: "#6b7280" }}>
          Exit code: <span style={{ color: success ? "#10b981" : "#f87171", fontWeight: 700 }}>
            {exitCode}
          </span>
        </div>
      </div>
    </div>
  );
}

// Styles
const containerStyle = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  background: "#0d1117",
  borderTop: "1px solid #1e2d45",
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  fontSize: 13,
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 16px",
  background: "#111827",
  borderBottom: "1px solid #1e2d45",
  minHeight: 36,
};

const bodyStyle = {
  flex: 1,
  padding: "14px 16px",
  overflowY: "auto",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const labelStyle = { fontSize: 12, fontWeight: 600, color: "#9ca3af", fontFamily: "sans-serif" };

const spinnerStyle = { marginLeft: "auto", fontSize: 14, animation: "spin 1s linear infinite" };

function dotStyle(color) {
  return {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
  };
}
