import { useState, useEffect, useCallback, useRef } from "react";

export function DesktopPage() {
  const [desktopShot, setDesktopShot] = useState<string | null>(null);
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const shotRef = useRef<HTMLDivElement>(null);

  const refreshShot = useCallback(async () => {
    try {
      const r = await fetch("/api/screenshot");
      const d = await r.json();
      if (d.success) setDesktopShot(d.image_base64);
      log("Desktop screenshot captured");
    } catch (e: any) {
      log(e.message || "Screenshot failed", "error");
    }
  }, []);

  useEffect(() => { refreshShot(); }, [refreshShot]);

  const execute = async () => {
    if (!task.trim()) return;
    setRunning(true); setError(null); setResult(null);
    log(`Task: ${task.trim()}`);
    try {
      const r = await fetch("/api/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim() }),
      });
      const d = await r.json();
      setResult(d);
      log(`Result: ${d.success ? "OK" : "Failed"} — ${d.message}`);
      refreshShot();
    } catch (e: any) {
      setError(e.message);
      log(`Error: ${e.message}`, "error");
    } finally { setRunning(false); }
  };

  const s: any = {
    wrap: { padding: "24px" },
    card: { background: "rgba(22,27,34,0.8)", backdropFilter: "blur(8px)", border: "1px solid #21262d", borderRadius: 8, padding: 20, marginBottom: 16 },
    label: { fontSize: 14, fontWeight: 600, color: "#8b949e", marginBottom: 8 },
    inputRow: { display: "flex", gap: 8 },
    input: { flex: 1, padding: "10px 14px", background: "#0d1117", border: "1px solid #30363d", borderRadius: 6, color: "#c9d1d9", fontSize: 14, outline: "none" },
    btn: (d: boolean) => ({ padding: "10px 24px", background: d ? "#21262d" : "#238636", color: d ? "#484f58" : "#fff", border: "none", borderRadius: 6, cursor: d ? "not-allowed" : "pointer", fontSize: 14, fontWeight: 500, whiteSpace: "nowrap" }),
    shotArea: { background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: 12, maxHeight: 400, overflow: "auto" },
    img: { maxWidth: "100%", borderRadius: 4, display: "block" },
    steps: { maxHeight: 200, overflow: "auto" },
    step: { padding: "8px 0", borderBottom: "1px solid #21262d", fontSize: 12 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.label}>Task</div>
        <div style={s.inputRow}>
          <input style={s.input} placeholder='e.g. Open Notepad and type "hello world"'
            value={task} onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !running && execute()} disabled={running} />
          <button style={s.btn(running || !task.trim())} onClick={execute} disabled={running || !task.trim()}>
            {running ? "Running..." : "Execute"}
          </button>
        </div>
      </div>

      {desktopShot && (
        <div style={s.card}>
          <div style={s.label}>Live Desktop</div>
          <div style={s.shotArea} ref={shotRef}>
            <img style={s.img} src={`data:image/png;base64,${desktopShot}`} alt="Desktop" />
          </div>
        </div>
      )}

      {error && <div style={{ ...s.card, color: "#f85149" }}>{error}</div>}

      {result && (
        <div style={s.card}>
          <div style={s.label}>Result: {result.success ? "OK" : "Failed"} — {result.message}</div>
          <div style={s.steps}>
            {(result.actions || []).map((st: any) => (
              <div key={st.step} style={s.step}>
                <strong>Step {st.step}</strong> ({st.action_type}): {st.status}
                <br /><span style={{ color: "#8b949e" }}>{st.thought}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function log(msg: string, level = "info") {
  const fn = (window as any).__uitarsLog;
  if (fn) fn(`[Desktop] ${msg}`, level);
}
