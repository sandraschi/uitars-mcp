import { useState } from "react";

export function BrowserPage() {
  const [url, setUrl] = useState("https://github.com");
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [pageInfo, setPageInfo] = useState<any>(null);
  const [result, setResult] = useState<any>(null);

  const navigate = async () => {
    if (!url.trim()) return;
    setRunning(true); setPageInfo(null); setResult(null);
    log(`Navigate: ${url.trim()}`);
    try {
      const r = await fetch("/api/browser/navigate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const d = await r.json();
      setPageInfo(d);
      log(`Page: ${d.title || d.url}`);
    } catch (e: any) { log(e.message, "error"); }
    finally { setRunning(false); }
  };

  const execute = async () => {
    if (!task.trim()) return;
    setRunning(true); setResult(null);
    log(`Browser task: ${task.trim()}`);
    try {
      const r = await fetch("/api/browser/execute", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim() }),
      });
      const d = await r.json();
      setResult(d);
      log(`Result: ${d.success ? "OK" : "Failed"} — ${d.message}`);
    } catch (e: any) { log(e.message, "error"); }
    finally { setRunning(false); }
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
        <div style={s.label}>Navigate</div>
        <div style={s.inputRow}>
          <input style={s.input} placeholder="https://..." value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !running && navigate()} disabled={running} />
          <button style={s.btn(running || !url.trim())} onClick={navigate} disabled={running || !url.trim()}>
            Go
          </button>
        </div>
      </div>

      {pageInfo?.screenshot_base64 && (
        <div style={s.card}>
          <div style={s.label}>Page: {pageInfo.title || pageInfo.url}</div>
          <div style={s.shotArea}><img style={s.img} src={`data:image/png;base64,${pageInfo.screenshot_base64}`} alt="Page" /></div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.label}>Browser Task</div>
        <div style={s.inputRow}>
          <input style={s.input} placeholder='e.g. Search for Python, click first result'
            value={task} onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !running && execute()} disabled={running} />
          <button style={s.btn(running || !task.trim())} onClick={execute} disabled={running || !task.trim()}>
            Execute
          </button>
        </div>
      </div>

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
  if (fn) fn(`[Browser] ${msg}`, level);
}
