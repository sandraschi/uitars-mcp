export function HelpPage() {
  const s: any = {
    wrap: { padding: "24px" },
    card: { background: "rgba(22,27,34,0.8)", backdropFilter: "blur(8px)", border: "1px solid #21262d", borderRadius: 8, padding: 20, marginBottom: 16 },
    h2: { fontSize: 16, fontWeight: 600, color: "#f0f6fc", marginBottom: 8 },
    p: { fontSize: 13, color: "#8b949e", lineHeight: 1.6 },
    code: { background: "#0d1117", border: "1px solid #30363d", borderRadius: 4, padding: "2px 6px", fontFamily: "monospace", fontSize: 12, color: "#58a6ff" },
    table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
    th: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #21262d", color: "#8b949e", fontWeight: 600 },
    td: { padding: "8px 12px", borderBottom: "1px solid #21262d", color: "#c9d1d9", verticalAlign: "top" },
    a: { color: "#58a6ff" },
  };

  const t = (h: string, b: string, e: string) => (
    <tr><td style={s.td}><code style={s.code}>{h}</code></td><td style={s.td}>{b}</td><td style={s.td}><code style={s.code}>{e}</code></td></tr>
  );

  return (
    <div style={s.wrap}>
      <div style={s.card}><div style={s.h2}>What is this?</div><div style={s.p}>UI-TARS MCP gives AI agents eyes and hands on your desktop and browser. Screenshot → VLM → action. 9 MCP tools.</div></div>

      <div style={s.card}>
        <div style={s.h2}>Desktop Tools</div>
        <table style={s.table}><thead><tr><th style={s.th}>Tool</th><th style={s.th}>What</th><th style={s.th}>Example</th></tr></thead><tbody>
          {t("uitars_execute", "GUI task via VLM grounding", 'uitars_execute(task="Open Notepad")')}
          {t("uitars_screenshot", "Desktop screenshot", "uitars_screenshot()")}
          {t("uitars_click", "Click coordinates", "uitars_click(x=500,y=300)")}
          {t("uitars_type", "Type text", 'uitars_type(text="hello")')}
        </tbody></table>
      </div>

      <div style={s.card}>
        <div style={s.h2}>Browser Tools</div>
        <table style={s.table}><thead><tr><th style={s.th}>Tool</th><th style={s.th}>What</th><th style={s.th}>Example</th></tr></thead><tbody>
          {t("uitars_browser_navigate", "Go to URL, return screenshot", 'uitars_browser_navigate(url="https://github.com")')}
          {t("uitars_browser_execute", "Browser task via VLM", 'uitars_browser_execute(task="Search Python")')}
          {t("uitars_browser_close", "Close browser", "uitars_browser_close()")}
          {t("uitars_status", "Unified health check", "uitars_status()")}
          {t("uitars_help", "Inline help + config", "uitars_help()")}
        </tbody></table>
      </div>

      <div style={s.card}><div style={s.h2}>Docs</div><div style={s.p}>
        <a href="https://github.com/sandraschi/uitars-mcp" target="_blank" rel="noopener" style={s.a}>README</a>{" | "}
        <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/install.md" target="_blank" rel="noopener" style={s.a}>Install</a>{" | "}
        <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/configuration.md" target="_blank" rel="noopener" style={s.a}>Config</a>{" | "}
        <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/tools-reference.md" target="_blank" rel="noopener" style={s.a}>Tools</a>{" | "}
        <a href="https://github.com/sandraschi/uitars-mcp/blob/main/docs/safety.md" target="_blank" rel="noopener" style={s.a}>Safety</a>
      </div></div>
    </div>
  );
}
