import { useState, useEffect, useCallback } from "react";

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

type Tab = "control" | "help";

const API = "/api";

function App() {
  const [tab, setTab] = useState<Tab>("control");
  const [backendOk, setBackendOk] = useState(false);
  const [vlmStatus, setVlmStatus] = useState<VLMStatus | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<TaskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    try {
      const res = await fetch(`${API}/health`);
      if (res.ok) setBackendOk(true);
    } catch {
      setBackendOk(false);
    }
  }, []);

  const checkVLM = useCallback(async () => {
    try {
      const res = await fetch(`${API}/status`);
      const data = await res.json();
      setVlmStatus(data.vlm);
    } catch {
      setVlmStatus(null);
    }
  }, []);

  const refreshScreenshot = useCallback(async () => {
    try {
      const res = await fetch(`${API}/screenshot`);
      const data = await res.json();
      if (data.success) setScreenshot(data.image_base64);
    } catch {}
  }, []);

  useEffect(() => {
    checkHealth();
    checkVLM();
    refreshScreenshot();
    const interval = setInterval(() => { checkHealth(); checkVLM(); }, 10000);
    return () => clearInterval(interval);
  }, [checkHealth, checkVLM]);

  const executeTask = async () => {
    if (!task.trim()) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: task.trim() }),
      });
      const data = await res.json();
      setResult(data);
      refreshScreenshot();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Execution failed");
    } finally {
      setRunning(false);
    }
  };

  const s = {
    container: { display: "flex", flexDirection: "column" as const, minHeight: "100vh", padding: "24px", maxWidth: "1200px", margin: "0 auto", width: "100%" },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderBottom: "1px solid #21262d", marginBottom: "24px" },
    title: { fontSize: "22px", fontWeight: 600, color: "#f0f6fc" },
    tabs: { display: "flex", gap: "4px" },
    tab: (_tab: Tab) => ({
      padding: "8px 16px", background: tab === _tab ? "#1f2937" : "transparent",
      color: tab === _tab ? "#f0f6fc" : "#8b949e", border: "none", borderRadius: "6px",
      cursor: "pointer", fontSize: "14px", fontWeight: 500,
    }),
    statusRow: { display: "flex", gap: "12px", marginBottom: "24px" },
    badge: (ok: boolean) => ({
      padding: "4px 12px", borderRadius: "12px", fontSize: "13px", fontWeight: 500,
      background: ok ? "#0d3320" : "#3d1f1f", color: ok ? "#3fb950" : "#f85149",
      border: `1px solid ${ok ? "#238636" : "#da3633"}`,
    }),
    card: { background: "#161b22", border: "1px solid #21262d", borderRadius: "8px", padding: "20px", marginBottom: "16px" },
    inputRow: { display: "flex", gap: "8px" },
    input: { flex: 1, padding: "10px 14px", background: "#0d1117", border: "1px solid #30363d", borderRadius: "6px", color: "#c9d1d9", fontSize: "14px", outline: "none" },
    btn: (disabled: boolean) => ({
      padding: "10px 24px", background: disabled ? "#21262d" : "#238636", color: disabled ? "#484f58" : "#fff",
      border: "none", borderRadius: "6px", cursor: disabled ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap" as const,
    }),
    btnSecondary: { padding: "8px 16px", background: "#21262d", color: "#c9d1d9", border: "1px solid #30363d", borderRadius: "6px", cursor: "pointer", fontSize: "13px" },
    screenshotArea: { background: "#0d1117", border: "1px solid #30363d", borderRadius: "8px", padding: "12px", marginBottom: "16px", maxHeight: "400px", overflow: "auto" },
    img: { maxWidth: "100%", borderRadius: "4px", display: "block" },
    stepsList: { maxHeight: "300px", overflow: "auto" },
    stepItem: { padding: "10px 0", borderBottom: "1px solid #21262d", fontSize: "13px" },
    label: { fontSize: "14px", fontWeight: 600, color: "#8b949e", marginBottom: "8px" },
    foot: { marginTop: "auto", padding: "16px 0", fontSize: "12px", color: "#484f58" },
    code: { background: "#0d1117", border: "1px solid #30363d", borderRadius: "4px", padding: "2px 6px", fontFamily: "monospace", fontSize: "12px", color: "#58a6ff" },
    helpSection: { marginBottom: "20px" },
    helpTitle: { fontSize: "16px", fontWeight: 600, color: "#f0f6fc", marginBottom: "8px" },
    helpText: { fontSize: "13px", color: "#8b949e", lineHeight: "1.6" },
    toolTable: { width: "100%", borderCollapse: "collapse" as const, fontSize: "13px" },
    toolTh: { textAlign: "left" as const, padding: "8px 12px", borderBottom: "1px solid #21262d", color: "#8b949e", fontWeight: 600 },
    toolTd: { padding: "8px 12px", borderBottom: "1px solid #21262d", color: "#c9d1d9", verticalAlign: "top" as const },
  };

  return (
    <div style={s.container}>
      <div style={s.header}>
        <div style={s.title}>UI-TARS MCP — Desktop Agent</div>
        <div style={s.tabs}>
          <button style={s.tab("control")} onClick={() => setTab("control")}>Control</button>
          <button style={s.tab("help")} onClick={() => setTab("help")}>Help</button>
        </div>
      </div>

      <div style={s.statusRow}>
        <span style={s.badge(backendOk)}>Backend: {backendOk ? "OK" : "DOWN"}</span>
        <span style={s.badge(vlmStatus?.ok ?? false)}>
          VLM: {vlmStatus?.ok ? (vlmStatus?.configured_model ?? "OK") : vlmStatus?.error ?? "DOWN"}
        </span>
      </div>

      {tab === "control" && (
        <>
          <div style={s.card}>
            <div style={s.label}>Task</div>
            <div style={s.inputRow}>
              <input style={s.input} type="text" placeholder='e.g. Open Notepad and type "hello world"'
                value={task} onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !running && executeTask()} disabled={running} />
              <button style={s.btn(running || !task.trim())} onClick={executeTask} disabled={running || !task.trim()}>
                {running ? "Running..." : "Execute"}
              </button>
            </div>
          </div>

          {screenshot && (
            <div style={s.card}>
              <div style={s.label}>Live Desktop</div>
              <div style={s.screenshotArea}>
                <img style={s.img} src={`data:image/png;base64,${screenshot}`} alt="Desktop" />
              </div>
              <button style={{ ...s.btn(false), marginTop: "8px" }} onClick={refreshScreenshot}>Refresh</button>
            </div>
          )}

          {error && <div style={s.card}><div style={{ color: "#f85149" }}>{error}</div></div>}

          {result && (
            <div style={s.card}>
              <div style={s.label}>Result: {result.success ? "Success" : "Failed"} — {result.message}</div>
              <div style={s.stepsList}>
                {result.actions.map((step) => (
                  <div key={step.step} style={s.stepItem}>
                    <strong>Step {step.step}</strong> ({step.action_type}): {step.status}
                    <br /><span style={{ color: "#8b949e" }}>Thought: {step.thought}</span>
                    <br /><span style={{ color: "#58a6ff" }}>Action: {step.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === "help" && (
        <>
          <div style={s.card}>
            <div style={s.helpTitle}>What is this?</div>
            <div style={s.helpText}>
              UI-TARS MCP gives AI agents (Claude, OpenCode, Hermes) eyes and hands on your desktop.
              It takes screenshots, feeds them to a vision-language model, and executes mouse/keyboard
              actions — all through standard MCP tools.
            </div>
          </div>

          <div style={s.card}>
            <div style={s.helpTitle}>MCP Tools</div>
            <table style={s.toolTable}>
              <thead>
                <tr>
                  <th style={s.toolTh}>Tool</th>
                  <th style={s.toolTh}>What it does</th>
                  <th style={s.toolTh}>Example</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={s.toolTd}><code style={s.code}>uitars_execute</code></td>
                  <td style={s.toolTd}>Execute a GUI task end-to-end using visual grounding</td>
                  <td style={s.toolTd}><code style={s.code}>uitars_execute(task="Open Notepad")</code></td>
                </tr>
                <tr>
                  <td style={s.toolTd}><code style={s.code}>uitars_screenshot</code></td>
                  <td style={s.toolTd}>Capture current desktop as base64 PNG</td>
                  <td style={s.toolTd}><code style={s.code}>uitars_screenshot()</code></td>
                </tr>
                <tr>
                  <td style={s.toolTd}><code style={s.code}>uitars_click</code></td>
                  <td style={s.toolTd}>Click at screen coordinates</td>
                  <td style={s.toolTd}><code style={s.code}>uitars_click(x=500, y=300)</code></td>
                </tr>
                <tr>
                  <td style={s.toolTd}><code style={s.code}>uitars_type</code></td>
                  <td style={s.toolTd}>Type text at keyboard focus</td>
                  <td style={s.toolTd}><code style={s.code}>uitars_type(text="hello")</code></td>
                </tr>
                <tr>
                  <td style={s.toolTd}><code style={s.code}>uitars_help</code></td>
                  <td style={s.toolTd}>Get inline help, examples, and config</td>
                  <td style={s.toolTd}><code style={s.code}>uitars_help()</code></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={s.card}>
            <div style={s.helpTitle}>Example Tasks</div>
            <div style={s.helpText}>
              <div style={{ marginBottom: "8px" }}>• <strong>Open an app:</strong> <code style={s.code}>uitars_execute(task="Open Calculator")</code></div>
              <div style={{ marginBottom: "8px" }}>• <strong>Navigate web:</strong> <code style={s.code}>uitars_execute(task="Open Chrome, go to github.com")</code></div>
              <div style={{ marginBottom: "8px" }}>• <strong>Take screenshot:</strong> <code style={s.code}>uitars_screenshot()</code></div>
              <div style={{ marginBottom: "8px" }}>• <strong>Fill a form:</strong> <code style={s.code}>uitars_click(x=400,y=300)</code> then <code style={s.code}>uitars_type(text="email")</code></div>
            </div>
          </div>

          <div style={s.card}>
            <div style={s.helpTitle}>Docs</div>
            <div style={s.helpText}>
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/README.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>README.md</a> — overview and quick start<br />
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/install.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Installation</a> — prerequisites and setup<br />
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/configuration.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Configuration</a> — env vars and VLM providers<br />
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/tools-reference.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Tools Reference</a> — full API docs<br />
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/architecture.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Architecture</a> — internals and data flow<br />
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/safety.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Safety</a> — fail-safe and privacy<br />
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/troubleshooting.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Troubleshooting</a> — common fixes<br />
              <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/integration-guide.md" target="_blank" rel="noopener" style={{ color: "#58a6ff" }}>Integration Guide</a> — Claude Desktop, fleet, REST API
            </div>
          </div>

          <div style={s.card}>
            <div style={s.helpTitle}>Safety</div>
            <div style={s.helpText}>
              <strong>Emergency stop:</strong> Move mouse to screen corner (0,0) — triggers failsafe abort.<br />
              <strong>Privacy:</strong> With local models (Ollama), screenshots never leave your machine.<br />
              <strong>Step limit:</strong> Default 15 actions per task — prevents infinite loops.
            </div>
          </div>
        </>
      )}

      <div style={s.foot}>
        UI-TARS MCP v0.1.0 — Ports 10976/10977 — Powered by UI-TARS vision-language models
      </div>
    </div>
  );
}

export default App;
