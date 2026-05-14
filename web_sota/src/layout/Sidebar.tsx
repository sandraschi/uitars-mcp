import { useState } from "react";
import { useRouter } from "../router";

const NAV = [
  { id: "home", label: "Home", icon: "⌂" },
  { id: "desktop", label: "Desktop", icon: "⊡" },
  { id: "browser", label: "Browser", icon: "◎" },
  { id: "demo", label: "Demo", icon: "◉" },
  { id: "help", label: "Help", icon: "?" },
] as const;

export function Sidebar() {
  const { page, navigate } = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const s = {
    aside: {
      width: collapsed ? 48 : 200,
      minWidth: collapsed ? 48 : 200,
      background: "#0d1117",
      borderRight: "1px solid #21262d",
      display: "flex",
      flexDirection: "column" as const,
      transition: "width 0.2s ease",
      overflow: "hidden",
      zIndex: 40,
    },
    header: {
      padding: "16px 12px",
      borderBottom: "1px solid #21262d",
      display: "flex",
      alignItems: "center",
      justifyContent: collapsed ? "center" : "space-between",
    },
    logo: { fontSize: collapsed ? 14 : 16, fontWeight: 700, color: "#58a6ff", whiteSpace: "nowrap" as const },
    toggle: {
      background: "none", border: "none", color: "#8b949e", cursor: "pointer", fontSize: 14, padding: "2px 6px",
    },
    nav: { flex: 1, padding: "8px" },
    item: {
      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6,
      cursor: "pointer", fontSize: 13, color: "#8b949e", marginBottom: 2,
      transition: "background 0.15s", whiteSpace: "nowrap" as const, overflow: "hidden",
    },
    itemActive: { background: "#1f2937", color: "#f0f6fc", fontWeight: 600 },
    icon: { fontSize: 14, width: 16, textAlign: "center" as const, flexShrink: 0 },
    label: { overflow: "hidden", textOverflow: "ellipsis" },
  };

  return (
    <aside style={s.aside}>
      <div style={s.header}>
        {!collapsed && <div style={s.logo}>UI-TARS</div>}
        <button
          style={s.toggle}
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? "▶" : "◀"}
        </button>
      </div>
      <nav style={s.nav}>
        {NAV.map((item) => (
          <div
            key={item.id}
            style={{ ...s.item, ...(page === item.id ? s.itemActive : {}) }}
            onClick={() => navigate(item.id as typeof page)}
            title={item.label}
          >
            <span style={s.icon}>{item.icon}</span>
            {!collapsed && <span style={s.label}>{item.label}</span>}
          </div>
        ))}
      </nav>
    </aside>
  );
}
