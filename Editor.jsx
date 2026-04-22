/**
 * components/Editor.jsx — Monaco Editor with Real-Time Sync
 * Wraps @monaco-editor/react and emits/receives WebSocket events.
 */

import { useRef, useEffect, useCallback } from "react";
import MonacoEditor from "@monaco-editor/react";

const LANGUAGE_MAP = {
  python:     "python",
  javascript: "javascript",
  java:       "java",
  cpp:        "cpp",
  go:         "go",
};

export default function Editor({ code, language, socket, roomId, onCodeChange, readOnly = false }) {
  const editorRef     = useRef(null);
  const isRemote      = useRef(false);  // Flag to prevent echo loop

  // ── Receive remote code updates ───────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    function onRemoteUpdate({ code: remoteCode }) {
      if (!editorRef.current) return;
      const editor = editorRef.current;
      const model  = editor.getModel();
      if (!model) return;

      // Save cursor position before update
      const pos = editor.getPosition();

      // Apply remote change without triggering local onChange
      isRemote.current = true;
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: remoteCode }],
        () => null
      );
      isRemote.current = false;

      // Restore cursor
      if (pos) editor.setPosition(pos);
    }

    socket.on("code:update", onRemoteUpdate);
    return () => socket.off("code:update", onRemoteUpdate);
  }, [socket]);

  // ── Handle local edits ────────────────────────────────────────────────────
  const handleChange = useCallback((value) => {
    if (isRemote.current) return;   // Skip — this was a remote update
    onCodeChange(value || "");

    // Emit to room via WebSocket
    if (socket && roomId) {
      const pos = editorRef.current?.getPosition();
      socket.emit("code:change", {
        roomId,
        code:      value || "",
        cursorPos: pos ? { line: pos.lineNumber, column: pos.column } : null,
      });
    }
  }, [socket, roomId, onCodeChange]);

  // ── Emit cursor movement ──────────────────────────────────────────────────
  function handleEditorMount(editor) {
    editorRef.current = editor;

    editor.onDidChangeCursorPosition((e) => {
      if (socket && roomId) {
        socket.emit("cursor:move", {
          roomId,
          line:   e.position.lineNumber,
          column: e.position.column,
        });
      }
    });
  }

  return (
    <MonacoEditor
      height="100%"
      language={LANGUAGE_MAP[language] || "python"}
      value={code}
      onChange={handleChange}
      onMount={handleEditorMount}
      theme="vs-dark"
      options={{
        fontSize:             14,
        fontFamily:           "'JetBrains Mono', 'Fira Code', monospace",
        fontLigatures:        true,
        minimap:              { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap:             "on",
        lineNumbers:          "on",
        glyphMargin:          false,
        folding:              true,
        renderLineHighlight:  "line",
        cursorStyle:          "line",
        automaticLayout:      true,
        tabSize:              4,
        readOnly,
        padding:              { top: 16, bottom: 16 },
      }}
    />
  );
}
