import * as React from "react";
import { ArrowRight, BookOpen, Eye, EyeOff, Sparkles } from "lucide-react";
import {
  Button,
  Cover,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  MemoryCard,
  ProgressAnchor,
  ProgressDisplay,
  SourceHealthIndicator,
  SourceHealthType,
  relativeTime,
  toast,
} from "@chronicles-vault/ui";
import { getMemoryAssetBlob } from "@chronicles-vault/reader";

export interface MemoryRefresherData {
  workId: string;
  title: string;
  coverSrc?: string | null;
  lastProgress: ProgressAnchor;
  lastReadDate: string | Date;
  stoppedReason?: string | null;
  stoppedNote?: string | null;
  bestPath?: {
    id: string;
    label: string;
    kind: string;
    health: SourceHealthType;
  } | null;
  favoritePanel?: {
    fileId: string;
    thumbnailRef: string | null;
    spoilerLevel: "spoiler_free" | "mild" | "minor" | "major";
  } | null;
  memories?: {
    id: string;
    type: "quote" | "note" | "theory" | "reaction" | "bookmark";
    content: string;
    anchorLabel?: string;
    createdAt?: string;
    spoilerLevel: "spoiler_free" | "mild" | "minor" | "major";
  }[];
}

export interface MemoryRefresherDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: MemoryRefresherData | null;
  onContinue: (workId: string, accessPathId?: string) => void;
}

export function MemoryRefresherDrawer({
  open,
  onOpenChange,
  data,
  onContinue,
}: MemoryRefresherDrawerProps) {
  const [spoilerWorkId, setSpoilerWorkId] = React.useState<string | null>(null);
  const [favoritePanelPreview, setFavoritePanelPreview] = React.useState<{
    assetId: string;
    url: string;
  } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    const assetId = data?.favoritePanel
      ? (data.favoritePanel.thumbnailRef ?? data.favoritePanel.fileId)
      : null;
    if (!assetId) {
      setFavoritePanelPreview(null);
      return;
    }
    setFavoritePanelPreview(null);
    void getMemoryAssetBlob(assetId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setFavoritePanelPreview({ assetId, url: objectUrl });
      })
      .catch(() => {
        if (cancelled) return;
        setFavoritePanelPreview(null);
      });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data?.favoritePanel?.fileId, data?.favoritePanel?.thumbnailRef]);

  if (!data) return null;
  const showSpoilers = spoilerWorkId === data.workId;
  const favoritePanelAssetId = data.favoritePanel
    ? (data.favoritePanel.thumbnailRef ?? data.favoritePanel.fileId)
    : null;
  const favoritePanelUrl =
    favoritePanelPreview?.assetId === favoritePanelAssetId ? favoritePanelPreview.url : null;
  const parsedDate = data.lastReadDate ? new Date(data.lastReadDate) : null;
  const daysSinceLastRead = parsedDate && !isNaN(parsedDate.getTime())
    ? Math.floor((Date.now() - parsedDate.getTime()) / 86_400_000)
    : 0;
  const visibleMemories = (data.memories ?? []).filter(
    (memory) => showSpoilers || memory.spoilerLevel === "spoiler_free",
  );
  const canShowSpoilers =
    (data.memories ?? []).some((memory) => memory.spoilerLevel !== "spoiler_free") ||
    Boolean(data.stoppedNote) ||
    Boolean(data.favoritePanel && data.favoritePanel.spoilerLevel !== "spoiler_free");
  const favoritePanelVisible =
    data.favoritePanel && (showSpoilers || data.favoritePanel.spoilerLevel === "spoiler_free");

  return (
    <Drawer
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setSpoilerWorkId(null);
        onOpenChange(nextOpen);
      }}
    >
      <DrawerContent side="right" className="sm:max-w-md w-full flex flex-col h-full max-h-screen overflow-hidden bg-[var(--cv-bg-elevated)]">
        <DrawerHeader className="pb-3 border-b border-[var(--cv-border)]">
          <div className="flex items-center gap-3">
            <Cover title={data.title} src={data.coverSrc} size="sm" />
            <div className="min-w-0 flex-1">
              <DrawerTitle className="truncate">{data.title}</DrawerTitle>
              <DrawerDescription className="flex items-center gap-1.5 mt-1">
                <span>Last read:</span>
                <ProgressDisplay anchor={data.lastProgress} emphasize />
                <span>
                  · {relativeTime(data.lastReadDate)}
                  {Number.isFinite(daysSinceLastRead) && daysSinceLastRead >= 0
                    ? ` (${daysSinceLastRead} days)`
                    : ""}
                </span>
              </DrawerDescription>
            </div>
          </div>
        </DrawerHeader>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Refresher context prompt */}
          <div className="rounded-cv-lg bg-[var(--cv-accent-muted)] p-3 border border-[var(--cv-accent)]/20">
            <div className="flex items-center gap-2 text-cv-xs font-semibold text-[var(--cv-accent-strong)]">
              <Sparkles className="h-4 w-4" />
              <span>Memory Briefing</span>
            </div>
            <p className="mt-1 text-cv-xs text-[var(--cv-text)] leading-relaxed">
              Here are your captured thoughts and key anchors from when you last read{" "}
              <strong className="text-[var(--cv-text)]">{data.title}</strong> to refresh your
              context before jumping back in.
            </p>
          </div>

          {(data.stoppedReason || data.stoppedNote) && (
            <section className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3">
              <h4 className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-muted)]">
                Where you paused
              </h4>
              {data.stoppedReason && (
                <p className="mt-1 text-cv-xs text-[var(--cv-text)]">
                  Reason: {data.stoppedReason.replaceAll("_", " ")}
                </p>
              )}
              {data.stoppedNote && showSpoilers && (
                <p className="mt-1 text-cv-xs leading-relaxed text-[var(--cv-text-muted)]">
                  {data.stoppedNote}
                </p>
              )}
              {data.stoppedNote && !showSpoilers && (
                <p className="mt-1 text-cv-xs text-[var(--cv-text-subtle)]">
                  Stop note hidden by spoiler-safe mode.
                </p>
              )}
            </section>
          )}

          {data.bestPath && (
            <section className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3">
              <h4 className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-muted)]">
                Best available path
              </h4>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="truncate text-cv-xs text-[var(--cv-text)]">
                  {data.bestPath.label} · {data.bestPath.kind.replaceAll("_", " ")}
                </span>
                <SourceHealthIndicator health={data.bestPath.health} size="sm" />
              </div>
            </section>
          )}

          {canShowSpoilers && (
            <label className="flex cursor-pointer items-center gap-2 text-cv-xs text-[var(--cv-text-muted)]">
              <input
                type="checkbox"
                checked={showSpoilers}
                onChange={(event) =>
                  setSpoilerWorkId(event.currentTarget.checked ? data.workId : null)
                }
                className="accent-[var(--cv-accent-strong)]"
              />
              {showSpoilers ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              Show potentially spoiler-bearing context
            </label>
          )}

          {data.favoritePanel && (
            <section className="space-y-2">
              <h4 className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-muted)]">
                Favorite panel
              </h4>
              {favoritePanelVisible ? (
                favoritePanelUrl ? (
                  <img
                    src={favoritePanelUrl}
                    alt="Saved favorite panel"
                    className="max-h-72 w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] object-contain"
                  />
                ) : (
                  <p className="text-cv-xs text-[var(--cv-text-subtle)]">Loading saved panel…</p>
                )
              ) : (
                <p className="rounded-cv border border-dashed border-[var(--cv-border)] p-3 text-cv-xs text-[var(--cv-text-muted)]">
                  Hidden because this memory may contain spoilers.
                </p>
              )}
            </section>
          )}

          {/* User captured memories */}
          <div className="space-y-3">
            <h4 className="text-cv-xs font-semibold text-[var(--cv-text-muted)] uppercase tracking-wider">
              Captured Moments ({visibleMemories.length})
            </h4>

            {visibleMemories.length > 0 ? (
              visibleMemories.map((m) => (
                <MemoryCard
                  key={m.id}
                  type={m.type}
                  content={m.content}
                  anchorLabel={m.anchorLabel}
                  createdAt={m.createdAt}
                />
              ))
            ) : (
              <div className="rounded-cv border border-dashed border-[var(--cv-border)] p-4 text-center text-cv-xs text-[var(--cv-text-subtle)]">
                {data.memories?.length
                  ? "No spoiler-free memories are visible. Use the toggle to reveal them."
                  : "No memories or notes logged for this work yet."}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DrawerFooter className="pt-3 border-t border-[var(--cv-border)]">
          <Button
            variant="default"
            size="lg"
            className="w-full gap-2"
            onClick={() => {
              onContinue(data.workId, data.bestPath?.id);
              onOpenChange(false);
            }}
          >
            <BookOpen className="h-4 w-4" />
            <span>Resume Reading</span>
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
