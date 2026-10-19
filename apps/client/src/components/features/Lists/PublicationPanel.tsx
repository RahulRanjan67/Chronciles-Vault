import * as React from "react";
import { AlertTriangle, Download, Eye, ShieldCheck, ShieldAlert, Undo2 } from "lucide-react";
import { Badge, Button, toast } from "@grimoire/ui";
import {
  evaluatePublication,
  renderPublicationHtml,
  renderPublicationMarkdown,
  useLibraryStore,
  useListsStore,
  type PrivateTextSource,
  type PublicationEvaluation,
  type PublicationList,
  type PublicationWork,
  type UserPersonalList,
  type VaultVerificationStatus,
} from "@grimoire/state";
import { PrivacyState } from "@grimoire/domain";
import { useVaultStore } from "@grimoire/vault";
import { loadUnlockedVaultNotes, vaultHasKeyRecord, type UnlockedVaultNote } from "../../../utils/vault-notes";

export interface PublicationPanelProps {
  list: UserPersonalList;
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "publication";
}

function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Publication workflow for one personal list: runs the pre-publication privacy
 * scrubber live, lists every finding, lets the user exclude entries, and enables
 * export only when zero leaks remain. The gate is re-run at export time.
 */
export function PublicationPanel({ list }: PublicationPanelProps) {
  const libraryItems = useLibraryStore((state) => state.items);
  const updateList = useListsStore((state) => state.updateList);
  const recordPublication = useListsStore((state) => state.recordPublication);
  const vaultStatus = useVaultStore((state) => state.status);
  const unlocked = vaultStatus === "unlocked";

  const [hasVault, setHasVault] = React.useState<boolean | null>(null);
  const [vaultNotes, setVaultNotes] = React.useState<UnlockedVaultNote[]>([]);
  const [excludedIds, setExcludedIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    let active = true;
    vaultHasKeyRecord()
      .then((value) => {
        if (active) setHasVault(value);
      })
      .catch(() => {
        if (active) setHasVault(true);
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    if (!unlocked) {
      setVaultNotes([]);
      return;
    }
    loadUnlockedVaultNotes()
      .then((notes) => {
        if (active) setVaultNotes(notes);
      })
      .catch(() => {
        if (active) setVaultNotes([]);
      });
    return () => {
      active = false;
    };
  }, [unlocked]);

  const verification: VaultVerificationStatus | null =
    hasVault === null ? null : !hasVault ? "uninitialized" : unlocked ? "unlocked" : "locked";

  const works: PublicationWork[] = React.useMemo(
    () =>
      libraryItems.map((item) => ({
        id: item.work.id,
        title: item.work.title,
        author: item.work.creators?.[0]?.name ?? null,
        contentType: item.work.contentType,
        genres: item.work.genres,
        tags: item.work.tags,
        synopsis: item.work.description,
        privacyState: item.work.privacyState,
        coverRef: item.work.coverRef,
        totalChapters: item.work.totalChapters ? `${item.work.totalChapters} Chapters` : null,
        rating: item.work.rating ?? null,
      })),
    [libraryItems],
  );

  // Text the publication must never repeat: private memories, private work
  // descriptions, and (when unlocked) every vault note.
  const privateSources: PrivateTextSource[] = React.useMemo(() => {
    const sources: PrivateTextSource[] = [];
    for (const item of libraryItems) {
      if (item.work.privacyState !== PrivacyState.Public && item.work.description) {
        sources.push({ label: "private work", text: item.work.description });
      }
      for (const memory of item.memories) {
        if (memory.privacyState === PrivacyState.Public) continue;
        if (memory.body) {
          sources.push({
            label: "private memory",
            text: memory.body,
            readingAttemptId: memory.readingAttemptId ?? null,
          });
        }
        if (memory.title) {
          sources.push({
            label: "private memory title",
            text: memory.title,
            readingAttemptId: memory.readingAttemptId ?? null,
          });
        }
      }
    }
    for (const note of vaultNotes) {
      if (note.body) sources.push({ label: "vault note", text: note.body });
      if (note.title) sources.push({ label: "vault note title", text: note.title });
    }
    return sources;
  }, [libraryItems, vaultNotes]);

  const publicationList: PublicationList = React.useMemo(
    () => ({
      id: list.id,
      title: list.title,
      description: list.description,
      privacyState: list.privacyState,
      items: list.items.map((item) => ({
        id: item.id,
        workId: item.workId,
        position: item.position,
        personalNote: item.personalNote,
      })),
    }),
    [list],
  );

  const evaluation: PublicationEvaluation | null = React.useMemo(() => {
    if (verification === null) return null;
    return evaluatePublication({
      list: publicationList,
      works,
      excludedEntryIds: excludedIds,
      privateSources,
      vaultStatus: verification,
      generatedAt: "",
    });
  }, [verification, publicationList, works, excludedIds, privateSources]);

  const titleFor = (entryId: string | null): string | null => {
    if (!entryId) return null;
    const item = list.items.find((candidate) => candidate.id === entryId);
    if (!item) return null;
    return libraryItems.find((candidate) => candidate.work.id === item.workId)?.work.title ?? item.workId;
  };

  const exportPublication = (format: "html" | "markdown") => {
    // Re-run the gate at export time so the file always reflects the current state.
    const generatedAt = new Date().toISOString();
    const fresh = evaluatePublication({
      list: publicationList,
      works,
      excludedEntryIds: excludedIds,
      privateSources,
      vaultStatus: verification ?? "locked",
      generatedAt,
    });
    if (fresh.status !== "ready" || !fresh.document) {
      toast({ title: "Publication blocked", description: "Resolve the findings before exporting." });
      return;
    }
    const base = slugify(list.title);
    if (format === "html") {
      downloadText(`${base}.html`, renderPublicationHtml(fresh.document), "text/html");
    } else {
      downloadText(`${base}.md`, renderPublicationMarkdown(fresh.document), "text/markdown");
    }
    recordPublication({
      listId: list.id,
      title: list.title,
      format,
      generatedAt,
      entryCount: fresh.document.entries.length,
      excludedCount: excludedIds.length,
    });
    toast({ title: "Publication exported", description: `${fresh.document.entries.length} entries, zero leaks found.` });
  };

  const blocked = evaluation?.status === "blocked";
  const findings = evaluation?.status === "blocked" ? evaluation.findings : [];
  const listLevelNotPublic = findings.some((finding) => finding.kind === "list_not_public");
  const vaultLocked = findings.some((finding) => finding.kind === "vault_unverified");
  const findingEntryIds = Array.from(new Set(findings.map((finding) => finding.entryId).filter((id): id is string => id !== null)));
  const excludedTitles = excludedIds.map((id) => titleFor(id) ?? id);

  return (
    <section className="mt-8 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-surface)] p-5" aria-labelledby="publication-heading">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id="publication-heading" className="text-gm-base font-semibold text-[var(--gm-text)]">
            Publication
          </h3>
          <p className="mt-0.5 text-gm-xs text-[var(--gm-text-muted)]">
            Every private memory, note, tag, and vault reference is checked before export.
          </p>
        </div>
        {evaluation === null && <Badge variant="default">Checking…</Badge>}
        {evaluation?.status === "ready" && (
          <Badge variant="success" className="gap-1.5">
            <ShieldCheck className="h-3 w-3" /> Ready · zero leaks
          </Badge>
        )}
        {blocked && (
          <Badge variant="danger" className="gap-1.5">
            <ShieldAlert className="h-3 w-3" /> Blocked · {findings.length} finding{findings.length === 1 ? "" : "s"}
          </Badge>
        )}
      </div>

      {blocked && (
        <ul className="mt-4 space-y-2" aria-label="Publication findings">
          {findings.map((finding, index) => {
            const entryTitle = titleFor(finding.entryId);
            return (
              <li
                key={`${finding.kind}-${finding.entryId ?? "list"}-${index}`}
                className="flex items-start gap-2 rounded-cv border border-[var(--gm-danger)]/30 bg-[var(--gm-danger-muted)] px-3 py-2 text-gm-xs text-[var(--gm-text)]"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--gm-danger)]" />
                <span>
                  {entryTitle && <strong className="font-semibold">{entryTitle}: </strong>}
                  {finding.message}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {blocked && (listLevelNotPublic || vaultLocked || findingEntryIds.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {listLevelNotPublic && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateList(list.id, { privacyState: PrivacyState.Public });
                toast({ title: "List is now public" });
              }}
            >
              Make list public
            </Button>
          )}
          {vaultLocked && (
            <p className="w-full text-gm-xs text-[var(--gm-text-muted)]">
              Open Private Vault and unlock it. The vault has to be open so private notes can be compared.
            </p>
          )}
          {findingEntryIds.map((entryId) => (
            <Button
              key={entryId}
              size="sm"
              variant="ghost"
              onClick={() => setExcludedIds((current) => (current.includes(entryId) ? current : [...current, entryId]))}
            >
              <Eye className="mr-1 h-3 w-3" /> Exclude “{titleFor(entryId) ?? "entry"}”
            </Button>
          ))}
        </div>
      )}

      {excludedIds.length > 0 && (
        <div className="mt-4 text-gm-xs text-[var(--gm-text-muted)]">
          <span className="mr-2">Excluded from publication:</span>
          {excludedTitles.map((title, index) => (
            <button
              key={excludedIds[index]}
              type="button"
              onClick={() => setExcludedIds((current) => current.filter((id) => id !== excludedIds[index]))}
              className="mr-2 inline-flex items-center gap-1 rounded-gm-sm border border-[var(--gm-border)] px-2 py-0.5 hover:text-[var(--gm-text)]"
            >
              <Undo2 className="h-3 w-3" /> {title}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={evaluation?.status !== "ready"}
          onClick={() => exportPublication("html")}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" /> Export HTML
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={evaluation?.status !== "ready"}
          onClick={() => exportPublication("markdown")}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" /> Export Markdown
        </Button>
        <p className="text-[11px] text-[var(--gm-text-subtle)]">
          Export stays disabled until the scrubber reports zero findings.
        </p>
      </div>
    </section>
  );
}
