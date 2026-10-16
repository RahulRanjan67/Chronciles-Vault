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
} from "@chronicles-vault/ui";
import {
  AccessCapability,
  AccessPath,
  ReadingRelationship,
  SourceHealth,
  Work,
  createLocalFileAccessPath,
  formatProgressAnchor,
} from "@chronicles-vault/domain";
import { listLocalFiles, setLocalFileWork, type LocalFileMetadata } from "@chronicles-vault/reader";
import { clientRepository } from "@chronicles-vault/state";
import { seedDemoShelfFiles } from "../../../utils/demo-shelf-files";

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
  const [isSeeding, setIsSeeding] = React.useState(false);

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
            filePath: `chronicles-vault://local-file/${encodeURIComponent(file.id)}`,
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

  const handleSeedAndRead = async () => {
    setIsSeeding(true);
    try {
      await seedDemoShelfFiles();
      const files = await listLocalFiles();
      setShelfFiles(files);
      const epub = files.find((f) => f.format === "epub") ?? files[0];
      if (epub) {
        await handleReadShelfFile(epub, true);
      } else {
        toast({
          title: "Sample files generated",
          description: "Sample books are now ready on Local Shelf.",
        });
      }
    } catch (err) {
      toast({
        title: "Could not generate sample files",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsSeeding(false);
    }
  };

  const anchorLabel = relationship?.currentAnchor
    ? formatProgressAnchor(relationship.currentAnchor)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-5 w-5 text-[var(--cv-accent-strong)]" />
            <DialogTitle className="text-cv-lg font-bold">Resume Reading</DialogTitle>
          </div>
          <DialogDescription className="text-cv-xs text-[var(--cv-text-muted)]">
            {work.title}
            {anchorLabel ? ` · Last progress: ${anchorLabel}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          {/* Section 1: Web / Feed Sources */}
          {webPaths.length > 0 && (
            <div>
              <h4 className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-subtle)] mb-2 flex items-center gap-1.5">
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
                      className="flex items-center justify-between p-3 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)]/70 hover:border-[var(--cv-border-strong)] transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <p className="text-cv-sm font-medium text-[var(--cv-text)] truncate">
                          {provider || "Official Source"}
                        </p>
                        <p className="text-cv-xs text-[var(--cv-text-muted)] truncate">{url}</p>
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

          {/* Section 2: Local Shelf Reader */}
          <div>
            <h4 className="text-cv-xs font-semibold uppercase tracking-wider text-[var(--cv-text-subtle)] mb-2 flex items-center gap-1.5">
              <HardDrive className="h-3.5 w-3.5" />
              <span>Read via Sandboxed Local Reader</span>
            </h4>

            {isLoading ? (
              <div className="flex items-center justify-center p-6 text-[var(--cv-text-muted)] text-cv-xs gap-2">
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
                      className="flex items-center justify-between p-3 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)]/70 hover:border-[var(--cv-accent-muted)] transition-colors"
                    >
                      <div className="min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[var(--cv-bg-elevated)] border border-[var(--cv-border)] text-[var(--cv-accent-strong)]">
                            {file.format}
                          </span>
                          <p className="text-cv-sm font-medium text-[var(--cv-text)] truncate">
                            {file.displayName}
                          </p>
                        </div>
                        {isLinked && (
                          <p className="text-[11px] text-[var(--cv-accent-strong)] mt-0.5">
                            ✓ Linked to this title
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={isLinked ? "default" : "outline"}
                        className="gap-1.5 shrink-0 text-cv-xs"
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
              <div className="p-4 rounded-cv border border-dashed border-[var(--cv-border)] text-center space-y-3 bg-[var(--cv-surface)]/40">
                <p className="text-cv-xs text-[var(--cv-text-muted)]">
                  No local files found on your shelf yet.
                </p>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-2"
                  onClick={handleSeedAndRead}
                  disabled={isSeeding}
                >
                  {isSeeding ? (
                    <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  <span>Generate Sample EPUB & Read</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-[var(--cv-border)] pt-3">
          {onNavigateShelf && (
            <Button
              variant="ghost"
              size="sm"
              className="text-cv-xs text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
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
