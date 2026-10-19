import * as React from "react";
import {
  BookOpen,
  Copy,
  ExternalLink,
  Heart,
  ListFilter,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Users,
  Check,
  ArrowRight,
  BookmarkPlus,
  Share2,
  ChevronUp,
  ChevronDown,
  Pencil,
} from "lucide-react";
import {
  Badge,
  Button,
  Cover,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Input,
  PageContainer,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@grimoire/ui";
import {
  useListsStore,
  useLibraryStore,
  type CommunityList,
  type CommunityWorkEntry,
  type UserPersonalList,
} from "@grimoire/state";
import { useVaultStore } from "@grimoire/vault";
import { PrivacyState } from "@grimoire/domain";
import { PublicationPanel } from "../components/features/Lists/PublicationPanel";
import { EditListDialog, ItemNoteDialog } from "../components/features/Lists/ListDialogs";

export interface ListsProps {
  onNavigateWork?: (workId: string) => void;
  onBack?: () => void;
}

export function Lists({ onNavigateWork }: ListsProps) {
  const {
    myLists,
    selectedListId,
    setSelectedListId,
    createList,
    deleteList,
    removeWorkFromList,
    moveListItem,
    communityLists,
    communitySearchQuery,
    setCommunitySearchQuery,
    communityGenreFilter,
    setCommunityGenreFilter,
    cloneCommunityList,
    addCommunityWorkToLibrary,
  } = useListsStore();

  const { items: libraryItems, refresh: loadLibrary } = useLibraryStore();

  // Vault gating: hide vault-classified lists when vault is locked
  const isVaultUnlocked = useVaultStore((s) => s.status === "unlocked");

  const [activeTab, setActiveTab] = React.useState<"my-lists" | "explore">("explore");
  const [editListOpen, setEditListOpen] = React.useState(false);
  const [noteEntryId, setNoteEntryId] = React.useState<string | null>(null);
  const [createListModalOpen, setCreateListModalOpen] = React.useState(false);
  const [selectedCommunityList, setSelectedCommunityList] = React.useState<CommunityList | null>(
    null,
  );

  // Form State
  const [newListTitle, setNewListTitle] = React.useState("");
  const [newListDesc, setNewListDesc] = React.useState("");

  React.useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const activePersonalList =
    myLists.find((l) => l.id === selectedListId) ?? myLists[0] ?? null;

  // Filtered Community Lists
  const filteredCommunityLists = React.useMemo(() => {
    return communityLists.filter((list) => {
      // Vault gating: hide lists with 'vault' in name when vault is locked
      const isVaultList = list.title.toLowerCase().includes("vault");
      if (isVaultList && !isVaultUnlocked) return false;

      const matchesQuery =
        !communitySearchQuery.trim() ||
        list.title.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
        list.description.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
        list.curator.name.toLowerCase().includes(communitySearchQuery.toLowerCase()) ||
        list.items.some((item) =>
          item.title.toLowerCase().includes(communitySearchQuery.toLowerCase()),
        );

      const matchesGenre =
        !communityGenreFilter ||
        communityGenreFilter === "All" ||
        list.genres.includes(communityGenreFilter);

      return matchesQuery && matchesGenre;
    });
  }, [communityLists, communitySearchQuery, communityGenreFilter, isVaultUnlocked]);

  const allCommunityGenres = React.useMemo(() => {
    const genres = new Set<string>();
    communityLists.forEach((l) => l.genres.forEach((g) => genres.add(g)));
    return ["All", ...Array.from(genres).sort()];
  }, [communityLists]);

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const created = createList({
      title: newListTitle.trim(),
      description: newListDesc.trim(),
    });
    setSelectedListId(created.id);
    setActiveTab("my-lists");
    setCreateListModalOpen(false);
    setNewListTitle("");
    setNewListDesc("");
    toast({ title: "List created", description: `Created list "${created.title}"` });
  };

  const handleCloneList = (communityList: CommunityList) => {
    const result = cloneCommunityList(communityList.id);
    setSelectedListId(result.list.id);
    setActiveTab("my-lists");
    setSelectedCommunityList(null);
    toast({
      title: "List cloned to My Lists",
      description: `Imported "${communityList.title}" with ${result.importedCount} works.`,
    });
  };

  const handleAddEntryToLibrary = (entry: CommunityWorkEntry) => {
    addCommunityWorkToLibrary(entry);
    loadLibrary();
    toast({
      title: "Work added to library",
      description: `"${entry.title}" is now tracked in your Vault.`,
    });
  };

  return (
    <PageContainer maxWidth="wide">
      {/* Top Heading */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)] flex items-center gap-3">
            <ListFilter className="h-7 w-7 text-[var(--gm-accent-strong)]" />
            <span>Curated Lists</span>
          </h1>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
            Explore reading lists curated by fellow readers, or organize your own personal fiction collections.
          </p>
        </div>

        <Button onClick={() => setCreateListModalOpen(true)} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>New List</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "my-lists" | "explore")} className="space-y-6">
        <TabsList className="bg-[var(--gm-surface)] border border-[var(--gm-border)] h-auto min-h-11 px-3 py-1.5 gap-4 flex-wrap">
          <TabsTrigger value="explore" className="gap-2 px-3 py-1.5">
            <Users className="h-4 w-4 shrink-0 text-[var(--gm-accent-strong)]" />
            <span>Explore Community Lists</span>
            <Badge variant="default" className="ml-1 text-[10px] px-1.5 py-0 bg-[var(--gm-accent)]/20 text-[var(--gm-accent-strong)] shrink-0">
              {communityLists.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="my-lists" className="gap-2 px-3 py-1.5">
            <BookOpen className="h-4 w-4 shrink-0 text-[var(--gm-accent-strong)]" />
            <span>My Lists</span>
            <span className="text-[10px] font-mono text-[var(--gm-text-subtle)] shrink-0">
              ({myLists.length})
            </span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: EXPLORE COMMUNITY LISTS ─── */}
        <TabsContent value="explore" className="space-y-6">
          {/* Search & Genre Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between p-4 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--gm-text-subtle)]" />
              <Input
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
                placeholder="Search community lists by title, curator, work name, or theme…"
                className="pl-9 text-gm-xs bg-[var(--gm-surface)]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
              {allCommunityGenres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setCommunityGenreFilter(g)}
                  className={`rounded-gm-full px-3 py-1 text-[11px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    communityGenreFilter === g
                      ? "bg-[var(--gm-accent)] text-white"
                      : "bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] border border-[var(--gm-border)]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Community Lists Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunityLists.map((list) => (
              <div
                key={list.id}
                className="flex flex-col justify-between overflow-hidden rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] hover:border-[var(--gm-border-strong)] transition-all shadow-sm group"
              >
                <div className="p-5">
                  {/* Curator Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-[var(--gm-accent)]/20 border border-[var(--gm-accent)]/30 flex items-center justify-center text-[10px] font-bold text-[var(--gm-accent-strong)]">
                        {list.curator.name[0]}
                      </div>
                      <span className="text-gm-xs font-medium text-[var(--gm-text)]">
                        {list.curator.name}
                      </span>
                      {list.curator.verified && (
                        <Check className="h-3 w-3 text-sky-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--gm-text-subtle)] font-mono">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3 text-rose-400/80" /> {list.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {list.followersCount}
                      </span>
                    </div>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-gm-base font-bold text-[var(--gm-text)] group-hover:text-[var(--gm-accent-strong)] transition-colors">
                    {list.title}
                  </h3>
                  <p className="mt-1 text-gm-xs text-[var(--gm-text-muted)] line-clamp-2 leading-relaxed">
                    {list.description}
                  </p>

                  {/* Genres / Tags */}
                  <div className="mt-3 flex flex-wrap gap-1">
                    {list.genres.slice(0, 3).map((g) => (
                      <span
                        key={g}
                        className="rounded-gm-full bg-[var(--gm-surface)] px-2 py-0.5 text-[10px] text-[var(--gm-text-muted)] border border-[var(--gm-border)]"
                      >
                        {g}
                      </span>
                    ))}
                  </div>

                  {/* Preview Coers Carousel */}
                  <div className="mt-4 flex items-center gap-2 overflow-x-hidden pt-2 border-t border-[var(--gm-border)]/50">
                    {list.items.slice(0, 4).map((entry) => (
                      <div
                        key={entry.id}
                        className="h-20 w-14 shrink-0 rounded-xs overflow-hidden border border-[var(--gm-border)] bg-[var(--gm-surface)] relative group/cover"
                        title={entry.title}
                      >
                        <Cover
                          title={entry.title}
                          src={entry.coverRef ?? null}
                          size="sm"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                    {list.items.length > 4 && (
                      <div className="h-20 w-10 shrink-0 rounded-xs border border-dashed border-[var(--gm-border)] flex items-center justify-center text-[10px] font-mono text-[var(--gm-text-subtle)] bg-[var(--gm-surface)]/30">
                        +{list.items.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-[var(--gm-surface)]/60 border-t border-[var(--gm-border)] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[var(--gm-text-subtle)]">
                    {list.items.length} works curated
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCommunityList(list)}
                      className="text-gm-xs"
                    >
                      View Details
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleCloneList(list)}
                      className="gap-1.5 text-gm-xs"
                    >
                      <Copy className="h-3 w-3" />
                      <span>Clone</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredCommunityLists.length === 0 && (
              <div className="col-span-full py-16 text-center">
                <Search className="h-8 w-8 text-[var(--gm-text-subtle)] mx-auto mb-2" />
                <p className="text-gm-sm text-[var(--gm-text-muted)]">
                  No community lists found matching &quot;{communitySearchQuery}&quot;.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCommunitySearchQuery("");
                    setCommunityGenreFilter("All");
                  }}
                  className="mt-3"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 2: MY PERSONAL LISTS ─── */}
        <TabsContent value="my-lists">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 4 cols: list selector */}
            <div className="lg:col-span-4 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 shadow-sm space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[var(--gm-border)]">
                <span className="text-gm-xs font-bold uppercase tracking-wider text-[var(--gm-text-subtle)]">
                  Your Collections
                </span>
                <span className="text-[11px] font-mono text-[var(--gm-text-subtle)]">
                  {myLists.filter((l) => isVaultUnlocked || (l.privacyState !== PrivacyState.Vault && !l.title.toLowerCase().includes("vault"))).length} lists
                </span>
              </div>

              <div className="space-y-1.5">
                {myLists.filter((list) => isVaultUnlocked || (list.privacyState !== PrivacyState.Vault && !list.title.toLowerCase().includes("vault"))).map((list) => {
                  const isSelected = activePersonalList?.id === list.id;
                  return (
                    <div
                      key={list.id}
                      onClick={() => setSelectedListId(list.id)}
                      className={`group flex items-start justify-between p-3 rounded-gm-lg border transition-all cursor-pointer ${
                        isSelected
                          ? "border-[var(--gm-accent)] bg-[var(--gm-surface)] shadow-xs"
                          : "border-[var(--gm-border)] bg-[var(--gm-surface)]/30 hover:bg-[var(--gm-surface)]"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="font-semibold text-gm-sm text-[var(--gm-text)] truncate">
                          {list.title}
                        </h4>
                        <p className="text-[11px] text-[var(--gm-text-muted)] mt-0.5">
                          {list.items.length} works · {list.privacyState}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteList(list.id);
                          toast({ title: "List deleted" });
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[var(--gm-text-subtle)] hover:text-[var(--gm-danger)]"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                {myLists.length === 0 && (
                  <div className="p-8 text-center text-gm-xs text-[var(--gm-text-muted)]">
                    No lists created yet.
                  </div>
                )}
              </div>
            </div>

            {/* Right 8 cols: list items */}
            <div className="lg:col-span-8 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-sm">
              {activePersonalList ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-[var(--gm-border)]">
                    <div>
                      <h2 className="text-gm-xl font-bold text-[var(--gm-text)]">
                        {activePersonalList.title}
                      </h2>
                      {activePersonalList.description && (
                        <p className="mt-1 text-gm-xs text-[var(--gm-text-muted)]">
                          {activePersonalList.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditListOpen(true)} className="gap-1.5">
                        <Pencil className="h-3.5 w-3.5" /> Edit list
                      </Button>
                      <Badge variant="default">
                        {activePersonalList.items.length} Works
                      </Badge>
                    </div>
                  </div>

                  {/* List entries */}
                  {activePersonalList.items.length > 0 ? (
                    <div className="space-y-3">
                      {activePersonalList.items.map((item, index) => {
                        const libItem = libraryItems.find((l) => l.work.id === item.workId);
                        const work = libItem?.work;

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] hover:border-[var(--gm-border-strong)] transition-all"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-gm-xs text-[var(--gm-text-subtle)] w-5 text-right">
                                #{index + 1}
                              </span>
                              {work ? (
                                <Cover
                                  title={work.title}
                                  src={work.coverRef ?? null}
                                  size="sm"
                                  className="h-12 w-9 rounded-xs object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-12 w-9 rounded-xs bg-[var(--gm-surface-raised)] shrink-0" />
                              )}
                              <div className="min-w-0">
                                <h4
                                  onClick={() => work && onNavigateWork?.(work.id)}
                                  className="font-semibold text-gm-sm text-[var(--gm-text)] hover:text-[var(--gm-accent-strong)] transition-colors cursor-pointer truncate"
                                >
                                  {work?.title ?? item.workId}
                                </h4>
                                {item.personalNote && (
                                  <p className="text-[11px] text-[var(--gm-text-muted)] italic line-clamp-1">
                                    &ldquo;{item.personalNote}&rdquo;
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {work && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => onNavigateWork?.(work.id)}
                                  className="text-gm-xs gap-1"
                                >
                                  <span>View</span>
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              )}
                              <button
                                type="button"
                                onClick={() => moveListItem(activePersonalList.id, item.id, "up")}
                                disabled={index === 0}
                                className="p-1.5 rounded text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] disabled:opacity-30"
                                title="Move up"
                                aria-label={`Move ${work?.title ?? item.workId} up`}
                              >
                                <ChevronUp className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveListItem(activePersonalList.id, item.id, "down")}
                                disabled={index === activePersonalList.items.length - 1}
                                className="p-1.5 rounded text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] disabled:opacity-30"
                                title="Move down"
                                aria-label={`Move ${work?.title ?? item.workId} down`}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setNoteEntryId(item.id)}
                                className="p-1.5 rounded text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)]"
                                title="Edit note"
                                aria-label={`Edit note for ${work?.title ?? item.workId}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeWorkFromList(activePersonalList.id, item.workId)}
                                className="p-1.5 rounded text-[var(--gm-text-subtle)] hover:text-[var(--gm-danger)]"
                                title="Remove from list"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <EmptyState
                      variant="library"
                      actionLabel="Explore Community Lists to Clone"
                      onAction={() => setActiveTab("explore")}
                    />
                  )}

                  <PublicationPanel key={activePersonalList.id} list={activePersonalList} />

                  <EditListDialog
                    open={editListOpen}
                    onOpenChange={setEditListOpen}
                    list={activePersonalList}
                  />
                  <ItemNoteDialog
                    open={noteEntryId !== null}
                    onOpenChange={(open) => !open && setNoteEntryId(null)}
                    listId={activePersonalList.id}
                    item={activePersonalList.items.find((candidate) => candidate.id === noteEntryId) ?? null}
                    workTitle={
                      libraryItems.find(
                        (candidate) =>
                          candidate.work.id ===
                          activePersonalList.items.find((entry) => entry.id === noteEntryId)?.workId,
                      )?.work.title ?? "this work"
                    }
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-[var(--gm-text-muted)]">
                  Select a list to view its works.
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Community List Detail Modal */}
      <Dialog
        open={Boolean(selectedCommunityList)}
        onOpenChange={(open) => !open && setSelectedCommunityList(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          {selectedCommunityList && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 text-[11px] text-[var(--gm-text-subtle)] font-mono">
                  <span>Curated by {selectedCommunityList.curator.name}</span>
                  <span>·</span>
                  <span>{selectedCommunityList.items.length} works</span>
                </div>
                <DialogTitle className="text-gm-xl">{selectedCommunityList.title}</DialogTitle>
                <DialogDescription className="text-gm-xs">
                  {selectedCommunityList.description}
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1 my-2">
                {selectedCommunityList.items.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)]"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span className="font-mono text-gm-xs text-[var(--gm-text-subtle)] mt-1">
                        #{idx + 1}
                      </span>
                      <Cover
                        title={entry.title}
                        src={entry.coverRef ?? null}
                        size="sm"
                        className="h-14 w-10 shrink-0 rounded-xs object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="font-semibold text-gm-sm text-[var(--gm-text)]">
                          {entry.title}
                        </h4>
                        <p className="text-[10px] text-[var(--gm-text-muted)]">
                          {entry.contentType} · {entry.genres.slice(0, 3).join(", ")}
                        </p>
                        {entry.curatorNote && (
                          <p className="mt-1 text-[11px] text-[var(--gm-accent-strong)] italic">
                            &ldquo;{entry.curatorNote}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddEntryToLibrary(entry)}
                      className="gap-1.5 shrink-0 text-gm-xs"
                    >
                      <BookmarkPlus className="h-3.5 w-3.5" />
                      <span>Add to Vault</span>
                    </Button>
                  </div>
                ))}
              </div>

              <DialogFooter className="border-t border-[var(--gm-border)] pt-3 flex items-center justify-between sm:justify-between w-full">
                <span className="text-[11px] text-[var(--gm-text-subtle)]">
                  {selectedCommunityList.likesCount} readers saved this list
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedCommunityList(null)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => handleCloneList(selectedCommunityList)}
                    className="gap-1.5"
                  >
                    <Copy className="h-4 w-4" />
                    <span>Clone List</span>
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create List Modal */}
      <Dialog open={createListModalOpen} onOpenChange={setCreateListModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Reading List</DialogTitle>
            <DialogDescription>
              Organize works into a custom reading collection or recommendation list.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateList} className="space-y-4 py-2">
            <div>
              <label className="block text-gm-xs font-semibold text-[var(--gm-text)] mb-1">
                List Title *
              </label>
              <Input
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                placeholder="e.g. Best Time Loop Novels, Top 10 Webtoons…"
                required
              />
            </div>

            <div>
              <label className="block text-gm-xs font-semibold text-[var(--gm-text)] mb-1">
                Description
              </label>
              <textarea
                value={newListDesc}
                onChange={(e) => setNewListDesc(e.target.value)}
                placeholder="What is this list about?"
                rows={3}
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-xs text-[var(--gm-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-border-focus)]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateListModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create List</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
