import { useState, useEffect, useCallback } from "react";
import { Demo } from "./Demo";

interface VLMStatus {
  ok: boolean;
  models?: string[];
  configured_model?: string;
  error?: string;
}

interface StepRecord {
  step: number;
  thought: string;
  action: string;
  action_type: string;
  status: string;
}

interface TaskResult {
  success: boolean;
  task: string;
  steps: number;
  message: string;
  actions: StepRecord[];
}

interface PageInfo {
  success: boolean;
  url?: string;
  title?: string;
  screenshot_base64?: string;
  width?: number;
  height?: number;
  error?: string;
}

type Tab = "control" | "browser" | "help" | "demo";

const API = "/api";

function App() {
  const [tab, setTab] = useState<Tab>("control");
  const [backendOk, setBackendOk] = useState(false);
  const [vlmStatus, setVlmStatus] = useState<VLMStatus | null>(null);
  const [desktopShot, setDesktopShot] = useState<string | null>(null);
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [browserUrl, setBrowserUrl] = useState("https://github.com");
  const [browserTask, setBrowserTask] = useState("");
  const [browserRunning, setBrowserRunning] = useState(false);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [browserResult, setBrowserResult] = useState<TaskResult | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API}/health`);
      if (res.ok) setBackendOk(true);
    } catch { setBackendOk(false); }
  }, []);

  const checkVLM = useCallback(async () => {
    try {
      const res = await fetch(`${API}/status`);
      const data = await res.json();
      setVlmStatus(data.vlm);
    } catch { setVlmStatus(null); }
  }, []);

  const refreshDesktopShot = useCallback(async () => {
    try {
      const res = await fetch(`${API}/screenshot`);
      const data = await res.json();
      if (data.success) setDesktopShot(data.image_base64);
    } catch {}
  }, []);

  useEffect(() => {
    checkHealth(); checkVLM(); refreshDesktopShot();
    const i = setInterval(() => { checkHealth(); checkVLM(); }, 10000);
    return () => clearInterval(i);
  }, [checkHealth, checkVLM]);

  const executeTask = async () => {
    if (!task.trim()) return;
    setRunning(true); setError(null); setResult(null);
    try {
      const res = await fetch(`${API}/execute`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim() }),
      });
      setResult(await res.json());
      refreshDesktopShot();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally { setRunning(false); }
  };

  const navigateBrowser = async () => {
    if (!browserUrl.trim()) return;
    setBrowserRunning(true); setPageInfo(null); setBrowserResult(null);
    try {
      const res = await fetch(`${API}/browser/navigate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: browserUrl.trim() }),
      });
      setPageInfo(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Navigation failed");
    } finally { setBrowserRunning(false); }
  };

  const executeBrowserTask = async () => {
    if (!browserTask.trim()) return;
    setBrowserRunning(true); setBrowserResult(null);
    try {
      const res = await fetch(`${API}/browser/execute`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: browserTask.trim(),
          start_url: pageInfo?.url ? undefined : browserUrl.trim(),
        }),
      });
      setBrowserResult(await res.json());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Browser task failed");
    } finally { setBrowserRunning(false); }
  };

  const s = {
    container: { display: "flex", flexDirection: "column" as const, minHeight: "100vh", padding: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #21262d", marginBottom: "24px" },
    title: { fontSize: "22px", fontWeight: 600, color: "#f0f6fc" },
    tabs: { display: "flex", gap: "4px" },
    tab: (t: Tab) => ({ padding: "8px 16px", background: tab === t ? "#1f2937" : "transparent", color: tab === t ? "#f0f6fc" : "#8b949e", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: 500 }),
    statusRow: { display: "flex", gap: "12px", marginBottom: "24px" },
    badge: (ok: boolean) => ({ padding: "4px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: 500, background: ok ? "#0d3320" : "#3d1f1f", color: ok ? "#3fb950" : "#f85149", border: `1px solid ${ok ? "#238636" : "#da3633"}` }),
    card: { background: "#161b22", border: "1px solid #21262d", borderRadius: "8px", padding: "20px", marginBottom: "16px" },
    inputRow: { display: "flex", gap: "8px" },
    input: { flex: 1, padding: "10px 14px", background: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", color: "#c9d1d9", fontSize: "14px", outline: "none" },
    btn: (d: boolean) => ({ padding: "10px 24px", background: d ? "#21262d" : "#238636", color: d ? "#484f58" : "#fff", border: "none", borderRadius: "6px", cursor: d ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" as const }),
    shotArea: { background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", padding: "12px", maxHeight: "400px", overflow: "auto" },
    img: { maxWidth: "100%", borderRadius: "4px", display: "block" },
    stepList: { maxHeight: "250px", overflow: "auto" },
    stepItem: { padding: "10px 0", borderBottom: "1px solid #21262d", fontSize: "13px" },
    label: { fontSize: "14px", fontWeight: 600, color: "#8b949e", marginBottom: "8px" },
    foot: { marginTop: "auto", padding: "16px 0", fontSize: "12px", color: "#484f58" },
    code: { background: "#0d1117", border: "1px solid #30363d", borderRadius: "4px", padding: "2px 6px", fontFamily: "monospace", fontSize: "12px", color: "#58a6ff" },
    hTitle: { fontSize: "16px", fontWeight: 600, color: "#f0f6fc", marginBottom: "8px" },
    hText: { fontSize: "13px", color: "#8b949e", lineHeight: "1.6" },
    tTable: { width: "100%", borderCollapse: "collapse" as const, fontSize: "13px" },
    tTh: { textAlign: "left" as const, padding: "8px 12px", borderBottom: "1px solid #21262d", color: "#8b949e", fontWeight: 600 },
    tTd: { padding: "8px 12px", borderBottom: "1px solid #21262d", color: "#c9d1d9", verticalAlign: "top" as const },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.title}>UI-TARS MCP — Desktop Agent</div>
        <div style={s.tabs}>
          <button style={s.tab("control")} onClick={() => setTab("control")}>Desktop</button>
          <button style={s.tab("browser")} onClick={() => setTab("browser")}>Browser</button>
          <button style={s.tab("demo")} onClick={() => setTab("demo")}>Demo</button>
          <button style={s.tab("help")} onClick={() => setTab("help")}>Help</button>
        </div>
      </div>

      <div style={s.statusRow}>
        <span style={s.badge(backendOk)}>Backend: {backendOk ? "OK" : "DOWN"}</span>
        <span style={s.badge(vlmStatus?.ok ?? false)}>VLM: {vlmStatus?.ok ? (vlmStatus?.configured_model ?? "OK") : vlmStatus?.error ?? "DOWN"}</span>
      </div>

      {/* ── Desktop ── */}
      {tab === "control" && (
        <>
          <div style={s.card}>
            <div style={s.label}>Task</div>
            <div style={s.inputRow}>
              <input style={s.input} placeholder='e.g. Open Notepad and type "hello world"'
                value={task} onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !running && executeTask()} disabled={running} />
              <button style={s.btn(running || !task.trim())} onClick={executeTask} disabled={running || !task.trim()}>
                {running ? "Running..." : "Execute"}
              </button>
            </div>
          </div>
          {desktopShot && (
            <div style={s.card}>
              <div style={s.label}>Live Desktop</div>
              <div style={s.shotArea}><img style={s.img} src={`data:image/png;base64,${desktopShot}`} alt="Desktop" /></div>
              <button style={{ ...s.btn(false), marginTop: "8px" }} onClick={refreshDesktopShot}>Refresh</button>
            </div>
          )}
          {error && <div style={s.card}><div style={{ color: "#f85149" }}>{error}</div></div>}
          {result && (
            <div style={s.card}>
              <div style={s.label}>Result: {result.success ? "OK" : "Failed"} — {result.message}</div>
              <div style={s.stepList}>
                {result.actions.map((st) => (
                  <div key={st.step} style={s.stepItem}>
                    <strong>Step {st.step}</strong> ({st.action_type}): {st.status}
                    <br /><span style={{ color: "#8b949e" }}>Thought: {st.thought}</span>
                    <br /><span style={{ color: "#58a6ff" }}>Action: {st.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Browser ── */}
      {tab === "browser" && (
        <>
          <div style={s.card}>
            <div style={s.label}>Navigate</div>
            <div style={s.inputRow}>
              <input style={s.input} placeholder="https://..." value={browserUrl}
                onChange={(e) => setBrowserUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !browserRunning && navigateBrowser()}
                disabled={browserRunning} />
              <button style={s.btn(browserRunning || !browserUrl.trim())} onClick={navigateBrowser} disabled={browserRunning || !browserUrl.trim()}>
                {browserRunning ? "Loading..." : "Go"}
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
              <input style={s.input} placeholder='e.g. Search for Python, click the first result'
                value={browserTask} onChange={(e) => setBrowserTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !browserRunning && executeBrowserTask()} disabled={browserRunning} />
              <button style={s.btn(browserRunning || !browserTask.trim())} onClick={executeBrowserTask} disabled={browserRunning || !browserTask.trim()}>
                {browserRunning ? "Running..." : "Execute"}
              </button>
            </div>
          </div>
          {browserResult && (
            <div style={s.card}>
              <div style={s.label}>Browser: {browserResult.success ? "OK" : "Failed"} — {browserResult.message}</div>
              <div style={s.stepList}>
                {browserResult.actions.map((st) => (
                  <div key={st.step} style={s.stepItem}>
                    <strong>Step {st.step}</strong> ({st.action_type}): {st.status}
                    <br /><span style={{ color: "#8b949e" }}>Thought: {st.thought}</span>
                    <br /><span style={{ color: "#58a6ff" }}>Action: {st.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Demo ── */}
      {tab === "demo" && <Demo />}

      {/* ── Help ── */}
      {tab === "help" && (
        <>
          <div style={s.card}><div style={s.hTitle}>What is this?</div><div style={s.hText}>UI-TARS MCP gives AI agents eyes and hands on your desktop and browser. Desktop control via screenshots + VLM grounding. Browser control via headless Chromium + Playwright. All through standard MCP tools.</div></div>
          <div style={s.card}>
            <div style={s.hTitle}>Desktop Tools</div>
            <table style={s.tTable}><thead><tr><th style={s.tTh}>Tool</th><th style={s.tTh}>What</th><th style={s.tTh}>Example</th></tr></thead><tbody>
              <tr><td style={s.tTd}><code style={s.code}>uitars_execute</code></td><td style={s.tTd}>GUI task via VLM grounding</td><td style={s.tTd}><code style={s.code}>uitars_execute(task="Open Notepad")</code></td></tr>
              <tr><td style={s.tTd}><code style={s.code}>uitars_screenshot</code></td><td style={s.tTd}>Desktop screenshot</td><td style={s.tTd}><code style={s.code}>uitars_screenshot()</code></td></tr>
              <tr><td style={s.tTd}><code style={s.code}>uitars_click</code></td><td style={s.tTd}>Click coordinates</td><td style={s.tTd}><code style={s.code}>uitars_click(x=500,y=300)</code></td></tr>
              <tr><td style={s.tTd}><code style={s.code}>uitars_type</code></td><td style={s.tTd}>Type text</td><td style={s.tTd}><code style={s.code}>uitars_type(text="hello")</code></td></tr>
            </tbody></table>
          </div>
          <div style={s.card}>
            <div style={s.hTitle}>Browser Tools</div>
            <table style={s.tTable}><thead><tr><th style={s.tTh}>Tool</th><th style={s.tTh}>What</th><th style={s.tTh}>Example</th></tr></thead><tbody>
              <tr><td style={s.tTd}><code style={s.code}>uitars_browser_navigate</code></td><td style={s.tTd}>Go to URL, return page screenshot</td><td style={s.tTd}><code style={s.code}>uitars_browser_navigate(url="https://github.com")</code></td></tr>
              <tr><td style={s.tTd}><code style={s.code}>uitars_browser_execute</code></td><td style={s.tTd}>Browser task via VLM grounding</td><td style={s.tTd}><code style={s.code}>uitars_browser_execute(task="Search Python")</code></td></tr>
              <tr><td style={s.tTd}><code style={s.code}>uitars_browser_close</code></td><td style={s.tTd}>Close browser, free resources</td><td style={s.tTd}><code style={s.code}>uitars_browser_close()</code></td></tr>
            </tbody></table>
          </div>
          <div style={s.card}><div style={s.hTitle}>Docs</div><div style={s.hText}>
            <a href="https://github.com/sandraschi/uitars-mcp" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>README</a> | <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/install.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Install</a> | <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/configuration.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Config</a> | <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/tools-reference.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Tools</a> | <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/safety.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Safety</a>
          </div></div>
          <div style={s.card}><div style={s.hTitle}>Safety</div><div style={s.hText}><strong>Emergency stop:</strong> Move mouse to corner (0,0) — triggers failsafe abort.<br /><strong>Privacy:</strong> Local models keep screenshots on your machine.<br /><strong>Browser:</strong> Runs in headless Chromium — no visible window, isolated session.</div></div>
        </>
      )}

      <div style={s.foot}>UI-TARS MCP v0.2.0 — Ports 10976/10977 — Desktop + Browser Agent</div>
    </div>
  );
}

export default App;
