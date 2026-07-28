import { useEffect, useState } from "react";

interface Status {
  backendOk: boolean;
  vlmModel: string | null;
  vlmOk: boolean;
  version: string;
}

export function Topbar() {
  const [status, setStatus] = useState<Status>({
    backendOk: false,
    vlmModel: null,
    vlmOk: false,
    version: "",
  });

  useEffect(() => {
    const check = async () => {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);

      try {
        const h = await fetch("/api/health", { signal: ctrl.signal });
        clearTimeout(timer);
        if (h.ok) {
          const d = await h.json();
          setStatus((s) => ({ ...s, backendOk: true, version: d.version || "" }));
        }
      } catch { setStatus((s) => ({ ...s, backendOk: false })); }

      try {
        const s = await fetch("/api/status", { signal: AbortSignal.timeout(5000) });
        if (s.ok) {
          const d = await s.json();
          setStatus((prev) => ({
            ...prev,
            vlmOk: d.vlm?.ok ?? false,
            vlmModel: d.vlm?.configured_model ?? null,
          }));
        }
      } catch { setStatus((prev) => ({ ...prev, vlmOk: false })); }
    };
    check();
    const i = setInterval(check, 15000);
    return () => clearInterval(i);
  }, []);

  const s = {
    topbar: {
      height: 48, minHeight: 48, display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 20px",
      background: "rgba(13,17,23,0.95)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #21262d", zIndex: 30,
    },
    title: { fontSize: 16, fontWeight: 600, color: "#f0f6fc" },
    info: { display: "flex", alignItems: "center", gap: 12 },
    badges: { display: "flex", gap: 8, alignItems: "center" },
    badge: (ok: boolean) => ({
      padding: "3px 10px", borderRadius: 10, fontSize: 11, fontWeight: 500,
      background: ok ? "rgba(35,134,54,0.2)" : "rgba(248,81,73,0.2)",
      color: ok ? "#3fb950" : "#f85149", border: `1px solid ${ok ? "#238636" : "#da3633"}`,
    }),
    model: { fontSize: 11, color: "#8b949e" },
  };

  return (
    <header style={s.topbar}>
      <div style={s.info}>
        <div style={s.title}>UI-TARS MCP</div>
        <span style={{ fontSize: 10, color: "#484f58" }}>10976/10977</span>
      </div>
      <div style={s.badges}>
        {status.vlmModel && <span style={s.model}>{status.vlmModel}</span>}
        <span style={s.badge(status.vlmOk)}>VLM</span>
        <span style={s.badge(status.backendOk)}>API</span>
      </div>
    </header>
  );
}
