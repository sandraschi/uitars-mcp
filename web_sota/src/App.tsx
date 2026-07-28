import { HashRouter, useRouter } from "./router";
import { Sidebar } from "./layout/Sidebar";
import FloatingChat from "./components/FloatingChat";
import { Topbar } from "./layout/Topbar";
import { LoggerPanel } from "./layout/LoggerPanel";
import { Dashboard } from "./pages/Dashboard";
import { DesktopPage } from "./pages/DesktopPage";
import { BrowserPage } from "./pages/BrowserPage";
import { Demo } from "./Demo";
import { HelpPage } from "./pages/HelpPage";
import Logging from "./pages/Logging";

function Shell() {
  const { page } = useRouter();

  const s = {
    root: { display: "flex", flexDirection: "column" as const, height: "100vh", background: "#0f1115", color: "#e1e4e8" },
    body: { display: "flex", flex: 1, overflow: "hidden" },
    main: { flex: 1, overflow: "auto" },
  };

  const render = () => {
    switch (page) {
      case "home": return <Dashboard />;
      case "desktop": return <DesktopPage />;
      case "browser": return <BrowserPage />;
      case "demo": return <Demo />;
  case "help": return <HelpPage />;
  case "logs": return <Logging />;
  default: return <Dashboard />;
    }
  };

  return (
    <div style={s.root}>
      <Topbar />
      <div style={s.body}>
        <Sidebar />
        <main style={s.main}>{render()}</main>
      </div>
      <LoggerPanel />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
      <FloatingChat />
    </HashRouter>
  );
}
