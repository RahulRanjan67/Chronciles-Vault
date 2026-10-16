import * as React from "react";
import { WifiOff, CheckCircle2, Smartphone } from "lucide-react";
import { isCapacitorNative, getCapacitorPlatform } from "../../native/capacitor-bridge";

/**
 * Displays live offline/online status, Service Worker cache readiness,
 * and Capacitor native shell indicator in the global header bar.
 */
export function OfflineStatusBadge() {
  const [isOnline, setIsOnline] = React.useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  const [swReady, setSwReady] = React.useState<boolean>(false);
  const isNative = isCapacitorNative();
  const platform = getCapacitorPlatform();

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then(() => setSwReady(true))
        .catch(() => setSwReady(false));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        title="You are offline. Local shelf files, reading progress, memories, and vault remain 100% available."
        className="inline-flex items-center gap-1.5 rounded-cv-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300"
      >
        <WifiOff className="h-3 w-3 shrink-0 text-amber-400" />
        <span>Offline Mode</span>
      </div>
    );
  }

  if (isNative) {
    return (
      <div
        role="status"
        title={`Running inside Capacitor (${platform}) native shell — Curated Mobile Mode (ADR-009)`}
        className="hidden sm:inline-flex items-center gap-1.5 rounded-cv-full border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 py-1 text-[11px] font-mono text-[var(--cv-text-muted)]"
      >
        <Smartphone className="h-3 w-3 shrink-0 text-[var(--cv-accent-strong)]" />
        <span className="uppercase">{platform}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      title={
        swReady
          ? "Local-first storage & Service Worker active — ready for offline reading"
          : "Local-first storage active"
      }
      className="hidden lg:inline-flex items-center gap-1.5 rounded-cv-full border border-[var(--cv-border)] bg-[var(--cv-surface)]/70 px-2.5 py-1 text-[11px] text-[var(--cv-text-muted)]"
    >
      <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
      <span>{swReady ? "Offline Ready" : "Local Vault"}</span>
    </div>
  );
}
