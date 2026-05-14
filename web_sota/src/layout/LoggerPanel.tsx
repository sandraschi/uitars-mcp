import { useState, useEffect, useRef } from "react";

interface LogEntry {
  ts: string;
  msg: string;
  level: string;
}

export function LoggerPanel() {
  const [expanded, setExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const addLog = (msg: string, level = "info") => {
    setLogs((prev) => [
      ...prev.slice(-200),
      { ts: new Date().toISOString().slice(11, 19), msg, level },
    ]);
  };

  useEffect(() => {
    (window as any).__uitarsLog = addLog;
    addLog("Logger ready");
    return () => { delete (window as any).__uitarsLog; };
  }, []);

  const levelColor = (l: string) => {
    switch (l) {
      case "error": return "#f85149";
      case "warn": return "#d29922";
      default: return "#8b949e";
    }
  };

  const s = {
    panel: {
      borderTop: "1px solid #21262d", background: "#0d1117",
      transition: "height 0.2s ease", overflow: "hidden",
      height: expanded ? 200 : 28, minHeight: expanded ? 200 : 28,
    },
    header: {
      height: 28, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 12px", cursor: "pointer", background: "#161b22",
      borderBottom: expanded ? "1px solid #21262d" : "none",
    },
    headerText: { fontSize: 11, color: "#8b949e", fontWeight: 600 },
    body: { height: expanded ? 172 : 0, overflow: "auto", padding: "4px 12px" },
    line: { fontSize: 10, fontFamily: "monospace", padding: "1px 0", color: "#8b949e" },
  };

  return (
    <div style={s.panel}>
      <div style={s.header} onClick={() => setExpanded(!expanded)} title="Toggle logger">
        <span style={s.headerText}>Logger — {logs.length} entries</span>
        <span style={{ fontSize: 10, color: "#484f58" }}>{expanded ? "▼" : "▲"}</span>
      </div>
      <div
        style={s.body}
        onScroll={(e) => {
          const el = e.currentTarget;
          setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 30);
        }}
      >
        {logs.map((l, i) => (
          <div key={i} style={s.line}>
            <span style={{ color: "#484f58" }}>{l.ts}</span>{" "}
            <span style={{ color: levelColor(l.level) }}>{l.msg}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
