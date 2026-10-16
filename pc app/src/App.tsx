import * as React from "react";
import { SanctumHome } from "./routes/SanctumHome";

const WorkspaceShell = React.lazy(() =>
  import("./WorkspaceShell").then((m) => ({ default: m.WorkspaceShell })),
);

let workspacePreloadPromise: Promise<void> | null = null;
function preloadWorkspaceBundle(): Promise<void> {
  if (!workspacePreloadPromise) {
    workspacePreloadPromise = import("./WorkspaceShell").then(() => undefined);
  }
  return workspacePreloadPromise;
}

export function App() {
  const [currentPath, setCurrentPath] = React.useState<string>(() => {
    if (typeof window !== "undefined") {
      return window.location.pathname || "/";
    }
    return "/";
  });

  const [enteredRoom, setEnteredRoom] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname || "/";
      if (p !== "/" && p !== "/home") {
        return true;
      }
    }
    return false;
  });

  React.useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname || "/";
      setCurrentPath(p);
      if (p === "/home") {
        setEnteredRoom(false);
      } else if (p !== "/") {
        setEnteredRoom(true);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = React.useCallback((href: string) => {
    setCurrentPath(href);
    if (typeof window !== "undefined") {
      window.history.pushState({}, "", href);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // PC App: Only the "Loading Your Room" section of the homepage is visible;
  // all 32 tiny features live inside the Help route (/help).
  if (!enteredRoom || currentPath === "/home") {
    return (
      <SanctumHome
        platformMode="pc"
        preloadWorkspace={preloadWorkspaceBundle}
        onEnterRoom={(targetRoute) => {
          setEnteredRoom(true);
          const nextRoute = targetRoute && targetRoute !== "/home" ? targetRoute : "/library";
          navigate(nextRoute);
        }}
        onOpenFeaturesGuide={() => {
          setEnteredRoom(true);
          navigate("/help");
        }}
      />
    );
  }

  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-[var(--cv-bg)] text-[var(--cv-text)] flex items-center justify-center font-mono text-cv-sm">
          Entering Your Room…
        </div>
      }
    >
      <WorkspaceShell
        currentPath={currentPath}
        onNavigate={(href) => {
          if (href === "/home") {
            setEnteredRoom(false);
          }
          navigate(href);
        }}
        onOpenSanctumHome={() => {
          setEnteredRoom(false);
          navigate("/home");
        }}
        onOpenFeaturesGuide={() => {
          navigate("/help");
        }}
      />
    </React.Suspense>
  );
}

export default App;
