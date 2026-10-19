import * as React from "react";
import { Download, FileText, FileJson, FileSpreadsheet, Archive, Upload } from "lucide-react";
import { Button, toast } from "@grimoire/ui";
import {
  VAULT_EXPORT_CONFIRMATION,
  applyBackupImport,
  applyCandidateImport,
  buildBackup,
  clientRepository,
  createStoredZip,
  indexExisting,
  memoriesToMarkdown,
  parseBackup,
  parseBookmarksHtml,
  parseWorksCsv,
  planWorkImport,
  serializeBackup,
  useListsStore,
  worksToCsv,
  type BackupSnapshot,
  type BackupSource,
  type BackupWork,
  type CandidateWork,
} from "@grimoire/state";
import { useVaultStore } from "@grimoire/vault";
import { loadUnlockedVaultNotes } from "../../../utils/vault-notes";

const encoder = new TextEncoder();

function downloadBytes(filename: string, bytes: Uint8Array, mime: string): void {
  const blob = new Blob([bytes as BlobPart], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Reads the current library and lists into the plain backup shape. */
function collectSource(vaultNotes: BackupSource["vaultNotes"]): BackupSource {
  const items = clientRepository.getItems();
  const works: BackupWork[] = items.map((item) => ({
    id: item.work.id,
    title: item.work.title,
    aliases: item.work.aliases,
    description: item.work.description,
    contentType: item.work.contentType,
    origin: item.work.origin,
    publicationState: item.work.publicationState,
    privacyState: item.work.privacyState,
    coverRef: item.work.coverRef,
    genres: item.work.genres,
    tags: item.work.tags,
    createdAt: item.work.createdAt,
    updatedAt: item.work.updatedAt,
    accessPaths: item.accessPaths.map((path) => ({
      id: path.id,
      kind: path.kind,
      label: path.label,
      url:
        "url" in path && typeof path.url === "string"
          ? path.url
          : "filePath" in path && typeof path.filePath === "string"
            ? path.filePath
            : null,
      isPreferred: path.isPreferred,
    })),
  }));

  const memories = items.flatMap((item) =>
    item.memories.map((memory) => ({
      id: memory.id,
      workId: memory.workId ?? item.work.id,
      type: memory.type,
      title: memory.title,
      body: memory.body,
      spoilerLevel: memory.spoilerLevel,
      privacyState: memory.privacyState,
      tags: memory.tags,
      createdAt: memory.createdAt,
    })),
  );

  const relations = clientRepository.getAllWorkRelations().map((relation) => ({
    id: relation.id,
    sourceWorkId: relation.sourceWorkId,
    targetWorkId: relation.targetWorkId,
    relationType: relation.relationType,
  }));

  const lists = useListsStore.getState().myLists.map((list) => ({
    id: list.id,
    title: list.title,
    description: list.description,
    privacyState: list.privacyState,
    items: list.items.map((entry) => ({
      id: entry.id,
      workId: entry.workId,
      position: entry.position,
      personalNote: entry.personalNote,
    })),
  }));

  return { works, memories, lists, relations, vaultNotes };
}

type ImportPreview =
  | {
      readonly kind: "backup";
      readonly fileName: string;
      readonly snapshot: BackupSnapshot;
      readonly plannedIds: ReadonlySet<string>;
      readonly duplicateTitles: readonly string[];
    }
  | {
      readonly kind: "candidates";
      readonly fileName: string;
      readonly source: "CSV" | "bookmarks";
      readonly create: readonly CandidateWork[];
      readonly duplicates: readonly { readonly title: string; readonly reason: string }[];
      readonly invalid: readonly { readonly line: number; readonly reason: string }[];
    }
  | { readonly kind: "error"; readonly fileName: string; readonly errors: readonly string[] };

function existingIndex() {
  return indexExisting(
    clientRepository.getItems().map((item) => ({
      title: item.work.title,
      urls: item.accessPaths.flatMap((path) => ("url" in path && typeof path.url === "string" ? [path.url] : [])),
    })),
  );
}

export function DataTransferPanel() {
  const vaultStatus = useVaultStore((state) => state.status);
  const vaultUnlocked = vaultStatus === "unlocked";
  const [includeVault, setIncludeVault] = React.useState(false);
  const [vaultConfirmation, setVaultConfirmation] = React.useState("");
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [busy, setBusy] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement>(null);

  const vaultExportReady = !includeVault || (vaultUnlocked && vaultConfirmation === VAULT_EXPORT_CONFIRMATION);

  const buildSnapshot = async (): Promise<BackupSnapshot | null> => {
    if (includeVault && !vaultExportReady) {
      toast({
        title: includeVault && !vaultUnlocked ? "Unlock the Private Vault first" : `Type ${VAULT_EXPORT_CONFIRMATION} to confirm`,
        variant: "destructive",
      });
      return null;
    }
    const vaultNotes = includeVault ? await loadUnlockedVaultNotes() : undefined;
    return buildBackup(collectSource(vaultNotes), {
      exportedAt: new Date().toISOString(),
      includeVault,
      vaultConfirmation,
    });
  };

  const exportAs = async (format: "gca" | "json" | "csv" | "md" | "zip") => {
    setBusy(true);
    try {
      const snapshot = await buildSnapshot();
      if (!snapshot) return;
      const base = `grimoire-${stamp()}`;
      if (format === "gca") {
        downloadBytes(`${base}.gca`, encoder.encode(serializeBackup(snapshot)), "application/json");
      } else if (format === "json") {
        downloadBytes(`${base}.json`, encoder.encode(serializeBackup(snapshot)), "application/json");
      } else if (format === "csv") {
        downloadBytes(`${base}-works.csv`, encoder.encode(worksToCsv(snapshot.works)), "text/csv");
      } else if (format === "md") {
        downloadBytes(`${base}-notes.md`, encoder.encode(memoriesToMarkdown(snapshot.works, snapshot.memories)), "text/markdown");
      } else {
        const bundle = createStoredZip([
          { name: "backup.gca", data: encoder.encode(serializeBackup(snapshot)) },
          { name: "backup.json", data: encoder.encode(serializeBackup(snapshot)) },
          { name: "works.csv", data: encoder.encode(worksToCsv(snapshot.works)) },
          { name: "notes.md", data: encoder.encode(memoriesToMarkdown(snapshot.works, snapshot.memories)) },
        ]);
        downloadBytes(`${base}.zip`, bundle, "application/zip");
      }
      toast({
        title: "Export ready",
        description: includeVault ? "Includes Private Vault notes." : "Vault records are excluded.",
      });
    } catch (error: unknown) {
      toast({ title: "Export failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const onFileChosen = async (file: File | undefined) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (file.size > 25_000_000) {
      setPreview({ kind: "error", fileName: file.name, errors: ["File is larger than the 25 MB import limit."] });
      return;
    }
    const text = await file.text();
    const index = existingIndex();

    if (name.endsWith(".gca") || name.endsWith(".cca") || name.endsWith(".json")) {
      const parsed = parseBackup(text);
      if (!parsed.ok) {
        setPreview({ kind: "error", fileName: file.name, errors: parsed.errors });
        return;
      }
      const snapshot = parsed.value;
      const existingIds = new Set<string>(clientRepository.getItems().map((item) => item.work.id));
      const candidates: CandidateWork[] = snapshot.works.map((work) => ({
        title: work.title,
        contentType: work.contentType,
        genres: work.genres,
        tags: work.tags,
        privacyState: work.privacyState === "vault" ? "vault" : work.privacyState === "private" ? "private" : "public",
        description: work.description,
        accessUrl: (work.accessPaths.find((path) => path.isPreferred) ?? work.accessPaths[0])?.url ?? null,
        sourceLine: 0,
      }));
      const plan = planWorkImport(candidates, index);
      const createSet = new Set<CandidateWork>(plan.create);
      const plannedIds = new Set(
        snapshot.works
          .filter((work, position) => createSet.has(candidates[position]!) && !existingIds.has(work.id))
          .map((work) => work.id),
      );
      setPreview({
        kind: "backup",
        fileName: file.name,
        snapshot,
        plannedIds,
        duplicateTitles: snapshot.works.filter((work) => !plannedIds.has(work.id)).map((work) => work.title),
      });
      return;
    }

    if (name.endsWith(".csv")) {
      const parsed = parseWorksCsv(text);
      const plan = planWorkImport(parsed.candidates, index);
      setPreview({
        kind: "candidates",
        fileName: file.name,
        source: "CSV",
        create: plan.create,
        duplicates: plan.duplicates.map((entry) => ({ title: entry.item.title, reason: entry.reason })),
        invalid: parsed.invalid,
      });
      return;
    }

    if (name.endsWith(".html") || name.endsWith(".htm")) {
      const bookmarks = parseBookmarksHtml(text);
      const candidates: CandidateWork[] = bookmarks.map((bookmark, position) => ({
        title: bookmark.title,
        contentType: null,
        genres: [],
        tags: bookmark.folder ? [bookmark.folder] : [],
        privacyState: "public",
        description: null,
        accessUrl: bookmark.url,
        sourceLine: position + 1,
      }));
      const plan = planWorkImport(candidates, index);
      setPreview({
        kind: "candidates",
        fileName: file.name,
        source: "bookmarks",
        create: plan.create,
        duplicates: plan.duplicates.map((entry) => ({ title: entry.item.title, reason: entry.reason })),
        invalid: [],
      });
      return;
    }

    setPreview({ kind: "error", fileName: file.name, errors: ["Choose a Grimoire Codex Archive (.gca), JSON backup (.json), CSV file (.csv), or browser bookmarks HTML file."] });
  };

  const confirmImport = () => {
    if (!preview || preview.kind === "error") return;
    setBusy(true);
    try {
      if (preview.kind === "backup") {
        const result = applyBackupImport(preview.snapshot, preview.plannedIds);
        const anySnapshot = preview.snapshot as unknown as { categories?: unknown[]; credentials?: unknown[] };
        if (typeof window !== "undefined" && Array.isArray(anySnapshot.categories) && anySnapshot.categories.length > 0) {
          try {
            const rawStored = window.localStorage.getItem("cv:custom_categories:v1");
            const existingCategories: any[] = rawStored ? JSON.parse(rawStored) : [];
            const existingIds = new Set(existingCategories.map((c) => c.id));
            const newCats = (anySnapshot.categories as any[]).filter((c) => !existingIds.has(c.id));
            if (newCats.length > 0) {
              window.localStorage.setItem("cv:custom_categories:v1", JSON.stringify([...existingCategories, ...newCats]));
            }
          } catch {}
        }
        if (typeof window !== "undefined" && Array.isArray(anySnapshot.credentials) && anySnapshot.credentials.length > 0) {
          try {
            const rawCreds = window.localStorage.getItem("grimoire:vault:credentials");
            const existingCreds: any[] = rawCreds ? JSON.parse(rawCreds) : [];
            const existingIds = new Set(existingCreds.map((c) => c.id));
            const newCreds = (anySnapshot.credentials as any[]).filter((c) => !existingIds.has(c.id));
            if (newCreds.length > 0) {
              window.localStorage.setItem("grimoire:vault:credentials", JSON.stringify([...existingCreds, ...newCreds]));
            }
          } catch {}
        }
        toast({
          title: "Backup imported",
          description: `${result.worksCreated} works, ${result.memoriesCreated} notes, ${result.relationsCreated} relations, ${result.listsRestored} lists. Duplicates were skipped.`,
        });
      } else {
        const created = applyCandidateImport(preview.create);
        toast({ title: `${preview.source} import complete`, description: `${created} works added. Duplicates were skipped.` });
      }
      setPreview(null);
      if (fileInput.current) fileInput.current.value = "";
    } catch (error: unknown) {
      toast({ title: "Import failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const importCount =
    preview?.kind === "backup" ? preview.plannedIds.size : preview?.kind === "candidates" ? preview.create.length : 0;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h4 className="text-gm-sm font-semibold text-[var(--gm-text)]">Export</h4>
        <p className="text-gm-xs text-[var(--gm-text-muted)]">
          Exports include your library, access paths, notes, and relations. Vault records are excluded unless you confirm below.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={busy} onClick={() => void exportAs("gca")} className="gap-1.5">
            <Archive className="h-3.5 w-3.5" /> Grimoire Archive (.gca)
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void exportAs("json")} className="gap-1.5">
            <FileJson className="h-3.5 w-3.5" /> Raw JSON
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void exportAs("csv")} className="gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Works (CSV)
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void exportAs("md")} className="gap-1.5">
            <FileText className="h-3.5 w-3.5" /> Notes (Markdown)
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void exportAs("zip")} className="gap-1.5">
            <Archive className="h-3.5 w-3.5" /> ZIP bundle
          </Button>
        </div>

        <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-4 space-y-3">
          <label className="flex items-start gap-2.5 text-gm-xs text-[var(--gm-text)]">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={includeVault}
              disabled={!vaultUnlocked && !includeVault}
              onChange={(event) => {
                setIncludeVault(event.target.checked);
                if (!event.target.checked) setVaultConfirmation("");
              }}
            />
            <span>
              Include Private Vault notes.
              <span className="block text-[var(--gm-text-subtle)]">
                {vaultUnlocked
                  ? "Vault notes will be written in plain text. Store the file somewhere safe."
                  : "Unlock the Private Vault to include its notes."}
              </span>
            </span>
          </label>
          {includeVault && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-[var(--gm-text-muted)]" htmlFor="vault-export-confirm">
                Type {VAULT_EXPORT_CONFIRMATION} to confirm
              </label>
              <input
                id="vault-export-confirm"
                value={vaultConfirmation}
                onChange={(event) => setVaultConfirmation(event.target.value)}
                className="w-full max-w-xs rounded-cv border border-[var(--gm-border)] bg-[var(--gm-bg)] px-3 py-1.5 text-gm-sm text-[var(--gm-text)] focus:outline-none focus:ring-2 focus:ring-[var(--gm-border-focus)]"
                autoComplete="off"
              />
            </div>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h4 className="text-gm-sm font-semibold text-[var(--gm-text)]">Import</h4>
        <p className="text-gm-xs text-[var(--gm-text-muted)]">
          Accepts a Grimoire Codex Archive (.gca), Chronicle Codex Archive (.cca), JSON backup, works CSV, or browser bookmarks HTML file. You see a preview before anything is written. Duplicates are skipped.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-cv border border-[var(--gm-border)] px-3 py-2 text-gm-sm text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)]">
            <Upload className="h-3.5 w-3.5" />
            Choose file
            <input
              ref={fileInput}
              type="file"
              accept=".gca,.cca,.json,.csv,.html,.htm,application/json,text/csv,text/html"
              className="sr-only"
              onChange={(event) => void onFileChosen(event.target.files?.[0])}
            />
          </label>
          {preview && (
            <Button size="sm" variant="ghost" onClick={() => { setPreview(null); if (fileInput.current) fileInput.current.value = ""; }}>
              Clear
            </Button>
          )}
        </div>

        {preview?.kind === "error" && (
          <div className="rounded-cv border border-[var(--gm-danger)]/30 bg-[var(--gm-danger-muted)] p-4 text-gm-xs text-[var(--gm-text)]">
            <p className="font-semibold">Cannot import {preview.fileName}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {preview.errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {preview && preview.kind !== "error" && (
          <div className="rounded-cv border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] p-4 space-y-3">
            <p className="text-gm-sm font-semibold text-[var(--gm-text)]">Preview: {preview.fileName}</p>
            <p className="text-gm-xs text-[var(--gm-text-muted)]">
              Will add <strong className="text-[var(--gm-text)]">{importCount}</strong> work{importCount === 1 ? "" : "s"}
              {" · "}skipping <strong className="text-[var(--gm-text)]">{preview.kind === "backup" ? preview.duplicateTitles.length : preview.duplicates.length}</strong> duplicate{(preview.kind === "backup" ? preview.duplicateTitles.length : preview.duplicates.length) === 1 ? "" : "s"}
              {preview.kind === "candidates" && preview.invalid.length > 0 ? ` · ${preview.invalid.length} invalid row${preview.invalid.length === 1 ? "" : "s"} ignored` : ""}.
            </p>
            {preview.kind === "candidates" && preview.invalid.length > 0 && (
              <ul className="list-disc space-y-0.5 pl-5 text-[11px] text-[var(--gm-danger)]">
                {preview.invalid.slice(0, 5).map((row) => (
                  <li key={`${row.line}-${row.reason}`}>Line {row.line}: {row.reason}</li>
                ))}
              </ul>
            )}
            {preview.kind === "candidates" && (
              <ul className="max-h-40 overflow-y-auto list-disc space-y-0.5 pl-5 text-[11px] text-[var(--gm-text-subtle)]">
                {preview.create.slice(0, 50).map((candidate) => (
                  <li key={`${candidate.sourceLine}-${candidate.title}`}>{candidate.title}</li>
                ))}
              </ul>
            )}
            {preview.kind === "backup" && (
              <p className="text-[11px] text-[var(--gm-text-subtle)]">
                Restores works, access paths, notes, relations, and personal lists from this backup.
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <Button size="sm" disabled={busy || importCount === 0} onClick={confirmImport}>
                Import {importCount} work{importCount === 1 ? "" : "s"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPreview(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h4 className="text-gm-sm font-semibold text-[var(--gm-text)] flex items-center gap-2">
          <Download className="h-3.5 w-3.5" /> Browser extension handoff
        </h4>
        <p className="text-gm-xs text-[var(--gm-text-muted)]">
          Radar can also take captured tabs from the browser companion. Captures stay in Radar until you confirm them.
        </p>
      </section>
    </div>
  );
}
