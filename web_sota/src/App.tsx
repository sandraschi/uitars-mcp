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

const API = "/api";

function App() {
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
      if (res.ok) {
        setBackendOk(true);
      }
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
      if (data.success) {
        setScreenshot(data.image_base64);
      }
    } catch {
      // screenshot may fail if no display
    }
  }, []);

  useEffect(() => {
    checkHealth();
    checkVLM();
    refreshScreenshot();
    const interval = setInterval(() => {
      checkHealth();
      checkVLM();
    }, 10000);
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

  const styles = {
    container: {
      display: "flex",
      flexDirection: "column" as const,
      minHeight: "100vh",
      padding: "24px",
      maxWidth: "1200px",
      margin: "0 auto",
      width: "100%",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 0",
      borderBottom: "1px solid #21262d",
      marginBottom: "24px",
    },
    title: { fontSize: "22px", fontWeight: 600, color: "#f0f6fc" },
    statusRow: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
    },
    badge: (ok: boolean) => ({
      padding: "4px 12px",
      borderRadius: "12px",
      fontSize: "13px",
      fontWeight: 500,
      background: ok ? "#0d3320" : "#3d1f1f",
      color: ok ? "#3fb950" : "#f85149",
      border: `1px solid ${ok ? "#238636" : "#da3633"}`,
    }),
    card: {
      background: "#161b22",
      border: "1px solid #21262d",
      borderRadius: "8px",
      padding: "20px",
      marginBottom: "16px",
    },
    inputRow: {
      display: "flex",
      gap: "8px",
    },
    input: {
      flex: 1,
      padding: "10px 14px",
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: "6px",
      color: "#c9d1d9",
      fontSize: "14px",
      outline: "none",
    },
    btn: (disabled: boolean) => ({
      padding: "10px 24px",
      background: disabled ? "#21262d" : "#238636",
      color: disabled ? "#484f58" : "#ffffff",
      border: "none",
      borderRadius: "6px",
      cursor: disabled ? "not-allowed" : "pointer",
      fontSize: "14px",
      fontWeight: 500,
      whiteSpace: "nowrap" as const,
    }),
    screenshotArea: {
      background: "#0d1117",
      border: "1px solid #30363d",
      borderRadius: "8px",
      padding: "12px",
      marginBottom: "16px",
      maxHeight: "400px",
      overflow: "auto",
    },
    img: {
      maxWidth: "100%",
      borderRadius: "4px",
      display: "block",
    },
    stepsList: {
      maxHeight: "300px",
      overflow: "auto",
    },
    stepItem: {
      padding: "10px 0",
      borderBottom: "1px solid #21262d",
      fontSize: "13px",
    },
    label: {
      fontSize: "14px",
      fontWeight: 600,
      color: "#8b949e",
      marginBottom: "8px",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>UI-TARS MCP — Desktop Agent</div>
      </div>

      <div style={styles.statusRow}>
        <span style={styles.badge(backendOk)}>
          Backend: {backendOk ? "OK" : "DOWN"}
        </span>
        <span style={styles.badge(vlmStatus?.ok ?? false)}>
          VLM: {vlmStatus?.ok ? (vlmStatus?.configured_model ?? "OK") : vlmStatus?.error ?? "DOWN"}
        </span>
      </div>

      <div style={styles.card}>
        <div style={styles.label}>Task</div>
        <div style={styles.inputRow}>
          <input
            style={styles.input}
            type="text"
            placeholder="e.g. Open Notepad and type 'hello world'"
            value={task}
            onChange={(e) => setTask(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !running && executeTask()}
            disabled={running}
          />
          <button
            style={styles.btn(running || !task.trim())}
            onClick={executeTask}
            disabled={running || !task.trim()}
          >
            {running ? "Running..." : "Execute"}
          </button>
        </div>
      </div>

      {screenshot && (
        <div style={styles.card}>
          <div style={styles.label}>Live Desktop</div>
          <div style={styles.screenshotArea}>
            <img
              style={styles.img}
              src={`data:image/png;base64,${screenshot}`}
              alt="Desktop screenshot"
            />
          </div>
          <button
            style={{ ...styles.btn(false), marginTop: "8px" }}
            onClick={refreshScreenshot}
          >
            Refresh
          </button>
        </div>
      )}

      {error && (
        <div style={styles.card}>
          <div style={{ color: "#f85149" }}>{error}</div>
        </div>
      )}

      {result && (
        <div style={styles.card}>
          <div style={styles.label}>
            Result: {result.success ? "Success" : "Failed"} — {result.message}
          </div>
          <div style={styles.stepsList}>
            {result.actions.map((step) => (
              <div key={step.step} style={styles.stepItem}>
                <strong>Step {step.step}</strong> ({step.action_type}): {step.status}
                <br />
                <span style={{ color: "#8b949e" }}>
                  Thought: {step.thought}
                </span>
                <br />
                <span style={{ color: "#58a6ff" }}>
                  Action: {step.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: "auto", padding: "16px 0", fontSize: "12px", color: "#484f58" }}>
        UI-TARS MCP v0.1.0 — Ports 10976/10977 — Powered by UI-TARS vision-language models
      </div>
    </div>
  );
}

export default App;
