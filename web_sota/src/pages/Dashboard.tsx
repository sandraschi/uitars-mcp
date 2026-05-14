import { useRouter } from "../router";

interface CardProps {
  title: string;
  desc: string;
  page: string;
  icon: string;
}

function Card({ title, desc, page, icon }: CardProps) {
  const { navigate } = useRouter();

  const s = {
    card: {
      background: "rgba(22,27,34,0.8)", backdropFilter: "blur(8px)",
      border: "1px solid #21262d", borderRadius: 8, padding: 20, cursor: "pointer",
      transition: "border-color 0.2s, transform 0.15s",
    },
    icon: { fontSize: 24, marginBottom: 10 },
    title: { fontSize: 15, fontWeight: 600, color: "#f0f6fc", marginBottom: 6 },
    desc: { fontSize: 12, color: "#8b949e", lineHeight: 1.5 },
  };

  return (
    <div style={s.card} onClick={() => navigate(page as any)} onMouseEnter={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = "#58a6ff";
    }} onMouseLeave={(e) => {
      (e.currentTarget as HTMLElement).style.borderColor = "#21262d";
    }}>
      <div style={s.icon}>{icon}</div>
      <div style={s.title}>{title}</div>
      <div style={s.desc}>{desc}</div>
    </div>
  );
}

export function Dashboard() {
  const s = {
    wrap: { padding: "24px" },
    hero: {
      background: "linear-gradient(135deg, rgba(26,26,46,0.9) 0%, rgba(22,33,62,0.9) 50%, rgba(15,52,96,0.9) 100%)",
      backdropFilter: "blur(12px)", borderRadius: 12, padding: "32px 40px", marginBottom: 24,
      border: "1px solid rgba(26,58,92,0.5)",
    },
    heroTitle: { fontSize: 24, fontWeight: 700, color: "#f0f6fc", marginBottom: 8 },
    heroSub: { fontSize: 14, color: "#8b949e", lineHeight: 1.6, maxWidth: 560 },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.hero}>
        <div style={s.heroTitle}>Desktop + Browser Agent</div>
        <div style={s.heroSub}>
          VLM-powered GUI automation. Screenshot → vision model → mouse/keyboard/Playwright actions.
          9 MCP tools. Provider-agnostic. Fits RTX 4090.
        </div>
      </div>
      <div style={s.grid}>
        <Card icon="⊡" title="Desktop Control" desc="Open apps, click buttons, type text — any visible UI. Visual grounding adapts to layout changes." page="desktop" />
        <Card icon="◎" title="Browser Automation" desc="Headless Chromium via Playwright. Navigate, fill forms, extract data. Hybrid visual+DOM." page="browser" />
        <Card icon="◉" title="Demo" desc="See how it works. Flow diagram, feature cards, example tasks your agent can execute." page="demo" />
        <Card icon="?" title="Help & Docs" desc="MCP tools reference, installation guide, configuration, safety, troubleshooting." page="help" />
      </div>
    </div>
  );
}
