import * as React from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  HardDrive,
  Link as LinkIcon,
  Sparkles,
  ArrowRight,
  LoaderCircle,
  Play,
  Film,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from "@grimoire/ui";
import {
  AccessCapability,
  AccessPath,
  ReadingRelationship,
  SourceHealth,
  Work,
  createLocalFileAccessPath,
  formatProgressAnchor,
} from "@grimoire/domain";
import { listLocalFiles, setLocalFileWork, type LocalFileMetadata } from "@grimoire/reader";
import { clientRepository } from "@grimoire/state";
import { openLocalDiskPath } from "../../../utils/local-media";

export interface ResumeReadingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  work: Work;
  relationship?: ReadingRelationship | null;
  accessPaths: AccessPath[];
  onOpenFile: (fileId: string) => void;
  onNavigateShelf?: () => void;
}

export function ResumeReadingModal({
  open,
  onOpenChange,
  work,
  relationship,
  accessPaths,
  onOpenFile,
  onNavigateShelf,
}: ResumeReadingModalProps) {
  const [shelfFiles, setShelfFiles] = React.useState<LocalFileMetadata[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const loadFiles = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const files = await listLocalFiles();
      setShelfFiles(files);
    } catch {
      setShelfFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (open) {
      void loadFiles();
    }
  }, [open, loadFiles]);

  const webPaths = accessPaths.filter(
    (p) => (p.kind === "web" || p.kind === "feed") && "url" in p && Boolean(p.url),
  );

  const localPaths = accessPaths.filter((p) => p.kind === "local_file");
  const localVideoPaths = accessPaths.filter(
    (p) =>
      p.kind === "local_file" &&
      "filePath" in p &&
      Boolean(p.filePath) &&
      !String(p.filePath).startsWith("grimoire://local-file/"),
  );

  const openAccessPath = React.useCallback(
    (path: AccessPath) => {
      if ((path.kind === "web" || path.kind === "feed") && "url" in path && path.url) {
        const url = path.url as string;
        const label =
          ("provider" in path && path.provider ? String(path.provider) : null) ??
          path.label ??
          "source";
        handleOpenWeb(url, label);
        return;
      }
      if (path.kind === "local_file" && "fileId" in path && path.fileId) {
        const linked = shelfFiles.find((file) => file.id === (path as { fileId?: string }).fileId);
        if (linked) {
          void handleReadShelfFile(linked, false);
          return;
        }
        toast({
          title: "Local file is not on this shelf",
          description: "Import it on Local Shelf, then open it from here.",
        });
        return;
      }
      if (path.kind === "local_file" && "filePath" in path && path.filePath) {
        void openLocalDiskPath(path.filePath as string, path.label ?? "local video");
        return;
      }
      const maybeUrl = (path as { url?: unknown }).url;
      if (typeof maybeUrl === "string" && maybeUrl.length > 0) {
        window.open(maybeUrl, "_blank", "noopener,noreferrer");
        onOpenChange(false);
      }
    },
    [onOpenChange, shelfFiles],
  );

  React.useEffect(() => {
    if (!open) return undefined;
    if (accessPaths.length === 0) return undefined;
    if (accessPaths.length === 1) {
      const only = accessPaths[0]!;
      const timer = window.setTimeout(() => openAccessPath(only), 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [open, accessPaths, openAccessPath]);

  const handleOpenWeb = (url: string, label: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    toast({
      title: "Opening source URL",
      description: `Opening ${label} in a new tab.`,
    });
    onOpenChange(false);
  };

  const handleReadShelfFile = async (file: LocalFileMetadata, linkToWork = false) => {
    if (linkToWork && file.workId !== work.id) {
      try {
        await setLocalFileWork(file.id, work.id);
        clientRepository.addAccessPath(
          work.id,
          createLocalFileAccessPath({
            workId: work.id,
            filePath: `grimoire://local-file/${encodeURIComponent(file.id)}`,
            fileId: file.id,
            format: file.format,
            provider: "local-reader",
            label: file.displayName,
            isPreferred: true,
            health: SourceHealth.Local,
            capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
            provenance: { importedAt: file.importedAt, contentHash: file.contentHash },
            lastOpenedAt: new Date().toISOString(),
          }),
        );
        toast({
          title: "File linked to work",
          description: `Linked ${file.displayName} to ${work.title}.`,
        });
      } catch (err) {
        console.error("Failed to link file to work:", err);
      }
    }
    toast({
      title: "Resuming reading session",
      description: `Opening ${file.displayName} in reader.`,
    });
    onOpenChange(false);
    onOpenFile(file.id);
  };

  const anchorLabel = relationship?.currentAnchor
    ? formatProgressAnchor(relationship.currentAnchor)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-[var(--gm-accent-strong)]" />
            <DialogTitle className="text-gm-lg font-bold">Resume Reading</DialogTitle>
          </div>
          <DialogDescription className="text-gm-xs text-[var(--gm-text-muted)]">
            {work.title}
            {anchorLabel ? ` · Last progress: ${anchorLabel}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Section 1: Web / Feed Sources */}
          {webPaths.length > 0 && (
            <div>
              <h4 className="text-gm-xs font-semibold uppercase tracking-wider text-[var(--gm-text-subtle)] mb-2 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Web Reading Sources</span>
              </h4>
              <div className="space-y-2">
                {webPaths.map((path) => {
                  const url = "url" in path ? (path.url as string) : "";
                  const provider = "provider" in path && path.provider ? path.provider : path.label;
                  return (
                    <div
                      key={path.id}
                      className="flex items-center justify-between p-3 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/70 hover:border-[var(--gm-border-strong)] transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-gm-sm font-medium text-[var(--gm-text)] truncate">
                          {provider || "Official Source"}
                        </p>
                        <p className="text-gm-xs text-[var(--gm-text-muted)] truncate">{url}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 shrink-0"
                        onClick={() => handleOpenWeb(url, provider || "source")}
                      >
                        <span>Open URL</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Local Videos & Media Files */}
          {localVideoPaths.length > 0 && (
            <div>
              <h4 className="text-gm-xs font-semibold uppercase tracking-wider text-[var(--gm-text-subtle)] mb-2 flex items-center gap-1.5">
                <Film className="h-3.5 w-3.5 text-cyan-400" />
                <span>Local Videos & Media (Default Video Player)</span>
              </h4>
              <div className="space-y-2">
                {localVideoPaths.map((path) => {
                  const filePath = "filePath" in path ? (path.filePath as string) : "";
                  const label = path.label || filePath.split(/[/\\]/).pop() || "Local Media";
                  return (
                    <div
                      key={path.id}
                      className="flex items-center justify-between p-3 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/70 hover:border-[var(--gm-border-strong)] transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--gm-bg-elevated)] border border-[var(--gm-border)] text-cyan-400">
                            VIDEO
                          </span>
                          <p className="text-gm-sm font-medium text-[var(--gm-text)] truncate">
                            {label}
                          </p>
                        </div>
                        <p className="text-gm-xs font-mono text-[var(--gm-text-muted)] truncate mt-0.5">
                          {filePath}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1.5 shrink-0 bg-cyan-600 hover:bg-cyan-700 text-white"
                        onClick={() => {
                          void openLocalDiskPath(filePath, label);
                          onOpenChange(false);
                        }}
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Play Video</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section 2: Local Shelf Reader */}
          <div>
            <h4 className="text-gm-xs font-semibold uppercase tracking-wider text-[var(--gm-text-subtle)] mb-2 flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              <span>Read via Sandboxed Local Reader</span>
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center p-6 text-[var(--gm-text-muted)] text-gm-xs gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Checking Local Shelf…
              </div>
            ) : shelfFiles.length > 0 ? (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {shelfFiles.map((file) => {
                  const isLinked = file.workId === work.id;
                  return (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)]/70 hover:border-[var(--gm-accent-muted)] transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--gm-bg-elevated)] border border-[var(--gm-border)] text-[var(--gm-accent-strong)]">
                            {file.format}
                          </span>
                          <p className="text-gm-sm font-medium text-[var(--gm-text)] truncate">
                            {file.displayName}
                          </p>
                        </div>
                        {isLinked && (
                          <p className="text-[11px] text-[var(--gm-accent-strong)] mt-0.5">
                            ✓ Linked to this title
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isLinked ? "default" : "outline"}
                        className="gap-1.5 shrink-0 text-gm-xs"
                        onClick={() => handleReadShelfFile(file, !isLinked)}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{isLinked ? "Read" : "Link & Read"}</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-cv border border-dashed border-[var(--gm-border)] text-center space-y-3 bg-[var(--gm-surface)]/40">
                <p className="text-gm-xs text-[var(--gm-text-muted)]">
                  No local files found on your shelf yet. Add EPUB, CBZ, PDF, or video files to Local Shelf to read offline.
                </p>
                {onNavigateShelf && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      onOpenChange(false);
                      onNavigateShelf();
                    }}
                  >
                    <HardDrive className="h-3.5 w-3.5" />
                    <span>Open Local Shelf</span>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[var(--gm-border)] pt-3">
          {onNavigateShelf && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gm-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
              onClick={() => {
                onOpenChange(false);
                onNavigateShelf();
              }}
            >
              Open Shelf to Import Books
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="ml-auto">
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
