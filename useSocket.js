/**
 * hooks/useSocket.js — WebSocket Connection Hook
 * Manages Socket.io connection lifecycle with auto-reconnect.
 */

import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";

export function useSocket(token) {
  const socketRef  = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) return;

    const socket = io(SERVER_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect",    () => { setConnected(true);  console.log("🔌 Socket connected"); });
    socket.on("disconnect", () => { setConnected(false); console.log("❌ Socket disconnected"); });
    socket.on("connect_error", (err) => console.error("Socket error:", err.message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [token]);

  return { socket: socketRef.current, connected };
}
