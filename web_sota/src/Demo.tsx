export function Demo() {
  const s = {
    container: { padding: "0" },
    hero: {
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      borderRadius: "12px",
      padding: "40px",
      marginBottom: "24px",
      border: "1px solid #1a3a5c",
    },
    heroTitle: { fontSize: "28px", fontWeight: 700, color: "#f0f6fc", marginBottom: "12px" },
    heroSub: { fontSize: "15px", color: "#8b949e", lineHeight: "1.6", maxWidth: "600px" },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", marginBottom: "24px" },
    card: {
      background: "#161b22", border: "1px solid #21262d", borderRadius: "8px", padding: "24px",
      transition: "border-color 0.2s",
    },
    cardIcon: { fontSize: "24px", marginBottom: "12px" },
    cardTitle: { fontSize: "16px", fontWeight: 600, color: "#f0f6fc", marginBottom: "8px" },
    cardText: { fontSize: "13px", color: "#8b949e", lineHeight: "1.6" },
    code: {
      background: "#0d1117", border: "1px solid #30363d", borderRadius: "4px",
      padding: "2px 6px", fontFamily: "monospace", fontSize: "12px", color: "#58a6ff",
    },
    flow: {
      display: "flex", alignItems: "center", gap: "12px", padding: "20px",
      background: "#0d1117", borderRadius: "8px", border: "1px solid #21262d",
      marginBottom: "24px", flexWrap: "wrap" as const, justifyContent: "center",
    },
    flowStep: {
      padding: "10px 18px", background: "#161b22", borderRadius: "6px",
      border: "1px solid #30363d", fontSize: "13px", color: "#c9d1d9",
      textAlign: "center" as const, minWidth: "100px",
    },
    flowArrow: { color: "#58a6ff", fontSize: "18px", fontWeight: 700 },
    section: { marginBottom: "24px" },
    sectionTitle: { fontSize: "18px", fontWeight: 600, color: "#f0f6fc", marginBottom: "16px" },
    table: { width: "100%", borderCollapse: "collapse" as const, fontSize: "13px" },
    th: { textAlign: "left" as const, padding: "10px 14px", borderBottom: "1px solid #21262d", color: "#8b949e", fontWeight: 600 },
    td: { padding: "10px 14px", borderBottom: "1px solid #21262d", color: "#c9d1d9" },
  };

  return (
    <div style={s.container}>
      {/* Hero */}
      <div style={s.hero}>
        <div style={s.heroTitle}>Give your AI agent eyes and hands</div>
        <div style={s.heroSub}>
          uitars-mcp turns natural language into desktop and browser actions. Your agent sees the screen,
          reasons about what to do, and executes — all through standard MCP tools. No brittle element selectors.
          No scripted hotkeys. Just screenshot → VLM → action.
        </div>
      </div>

      {/* How it works */}
      <div style={s.flow}>
        <div style={s.flowStep}>"Open Notepad,<br />type hello"</div>
        <div style={s.flowArrow}>→</div>
        <div style={s.flowStep}>Screenshot<br />desktop</div>
        <div style={s.flowArrow}>→</div>
        <div style={s.flowStep}>VLM sees<br />desktop</div>
        <div style={s.flowArrow}>→</div>
        <div style={s.flowStep}>VLM outputs<br /><code style={s.code}>click(100,200)</code></div>
        <div style={s.flowArrow}>→</div>
        <div style={s.flowStep}>pyautogui<br />clicks</div>
        <div style={s.flowArrow}>→</div>
        <div style={s.flowStep}>Notepad opens,<br />text appears</div>
      </div>

      {/* Feature cards */}
      <div style={s.grid}>
        <div style={s.card}>
          <div style={s.cardIcon}>&#x1f5a5;&#xfe0f;</div>
          <div style={s.cardTitle}>Desktop Automation</div>
          <div style={s.cardText}>
            Control any application with a visible UI — browsers, editors, settings panels, games.
            VLM understands layout, so it adapts to UI changes.
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardIcon}>&#x1f310;</div>
          <div style={s.cardTitle}>Browser Automation</div>
          <div style={s.cardText}>
            Headless Chromium via Playwright. Navigate pages, fill forms, click buttons, extract data.
            Hybrid visual+DOM approach for reliability.
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardIcon}>&#x1f512;</div>
          <div style={s.cardTitle}>100% Local Option</div>
          <div style={s.cardText}>
            Run Ollama + qwen2.5-vl:7b locally (~5.5 GB VRAM). Screenshots never leave your machine.
            No cloud API, no data exfiltration.
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardIcon}>&#x1f527;</div>
          <div style={s.cardTitle}>9 MCP Tools</div>
          <div style={s.cardText}>
            <code style={s.code}>uitars_execute</code>, <code style={s.code}>uitars_screenshot</code>,{' '}
            <code style={s.code}>uitars_click</code>, <code style={s.code}>uitars_type</code>,{' '}
            <code style={s.code}>uitars_browser_navigate</code>, <code style={s.code}>uitars_browser_execute</code>,{' '}
            <code style={s.code}>uitars_browser_close</code>, <code style={s.code}>uitars_status</code>,{' '}
            <code style={s.code}>uitars_help</code>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardIcon}>&#x26a1;</div>
          <div style={s.cardTitle}>Fleet-Ready</div>
          <div style={s.cardText}>
            FastMCP 3.2 HTTP transport. Registered on ports 10976/10977.
            Pre-commit hooks. CI/CD via GitHub Actions. robofang.json manifest.
            31 tests passing.
          </div>
        </div>
        <div style={s.card}>
          <div style={s.cardIcon}>&#x1f4e6;</div>
          <div style={s.cardTitle}>Provider Agnostic</div>
          <div style={s.cardText}>
            Any OpenAI-compatible VLM endpoint. Ollama, vLLM, OpenAI, LiteLLM proxy.
            Swap models without changing code.
          </div>
        </div>
      </div>

      {/* Example tasks */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Example Tasks Your Agent Can Do</div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Task</th>
              <th style={s.th}>Surface</th>
              <th style={s.th}>MCP Call</th>
              <th style={s.th}>What Happens</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={s.td}>Open VS Code settings, enable autosave</td>
              <td style={s.td}>Desktop</td>
              <td style={s.td}><code style={s.code}>uitars_execute(task="...")</code></td>
              <td style={s.td}>Screenshot → VLM spots Settings gear → clicks → types → toggles</td>
            </tr>
            <tr>
              <td style={s.td}>Search GitHub for "UI-TARS" repos</td>
              <td style={s.td}>Browser</td>
              <td style={s.td}><code style={s.code}>uitars_browser_execute(task="...", start_url="github.com")</code></td>
              <td style={s.td}>Navigates to GitHub → types query → clicks search → returns results page</td>
            </tr>
            <tr>
              <td style={s.td}>Take a screenshot for debugging</td>
              <td style={s.td}>Desktop</td>
              <td style={s.td}><code style={s.code}>uitars_screenshot()</code></td>
              <td style={s.td}>Captures full desktop → returns base64 PNG + resolution</td>
            </tr>
            <tr>
              <td style={s.td}>Fill a web form with test data</td>
              <td style={s.td}>Browser</td>
              <td style={s.td}><code style={s.code}>uitars_browser_execute(task="...")</code></td>
              <td style={s.td}>Clicks each field → types values → submits → captures result</td>
            </tr>
            <tr>
              <td style={s.td}>Check system health</td>
              <td style={s.td}>—</td>
              <td style={s.td}><code style={s.code}>uitars_status()</code></td>
              <td style={s.td}>Returns VLM connectivity, browser availability, config summary</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
