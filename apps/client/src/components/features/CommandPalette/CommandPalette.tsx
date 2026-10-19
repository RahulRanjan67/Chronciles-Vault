import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CornerDownLeft, Search } from "lucide-react";
import { cn, useDebounce } from "@grimoire/ui";
import {
  clientRepository,
  runGlobalSearch,
  useLibraryStore,
  type GlobalSearchGroup,
  type GlobalSearchResult,
  type SearchableFile,
  type SearchableMemory,
  type SearchableVaultNote,
  type SearchableWork,
} from "@grimoire/state";
import { listLocalFiles } from "@grimoire/reader";
import { useVaultStore } from "@grimoire/vault";
import { requestCreateWork } from "../../../utils/palette-requests";
import { loadUnlockedVaultNotes, vaultRepository } from "../../../utils/vault-notes";
import {
  COMMAND_CATEGORY_ORDER,
  filterCommands,
  type CommandContext,
  type CommandItem,
} from "./CommandRegistry";

export interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: { navigate: (href: string) => void; toastMessage?: (msg: string) => void };
}

const VIEW_ORDER = ["grid", "compact", "table", "board"] as const;
const LISTBOX_ID = "gm-command-palette-list";

type Row =
  | { kind: "command"; key: string; id: string; command: CommandItem }
  | { kind: "result"; key: string; id: string; result: GlobalSearchResult };

interface PaletteData {
  works: SearchableWork[];
  memories: SearchableMemory[];
  files: SearchableFile[];
  loaded: boolean;
}

const EMPTY_DATA: PaletteData = { works: [], memories: [], files: [], loaded: false };

function readRepositoryData(): Omit<PaletteData, "loaded"> {
  const items = clientRepository.getItems();
  const works: SearchableWork[] = items.map((item) => ({
    id: item.work.id,
    title: item.work.title,
    aliases: item.work.aliases,
    genres: item.work.genres,
    tags: item.work.tags,
    description: item.work.description,
    privacyState: item.work.privacyState,
    deletedAt: item.work.deletedAt,
    mergedIntoWorkId: item.work.mergedIntoWorkId ?? null,
    updatedAt: item.work.updatedAt,
    accessPaths: item.accessPaths.map((path) => ({
      id: path.id,
      kind: path.kind,
      label: path.label,
      url: "url" in path && typeof path.url === "string" ? path.url : null,
    })),
  }));
  const memories: SearchableMemory[] = items.flatMap((item) =>
    item.memories.map((memory) => ({
      id: memory.id,
      workId: memory.workId,
      type: memory.type,
      title: memory.title,
      body: memory.body,
      tags: memory.tags,
      spoilerLevel: memory.spoilerLevel,
      privacyState: memory.privacyState,
      readingAttemptId: memory.readingAttemptId ?? null,
      updatedAt: memory.updatedAt,
    })),
  );
  return { works, memories, files: [] };
}

export function CommandPalette({ open, onOpenChange, context }: CommandPaletteProps) {
  const [query, setQuery] = React.useState("");
  const debouncedQuery = useDebounce(query, 150);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [data, setData] = React.useState<PaletteData>(EMPTY_DATA);
  const [vaultNotes, setVaultNotes] = React.useState<SearchableVaultNote[]>([]);
  const vaultUnlocked = useVaultStore((state) => state.status === "unlocked");

  // Load public library data and local files each time the palette opens.
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setSelectedIndex(0);
      setData(EMPTY_DATA);
      return;
    }
    let active = true;
    setData({ ...readRepositoryData(), loaded: false });
    listLocalFiles()
      .then((files) => {
        if (!active) return;
        const mapped: SearchableFile[] = files.map((file) => ({
          id: file.id,
          displayName: file.displayName,
          format: file.format,
          workId: file.workId,
        }));
        setData((current) => ({ ...current, files: mapped, loaded: true }));
      })
      .catch(() => {
        if (active) setData((current) => ({ ...current, loaded: true }));
      });
    return () => {
      active = false;
    };
  }, [open]);

  // Vault notes are decrypted only while the palette is open AND the vault is unlocked.
  React.useEffect(() => {
    if (!open || !vaultUnlocked) {
      setVaultNotes([]);
      return;
    }
    let active = true;
    loadUnlockedVaultNotes()
      .then((notes) => {
        if (active) setVaultNotes(notes.map((note) => ({ id: note.id, title: note.title, body: note.body })));
      })
      .catch(() => {
        if (active) setVaultNotes([]);
      });
    return () => {
      active = false;
    };
  }, [open, vaultUnlocked]);

  const commandContext: CommandContext = React.useMemo(
    () => ({
      navigate: context.navigate,
      toastMessage: context.toastMessage,
      vaultUnlocked,
      lockVault: () => useVaultStore.getState().lock(),
      requestCreateWork: () => requestCreateWork(),
      cycleLibraryView: () => {
        const store = useLibraryStore.getState();
        const index = VIEW_ORDER.indexOf(store.viewMode);
        store.setViewMode(VIEW_ORDER[(index + 1) % VIEW_ORDER.length] ?? "grid");
      },
      openLatestWork: () => {
        const latest = clientRepository
          .getItems()
          .slice()
          .sort((a, b) => b.work.updatedAt.localeCompare(a.work.updatedAt))[0];
        if (!latest) {
          context.toastMessage?.("Add a work first");
          context.navigate("/");
          return;
        }
        context.navigate(`/work/${encodeURIComponent(latest.work.id)}`);
      },
    }),
    [context, vaultUnlocked],
  );

  const commands = React.useMemo(
    () => filterCommands(query, commandContext),
    [query, commandContext],
  );

  const searchGroups: GlobalSearchGroup[] = React.useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    return runGlobalSearch({
      query: debouncedQuery,
      works: data.works,
      memories: data.memories,
      files: data.files,
      vaultNotes,
      vaultUnlocked,
    });
  }, [debouncedQuery, data, vaultNotes, vaultUnlocked]);

  // Flat list of selectable rows: commands first, then search results.
  const rows: Row[] = React.useMemo(() => {
    const list: Row[] = [];
    for (const category of COMMAND_CATEGORY_ORDER) {
      for (const command of commands) {
        if (command.category === category) {
          list.push({ kind: "command", key: `command:${command.id}`, id: `gm-opt-command-${command.id}`, command });
        }
      }
    }
    for (const group of searchGroups) {
      for (const result of group.results as GlobalSearchResult[]) {
        list.push({
          kind: "result",
          key: result.key,
          id: `gm-opt-${result.key.replace(/[^a-zA-Z0-9-]/g, "-")}`,
          result,
        });
      }
    }
    return list;
  }, [commands, searchGroups]);

  // Keep the selection within bounds whenever results change.
  React.useEffect(() => {
    setSelectedIndex(0);
  }, [debouncedQuery, rows.length]);

  const activeRow = rows[selectedIndex];
  const activeId = activeRow?.id;

  React.useEffect(() => {
    if (!activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  const runRow = (row: Row) => {
    if (row.kind === "command") {
      row.command.action(commandContext);
    } else {
      context.navigate(row.result.route);
    }
    onOpenChange(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (rows.length === 0 && event.key !== "Escape") return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelectedIndex((index) => (index + 1) % rows.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelectedIndex((index) => (index - 1 + rows.length) % rows.length);
    } else if (event.key === "Home") {
      event.preventDefault();
      setSelectedIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setSelectedIndex(rows.length - 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (activeRow) runRow(activeRow);
    }
  };

  const renderedCommandCategories = COMMAND_CATEGORY_ORDER.map((category) => ({
    category,
    rows: rows.filter((row) => row.kind === "command" && row.command.category === category),
  })).filter((group) => group.rows.length > 0);

  const searchPending = query.trim() !== debouncedQuery.trim();
  const hasAnyRow = rows.length > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[var(--gm-z-command)] bg-black/75 backdrop-blur-sm transition-opacity data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-[50%] top-[20%] z-[var(--gm-z-command)] w-[92vw] max-w-xl -translate-x-[50%] overflow-hidden rounded-gm-xl border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] shadow-2xl transition-all focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>

          <div className="flex items-center border-b border-[var(--gm-border)] px-4 py-3">
            <Search className="mr-3 h-4 w-4 shrink-0 text-[var(--gm-text-subtle)]" aria-hidden="true" />
            <input
              type="text"
              role="combobox"
              aria-label="Command palette search"
              aria-expanded={hasAnyRow}
              aria-controls={LISTBOX_ID}
              aria-activedescendant={activeId}
              aria-autocomplete="list"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search works, memories, sources, files, or commands…"
              className="flex-1 bg-transparent text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] px-1.5 font-mono text-[10px] text-[var(--gm-text-subtle)]">
              ESC
            </kbd>
          </div>

          <div
            id={LISTBOX_ID}
            role="listbox"
            aria-label="Results"
            className="max-h-96 overflow-y-auto p-2"
          >
            {!hasAnyRow ? (
              <div className="py-8 text-center text-gm-sm text-[var(--gm-text-muted)]">
                {!data.loaded && query.trim()
                  ? "Loading library…"
                  : "No matches. Try a title, a tag, a source host, or a command."}
              </div>
            ) : (
              <>
                {renderedCommandCategories.map(({ category, rows: categoryRows }) => (
                  <div key={`cat-${category}`} className="mb-2 last:mb-0">
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--gm-text-subtle)]">
                      {category}
                    </div>
                    {categoryRows.map((row) => renderRow(row))}
                  </div>
                ))}
                {searchGroups.map((group) => (
                  <div key={`group-${group.category}`} className="mb-2 last:mb-0">
                    <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--gm-text-subtle)]">
                      {group.label}
                    </div>
                    {group.results.map((result) => {
                      const row = rows.find((candidate) => candidate.key === result.key);
                      return row ? renderRow(row) : null;
                    })}
                  </div>
                ))}
              </>
            )}
          </div>

          <div className="sr-only" aria-live="polite">
            {searchPending ? "Searching" : `${rows.length} results`}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--gm-border)] bg-[var(--gm-surface)]/30 px-4 py-2 text-[11px] text-[var(--gm-text-subtle)]">
            <div className="flex items-center gap-3">
              <span>↑↓ Navigate</span>
              <span>↵ Open</span>
              <span>ESC Close</span>
            </div>
            <span className="font-mono text-[10px]">Ctrl+K</span>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );

  function renderRow(row: Row) {
    const index = rows.indexOf(row);
    const isSelected = index === selectedIndex;
    const title = row.kind === "command" ? row.command.title : row.result.title;
    const subtitle = row.kind === "result" ? row.result.subtitle : null;
    const snippet = row.kind === "result" ? row.result.snippet : null;
    const Icon = row.kind === "command" ? row.command.icon : null;
    const shortcut = row.kind === "command" ? row.command.shortcut : undefined;

    return (
      <div
        key={row.key}
        id={row.id}
        role="option"
        aria-selected={isSelected}
        onMouseEnter={() => setSelectedIndex(index)}
        onClick={() => runRow(row)}
        className={cn(
          "flex w-full cursor-pointer items-center justify-between rounded-cv px-2.5 py-2 text-left text-gm-sm transition-colors",
          isSelected
            ? "bg-[var(--gm-surface-raised)] text-[var(--gm-text)]"
            : "text-[var(--gm-text-muted)] hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)]",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon && (
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                isSelected ? "text-[var(--gm-accent-strong)]" : "text-[var(--gm-text-subtle)]",
              )}
            />
          )}
          <div className="min-w-0">
            <div className="truncate">{title}</div>
            {subtitle && <div className="truncate text-[11px] text-[var(--gm-text-subtle)]">{subtitle}</div>}
            {snippet && <div className="truncate text-[11px] text-[var(--gm-text-subtle)]">{snippet}</div>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {shortcut && (
            <kbd className="inline-flex h-4 items-center rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] px-1 font-mono text-[10px] text-[var(--gm-text-subtle)]">
              {shortcut}
            </kbd>
          )}
          {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-[var(--gm-text-subtle)]" aria-hidden="true" />}
        </div>
      </div>
    );
  }
}
