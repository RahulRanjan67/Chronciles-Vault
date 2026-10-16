import * as React from "react";
import { BookOpen, FileUp, HardDrive, Link2, ScanEye, Sparkles } from "lucide-react";
import {
  AccessCapability,
  SourceHealth,
  createLocalFileAccessPath,
} from "@chronicles-vault/domain";
import { importLocalFile, listLocalFiles, setLocalFileWork } from "@chronicles-vault/reader";
import type { LocalFileMetadata } from "@chronicles-vault/reader";
import { useLibraryStore } from "@chronicles-vault/state";
import { Button, EmptyState, PageContainer, toast } from "@chronicles-vault/ui";
import { seedDemoShelfFiles } from "../utils/demo-shelf-files";

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
  const [isSeedingDemo, setIsSeedingDemo] = React.useState(false);
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
    let mounted = true;
    void (async () => {
      try {
        const existing = await listLocalFiles();
        if (existing.length === 0) {
          await seedDemoShelfFiles();
          library.refresh();
        }
      } catch {
        // Fallback to regular load
      } finally {
        if (mounted) {
          void refreshFiles();
        }
      }
    })();
    return () => {
      mounted = false;
    };
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
      filePath: `chronicles-vault://local-file/${encodeURIComponent(file.id)}`,
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

  const works = library.items.filter((item) => !item.work.deletedAt);

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2.5">
            <HardDrive className="h-6 w-6 text-[var(--cv-accent-strong)]" />
            <h1 className="text-cv-2xl font-extrabold tracking-tight text-[var(--cv-text)] sm:text-cv-3xl">
              Local Shelf
            </h1>
          </div>
          <p className="mt-1 text-cv-sm text-[var(--cv-text-muted)]">
            Import and organize DRM-free EPUB, PDF, and CBZ files stored in this browser.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            className="sr-only"
            type="file"
            accept=".epub,.pdf,.cbz,application/pdf,application/epub+zip,application/vnd.comicbook+zip"
            multiple
            onChange={(event) => void handleImport(event)}
          />
          <Button
            variant="outline"
            className="gap-2"
            disabled={isImporting || isSeedingDemo}
            onClick={async () => {
              setIsSeedingDemo(true);
              try {
                const added = await seedDemoShelfFiles();
                await refreshFiles();
                library.refresh();
                toast({
                  title: "Sample documents ready",
                  description: `${added} sample document${added === 1 ? "" : "s"} (EPUB, PDF, CBZ) staged on Local Shelf.`,
                  variant: "success",
                });
              } catch (seedErr) {
                toast({
                  title: "Unable to create sample files",
                  description: seedErr instanceof Error ? seedErr.message : "Error creating files.",
                  variant: "destructive",
                });
              } finally {
                setIsSeedingDemo(false);
              }
            }}
          >
            <Sparkles className="h-4 w-4 text-[var(--cv-accent-strong)]" />
            <span>{isSeedingDemo ? "Generating…" : "Load Sample Books & Comics"}</span>
          </Button>
          <Button
            variant="default"
            className="gap-2"
            disabled={isImporting || isSeedingDemo}
            onClick={() => fileInput.current?.click()}
          >
            <FileUp className="h-4 w-4" />
            <span>{isImporting ? "Importing…" : "Import Documents"}</span>
          </Button>
        </div>
      </div>

      <div className="mb-6 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4 text-cv-sm text-[var(--cv-text-muted)]">
        Files are stored locally in this browser and are not uploaded. Import validates file
        signatures and calculates a SHA-256 content hash. EPUB, PDF, and CBZ files open in a
        sandboxed local reader; unlinked files remain on this browser&apos;s holding shelf.
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-cv border border-[var(--cv-danger)]/40 bg-[var(--cv-danger)]/10 p-3 text-cv-sm text-[var(--cv-danger)]"
        >
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-cv-sm text-[var(--cv-text-muted)]">
          Loading Local Shelf…
        </p>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-cv-full border border-[var(--cv-border)] bg-[var(--cv-surface)]">
            <HardDrive className="h-7 w-7 text-[var(--cv-accent-strong)]" />
          </div>
          <div>
            <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">Your local shelf is empty</h2>
            <p className="mt-1 max-w-md text-cv-sm text-[var(--cv-text-muted)]">
              Import a DRM-free EPUB, PDF, or CBZ file from your device, or load sample demo files to test reader controls immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              variant="default"
              className="gap-2"
              disabled={isSeedingDemo}
              onClick={async () => {
                setIsSeedingDemo(true);
                try {
                  const added = await seedDemoShelfFiles();
                  await refreshFiles();
                  library.refresh();
                  toast({
                    title: "Sample documents ready",
                    description: `${added} sample documents (EPUB, PDF, CBZ) staged on Local Shelf.`,
                    variant: "success",
                  });
                } finally {
                  setIsSeedingDemo(false);
                }
              }}
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSeedingDemo ? "Generating Demo Files…" : "Load Sample EPUB, PDF & CBZ"}</span>
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              disabled={isImporting}
              onClick={() => fileInput.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              <span>Import From Computer</span>
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
                className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)] p-4"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex min-w-0 items-start gap-3">
                    <BookOpen className="mt-1 h-5 w-5 shrink-0 text-[var(--cv-accent-strong)]" />
                    <div className="min-w-0">
                      <h2 className="break-all font-semibold text-[var(--cv-text)]">
                        {file.displayName}
                      </h2>
                      <p className="mt-1 text-cv-xs text-[var(--cv-text-muted)]">
                        {file.format.toUpperCase()} · {formatBytes(file.sizeBytes)} · SHA-256{" "}
                        {file.contentHash.slice(0, 12)}…
                      </p>
                      <p className="mt-1 text-cv-xs text-[var(--cv-text-muted)]">
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
                    {!file.workId && (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                          aria-label={`Choose a work for ${file.displayName}`}
                          className="min-w-56 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)]"
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
