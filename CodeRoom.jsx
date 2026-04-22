/**
 * pages/CodeRoom.jsx — Main Collaborative Code Editor Page
 * Loads session, connects WebSocket, renders Editor + Terminal.
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import Editor   from "../components/Editor";
import Terminal from "../components/Terminal";
import Toolbar  from "../components/Toolbar";
import { useSocket } from "../hooks/useSocket";
import { useAuth }   from "../hooks/useAuth";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default function CodeRoom() {
  const { roomId } = useParams();
  const { user, token } = useAuth();
  const { socket, connected } = useSocket(token);

  const [session,  setSession]  = useState(null);
  const [code,     setCode]     = useState("");
  const [language, setLanguage] = useState("python");
  const [users,    setUsers]    = useState([]);
  const [output,   setOutput]   = useState(null);
  const [running,  setRunning]  = useState(false);
  const [error,    setError]    = useState("");

  // ── Load session from REST API ────────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API}/sessions/${roomId}`)
      .then(res => {
        setSession(res.data);
        setCode(res.data.code || "");
        setLanguage(res.data.language || "python");
      })
      .catch(() => setError("Session not found or access denied."));
  }, [roomId]);

  // ── WebSocket room events ─────────────────────────────────────────────────
  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit("room:join", { roomId });

    socket.on("room:state",   (state) => { setCode(state.code); setLanguage(state.language); setUsers(state.users); });
    socket.on("room:users",   (u) => setUsers(u));
    socket.on("language:update", ({ language: lang }) => setLanguage(lang));
    socket.on("execution:output", (result) => { setOutput(result); setRunning(false); });

    return () => {
      socket.emit("room:leave", { roomId });
      socket.off("room:state");
      socket.off("room:users");
      socket.off("language:update");
      socket.off("execution:output");
    };
  }, [socket, roomId]);

  // ── Language change ───────────────────────────────────────────────────────
  function handleLanguageChange(lang) {
    setLanguage(lang);
    socket?.emit("language:change", { roomId, language: lang });
  }

  // ── Run code ──────────────────────────────────────────────────────────────
  async function handleRun() {
    if (running) return;
    setRunning(true);
    setOutput(null);

    try {
      const res = await axios.post(`${API}/execute`, { code, language, roomId });
      const result = res.data;
      setOutput(result);
      setRunning(false);

      // Broadcast result to collaborators
      socket?.emit("execution:result", { roomId, result });
    } catch (err) {
      setOutput({
        stdout:   "",
        stderr:   err.response?.data?.error || "Execution failed",
        exitCode: 1,
        duration: 0,
      });
      setRunning(false);
    }
  }

  // ── Code change from editor ───────────────────────────────────────────────
  const handleCodeChange = useCallback((val) => setCode(val), []);

  if (error) {
    return (
      <div style={centeredStyle}>
        <div style={{ color: "#ef4444", fontSize: 16 }}>❌ {error}</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div style={centeredStyle}>
        <div style={{ color: "#6b7280" }}>Loading session...</div>
      </div>
    );
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0a0e1a" }}>
      {/* Toolbar */}
      <Toolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        loading={running}
        users={users}
        roomId={roomId}
        connected={connected}
      />

      {/* Editor + Terminal split */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Editor takes 65% */}
        <div style={{ flex: "0 0 65%", overflow: "hidden" }}>
          <Editor
            code={code}
            language={language}
            socket={socket}
            roomId={roomId}
            onCodeChange={handleCodeChange}
          />
        </div>

        {/* Terminal takes 35% */}
        <div style={{ flex: "0 0 35%", overflow: "hidden" }}>
          <Terminal output={output} loading={running} />
        </div>
      </div>
    </div>
  );
}

const centeredStyle = {
  height: "100vh", display: "flex",
  alignItems: "center", justifyContent: "center",
  background: "#0a0e1a", fontFamily: "sans-serif",
};
