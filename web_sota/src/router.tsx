import { useState, useEffect, useCallback, createContext, useContext } from "react";

type Page = "home" | "desktop" | "browser" | "demo" | "help";

interface RouterCtx {
  page: Page;
  navigate: (p: Page) => void;
}

const RouterContext = createContext<RouterCtx>({ page: "home", navigate: () => {} });

export function useRouter() {
  return useContext(RouterContext);
}

export function HashRouter({ children }: { children: React.ReactNode }) {
  const [page, setPage] = useState<Page>(() => {
    const hash = window.location.hash.replace("#/", "") as Page;
    return hash && ["home", "desktop", "browser", "demo", "help"].includes(hash) ? hash : "home";
  });

  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash.replace("#/", "") as Page;
      if (["home", "desktop", "browser", "demo", "help"].includes(hash)) {
        setPage(hash);
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const navigate = useCallback((p: Page) => {
    window.location.hash = `#/${p}`;
  }, []);

  return (
    <RouterContext.Provider value={{ page, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
