import * as React from "react";
import { BookOpen, FileUp, HardDrive, Link2, ScanEye, Sparkles, Trash2 } from "lucide-react";
import {
  AccessCapability,
  SourceHealth,
  createLocalFileAccessPath,
} from "@grimoire/domain";
import {
  deleteLocalFile,
  flushLocalFiles,
  importLocalFile,
  listLocalFiles,
  setLocalFileWork,
} from "@grimoire/reader";
import type { LocalFileMetadata } from "@grimoire/reader";
import { useLibraryStore } from "@grimoire/state";
import { Button, EmptyState, PageContainer, toast } from "@grimoire/ui";

interface LocalShelfProps {
  onOpenFile?: (fileId: string) => void;
}

function formatBytes(size: number): string {
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function LocalShelf({ onOpenFile }: LocalShelfProps) {
  const fileInput = React.useRef<HTMLInputElement>(null);
  const library = useLibraryStore();
  const [files, setFiles] = React.useState<LocalFileMetadata[]>([]);
  const [selectedWorks, setSelectedWorks] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refreshFiles = React.useCallback(async () => {
    try {
      setFiles(await listLocalFiles());
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load local file storage.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshFiles();
  }, [refreshFiles]);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (selected.length === 0) return;

    setIsImporting(true);
    const imported: string[] = [];
    const failures: string[] = [];
    for (const file of selected) {
      try {
        await importLocalFile(file);
        imported.push(file.name);
      } catch (importError) {
        failures.push(
          `${file.name}: ${importError instanceof Error ? importError.message : "Import failed."}`,
        );
      }
    }
    await refreshFiles();
    setIsImporting(false);

    if (imported.length > 0) {
      toast({
        title: imported.length === 1 ? "File added to Local Shelf" : "Files added to Local Shelf",
        description: imported.length === 1 ? imported[0] : `${imported.length} files imported.`,
        variant: "success",
      });
    }
    if (failures.length > 0) {
      toast({
        title: "Some files could not be imported",
        description: failures.slice(0, 3).join(" "),
        variant: "destructive",
      });
    }
  };

  const handleLink = async (file: LocalFileMetadata) => {
    const workId = selectedWorks[file.id];
    const item = library.items.find((candidate) => candidate.work.id === workId);
    if (!item) {
      toast({ title: "Choose a work to link this file to.", variant: "destructive" });
      return;
    }

    const isPreferred = item.accessPaths.length === 0;
    const accessPath = createLocalFileAccessPath({
      workId: item.work.id,
      filePath: `grimoire://local-file/${encodeURIComponent(file.id)}`,
      fileId: file.id,
      format: file.format,
      provider: "local-reader",
      label: file.displayName,
      isPreferred,
      health: SourceHealth.Local,
      capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
      provenance: { importedAt: file.importedAt, contentHash: file.contentHash },
      lastOpenedAt: null,
    });

    let fileLinkPersisted = false;
    try {
      await setLocalFileWork(file.id, item.work.id);
      fileLinkPersisted = true;
      library.addAccessPath(item.work.id, accessPath);
      await refreshFiles();
      toast({
        title: "Local file linked",
        description: `${file.displayName} is now an access path for ${item.work.title}.`,
        variant: "success",
      });
    } catch (linkError) {
      if (fileLinkPersisted) {
        try {
          await setLocalFileWork(file.id, null);
        } catch (rollbackError) {
          toast({
            title: "File link needs attention",
            description:
              rollbackError instanceof Error
                ? rollbackError.message
                : "Unable to restore the file to the unmatched shelf.",
            variant: "destructive",
          });
          return;
        }
      }
      toast({
        title: "Unable to link local file",
        description: linkError instanceof Error ? linkError.message : "The file link failed.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFile = async (file: LocalFileMetadata) => {
    if (typeof window !== "undefined" && !window.confirm(`Delete "${file.displayName}" from your local shelf? This will remove the file from this device.`)) {
      return;
    }
    try {
      await deleteLocalFile(file.id);
      await refreshFiles();
      library.refresh();
      toast({
        title: "File removed",
        description: `"${file.displayName}" deleted from Local Shelf.`,
      });
    } catch (delErr) {
      toast({
        title: "Deletion failed",
        description: delErr instanceof Error ? delErr.message : "Unable to delete file.",
        variant: "destructive",
      });
    }
  };

  const handleClearShelf = async () => {
    if (files.length === 0) return;
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        `Clear all ${files.length} document(s) from Local Shelf? All locally stored files will be permanently erased.`,
      )
    ) {
      return;
    }
    try {
      const count = await flushLocalFiles();
      await refreshFiles();
      library.refresh();
      toast({
        title: "Shelf cleared",
        description: `Cleared ${count} document${count === 1 ? "" : "s"} from local storage.`,
        variant: "success",
      });
    } catch (clearErr) {
      toast({
        title: "Clear failed",
        description: clearErr instanceof Error ? clearErr.message : "Unable to clear local files.",
        variant: "destructive",
      });
    }
  };

  const works = library.items.filter((item) => !item.work.deletedAt);

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-6 w-6 text-[var(--gm-accent-strong)]" />
            <h1 className="text-gm-2xl font-extrabold tracking-tight text-[var(--gm-text)] sm:text-gm-3xl">
              Local Shelf
            </h1>
          </div>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
            Organize DRM-free EPUB, PDF, CBZ, and TXT files stored privately on this device.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept=".epub,.pdf,.cbz,.txt,application/pdf,application/epub+zip,application/vnd.comicbook+zip,text/plain"
            multiple
            onChange={(event) => void handleImport(event)}
          />
          <Button
            variant="default"
            className="gap-2"
            disabled={isImporting}
            onClick={() => fileInput.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            <span>{isImporting ? "Importing…" : "Import Documents"}</span>
          </Button>
          {files.length > 0 && (
            <Button
              variant="outline"
              className="gap-1.5 text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
              disabled={isImporting}
              onClick={() => void handleClearShelf()}
              title="Clear all local documents from this device"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Shelf ({files.length})</span>
            </Button>
          )}
        </div>
      </div>

      <div className="mb-6 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 text-gm-sm text-[var(--gm-text-muted)]">
        Files are stored offline on this device and are never uploaded to any remote server.
        EPUB, PDF, CBZ, and TXT documents open in an isolated reader; unlinked files remain on your holding shelf.
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-cv border border-[var(--gm-danger)]/40 bg-[var(--gm-danger)]/10 p-3 text-gm-sm text-[var(--gm-danger)]"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-gm-sm text-[var(--gm-text-muted)]">
          Loading Local Shelf…
        </p>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-gm-full border border-[var(--gm-border)] bg-[var(--gm-surface)]">
            <HardDrive className="h-7 w-7 text-[var(--gm-accent-strong)]" />
          </div>
          <div>
            <h2 className="text-gm-lg font-bold text-[var(--gm-text)]">Your local shelf is empty</h2>
            <p className="mt-1 max-w-md text-gm-sm text-[var(--gm-text-muted)]">
              Import a DRM-free EPUB, PDF, CBZ, or TXT file from your device to begin reading.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="default"
              className="gap-2"
              disabled={isImporting}
              onClick={() => fileInput.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              <span>Import Documents</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          {files.map((file) => {
            const linkedWork = works.find((item) => item.work.id === file.workId);
            return (
              <article
                key={file.id}
                className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <BookOpen className="mt-1 h-5 w-5 shrink-0 text-[var(--gm-accent-strong)]" />
                    <div className="min-w-0">
                      <h2 className="break-all font-semibold text-[var(--gm-text)]">
                        {file.displayName}
                      </h2>
                      <p className="mt-1 text-gm-xs text-[var(--gm-text-muted)]">
                        {file.format.toUpperCase()} · {formatBytes(file.sizeBytes)}
                      </p>
                      <p className="mt-1 text-gm-xs text-[var(--gm-text-muted)]">
                        {linkedWork ? `Linked to ${linkedWork.work.title}` : "Unmatched file"}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => onOpenFile?.(file.id)}
                    >
                      <ScanEye className="h-4 w-4" />
                      Read {file.format.toUpperCase()}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[var(--gm-text-muted)] hover:text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)] px-2.5"
                      title={`Delete "${file.displayName}" from local shelf`}
                      onClick={() => void handleDeleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {!file.workId && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          aria-label={`Choose a work for ${file.displayName}`}
                          className="min-w-56 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)]"
                          value={selectedWorks[file.id] ?? ""}
                          onChange={(event) =>
                            setSelectedWorks((current) => ({
                              ...current,
                              [file.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select library work…</option>
                          {works.map((item) => (
                            <option key={item.work.id} value={item.work.id}>
                              {item.work.title}
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          className="gap-2"
                          disabled={!selectedWorks[file.id]}
                          onClick={() => void handleLink(file)}
                        >
                          <Link2 className="h-4 w-4" />
                          Link to Work
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
