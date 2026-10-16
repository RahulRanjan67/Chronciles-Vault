import * as React from "react";
import {
  BookMarked,
  Plus,
  Pin,
  Sparkles,
  Trash2,
  Check,
  PowerOff,
} from "lucide-react";
import { Badge, Button, Input, toast } from "@chronicles-vault/ui";
import type { WorkId } from "@chronicles-vault/shared";
import {
  useNotebookStore,
  useWorkDetailStore,
  type NotebookEntryCategory,
} from "@chronicles-vault/state";

export interface WorkNotebookPanelProps {
  workId: WorkId;
  workTitle: string;
}

const CATEGORY_LABELS: Record<NotebookEntryCategory, string> = {
  theory: "Theory",
  clue: "Clue",
  character: "Character Map",
  question: "Open Question",
  scratch: "Scratchpad",
};

export function WorkNotebookPanel({ workId, workTitle }: WorkNotebookPanelProps) {
  const {
    activatedWorkIds,
    entries,
    activateNotebook,
    deactivateNotebook,
    addEntry,
    deleteEntry,
    togglePin,
    promoteToMemory,
  } = useNotebookStore();
  const loadWork = useWorkDetailStore((s) => s.loadWork);

  const isActivated = activatedWorkIds.includes(workId);
  const workEntries = React.useMemo(
    () =>
      entries
        .filter((e) => e.workId === workId)
        .sort((a, b) => {
          if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
          return b.updatedAt.localeCompare(a.updatedAt);
        }),
    [entries, workId],
  );

  const [filterCategory, setFilterCategory] = React.useState<NotebookEntryCategory | "all">("all");
  const [showAdd, setShowAdd] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState<NotebookEntryCategory>("theory");
  const [chapterHint, setChapterHint] = React.useState("");
  const [body, setBody] = React.useState("");

  if (!isActivated) {
    return (
      <div className="rounded-cv-xl border border-dashed border-[var(--cv-border)] bg-[var(--cv-surface)]/40 p-8 text-center">
        <BookMarked className="h-8 w-8 mx-auto mb-3 text-[var(--cv-accent-strong)] opacity-80" />
        <h3 className="text-cv-base font-bold text-[var(--cv-text)]">
          Working Notebook is Inactive for &ldquo;{workTitle}&rdquo;
        </h3>
        <p className="mt-1.5 text-cv-xs text-[var(--cv-text-muted)] max-w-lg mx-auto leading-relaxed">
          Notebooks are opt-in per work so simple reads stay lightweight. Activate a Notebook to track active reading theories, mystery clues, character maps, and open questions — and promote any working note into a permanent Memory with one click.
        </p>
        <Button
          variant="default"
          size="sm"
          className="mt-4 gap-1.5"
          onClick={() => {
            activateNotebook(workId);
            toast({
              title: "Notebook activated",
              description: `Working scratchpad enabled for "${workTitle}".`,
            });
          }}
        >
          <BookMarked className="h-3.5 w-3.5" />
          <span>Activate Notebook for This Work</span>
        </Button>
      </div>
    );
  }

  const visibleEntries =
    filterCategory === "all"
      ? workEntries
      : workEntries.filter((e) => e.category === filterCategory);

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !title.trim()) {
      toast({ title: "Enter a note title or body", variant: "warning" });
      return;
    }
    addEntry({
      workId,
      category,
      title: title.trim() || "Working note",
      body: body.trim(),
      chapterHint: chapterHint.trim() || null,
    });
    setTitle("");
    setBody("");
    setChapterHint("");
    setShowAdd(false);
    toast({ title: "Notebook entry saved" });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-cv-sm font-semibold text-[var(--cv-text)] flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-[var(--cv-accent-strong)]" />
            <span>Active Reading Notebook ({workEntries.length})</span>
          </h3>
          <p className="text-cv-xs text-[var(--cv-text-muted)]">
            Working scratchpad for live theories, clues, and character notes. Promote worth-keeping notes into Memories anytime.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              deactivateNotebook(workId);
              toast({
                title: "Notebook hidden",
                description: "Existing entries are preserved if you re-activate later.",
              });
            }}
            className="gap-1 text-cv-xs text-[var(--cv-text-muted)]"
            title="Deactivate Notebook view on this work"
          >
            <PowerOff className="h-3.5 w-3.5" />
            <span>Deactivate</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowAdd(!showAdd)}
            className="gap-1.5 text-cv-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Working Note</span>
          </Button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(["all", "theory", "clue", "character", "question", "scratch"] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCategory(cat)}
            className={`px-2.5 py-1 rounded-cv-full text-cv-xs font-medium transition-colors cursor-pointer ${
              filterCategory === cat
                ? "bg-[var(--cv-accent)] text-white"
                : "bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] border border-[var(--cv-border)]"
            }`}
          >
            {cat === "all" ? "All Notes" : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Add Working Note Form */}
      {showAdd && (
        <form
          onSubmit={handleCreateEntry}
          className="rounded-cv-xl border border-[var(--cv-accent-muted)] bg-[var(--cv-bg-elevated)] p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (e.g. Suspect timeline)"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as NotebookEntryCategory)}
              className="h-9 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 text-cv-xs text-[var(--cv-text)]"
            >
              <option value="theory">Theory</option>
              <option value="clue">Clue</option>
              <option value="character">Character Map</option>
              <option value="question">Open Question</option>
              <option value="scratch">Scratchpad</option>
            </select>
            <Input
              value={chapterHint}
              onChange={(e) => setChapterHint(e.target.value)}
              placeholder="Chapter / position (e.g. Ch. 142)"
            />
          </div>
          <textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your working theory, clue, or relationship notes…"
            className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent)]"
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm">
              Save Working Note
            </Button>
          </div>
        </form>
      )}

      {/* Entries List */}
      {visibleEntries.length === 0 ? (
        <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 text-center text-cv-xs text-[var(--cv-text-muted)]">
          No working notes in this view yet. Click <strong>New Working Note</strong> above to start jotting down theories or clues.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex flex-col justify-between rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                      {CATEGORY_LABELS[entry.category]}
                    </Badge>
                    {entry.chapterHint && (
                      <span className="font-mono text-[11px] text-[var(--cv-text-muted)]">
                        {entry.chapterHint}
                      </span>
                    )}
                    {entry.promotedMemoryId && (
                      <Badge variant="success" className="text-[10px] px-1.5 py-0">
                        Graduated to Memory
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePin(entry.id)}
                      title={entry.pinned ? "Unpin note" : "Pin note"}
                      className={`p-1 rounded-cv-sm cursor-pointer ${
                        entry.pinned
                          ? "text-[var(--cv-accent-strong)] bg-[var(--cv-accent)]/15"
                          : "text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)]"
                      }`}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteEntry(entry.id);
                        toast({ title: "Notebook note deleted" });
                      }}
                      title="Delete working note"
                      className="p-1 rounded-cv-sm text-[var(--cv-text-subtle)] hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-cv-sm font-bold text-[var(--cv-text)]">{entry.title}</h4>
                <p className="mt-1.5 text-cv-xs text-[var(--cv-text-muted)] whitespace-pre-wrap leading-relaxed">
                  {entry.body}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--cv-border)] flex items-center justify-between">
                <span className="text-[10px] font-mono text-[var(--cv-text-subtle)]">
                  Working Scratchpad
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={Boolean(entry.promotedMemoryId)}
                  onClick={() => {
                    const mem = promoteToMemory(entry.id);
                    if (mem) {
                      loadWork(workId);
                      toast({
                        title: "Promoted to Memory",
                        description:
                          "Graduated working note into your curated Memories (private by default).",
                        variant: "success",
                      });
                    }
                  }}
                  className="h-7 px-2.5 text-[11px] gap-1"
                >
                  {entry.promotedMemoryId ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span>Promoted</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 text-[var(--cv-accent-strong)]" />
                      <span>Promote to Memory</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
