import * as React from "react";
import { SanctumHome } from "./routes/SanctumHome";

const WorkspaceShell = React.lazy(() =>
  import("./WorkspaceShell").then((m) => ({ default: m.WorkspaceShell })),
);

const FeaturesGuide = React.lazy(() =>
  import("./routes/FeaturesGuide").then((m) => ({ default: m.FeaturesGuide })),
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

  // Track whether the user has stepped inside their Room during this view
  const [enteredRoom, setEnteredRoom] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const p = window.location.pathname || "/";
      // If user opened a deep link directly (e.g. /library, /return-desk, /work/...), enter room directly
      if (p !== "/" && p !== "/home" && p !== "/features-guide") {
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
      } else if (p !== "/" && p !== "/features-guide") {
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

  // Standalone Feature Encyclopedia Webpage (/features-guide)
  if (currentPath === "/features-guide") {
    return (
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[var(--cv-bg)] text-[var(--cv-text)] flex items-center justify-center font-mono text-cv-sm">
            Opening Complete Feature Encyclopedia…
          </div>
        }
      >
        <FeaturesGuide
          onNavigate={(href) => {
            if (href === "/home" || href === "/") {
              setEnteredRoom(false);
              navigate("/");
            } else {
              setEnteredRoom(true);
              navigate(href);
            }
          }}
          onEnterRoomAndNavigate={(href) => {
            if (href === "/home" || href === "/") {
              setEnteredRoom(false);
              navigate("/");
            } else {
              setEnteredRoom(true);
              navigate(href);
            }
          }}
        />
      </React.Suspense>
    );
  }

  // Instant-Load Sanctum Room Homepage ("Loading Your Room" + Why Better + Popular Sites)
  if (!enteredRoom || currentPath === "/home") {
    return (
      <SanctumHome
        preloadWorkspace={preloadWorkspaceBundle}
        onEnterRoom={(targetRoute) => {
          setEnteredRoom(true);
          const nextRoute = targetRoute && targetRoute !== "/home" ? targetRoute : "/library";
          navigate(nextRoute);
        }}
        onOpenFeaturesGuide={() => {
          navigate("/features-guide");
        }}
      />
    );
  }

  // Full Chronicles Vault Room Workspace
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
          navigate("/features-guide");
        }}
      />
    </React.Suspense>
  );
}

export default App;
