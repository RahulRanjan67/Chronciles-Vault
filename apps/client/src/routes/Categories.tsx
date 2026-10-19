import * as React from "react";
import {
  FolderPlus,
  Plus,
  Search,
  Tag,
  Trash2,
  Edit2,
  Check,
  BookOpen,
  ArrowRight,
  Filter,
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
  toast,
} from "@grimoire/ui";
import {
  useCategoriesStore,
  useLibraryStore,
  type CustomCategory,
} from "@grimoire/state";

export interface CategoriesProps {
  onNavigateWork?: (workId: string) => void;
  onBack?: () => void;
}

const COLOR_MAP: Record<
  CustomCategory["color"],
  { bg: string; text: string; border: string; pill: string }
> = {
  indigo: {
    bg: "bg-indigo-500/10",
    text: "text-indigo-400",
    border: "border-indigo-500/30",
    pill: "bg-indigo-500 text-white",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-400",
    border: "border-amber-500/30",
    pill: "bg-amber-500 text-white",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/30",
    pill: "bg-rose-500 text-white",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
    pill: "bg-emerald-500 text-white",
  },
  sky: {
    bg: "bg-sky-500/10",
    text: "text-sky-400",
    border: "border-sky-500/30",
    pill: "bg-sky-500 text-white",
  },
  purple: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/30",
    pill: "bg-purple-500 text-white",
  },
  orange: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/30",
    pill: "bg-orange-500 text-white",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
    pill: "bg-cyan-500 text-white",
  },
};

export function Categories({ onNavigateWork }: CategoriesProps) {
  const {
    categories,
    selectedCategoryId,
    setSelectedCategoryId,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleWorkInCategory,
  } = useCategoriesStore();

  const { items: libraryItems, refresh: loadLibrary } = useLibraryStore();

  const [search, setSearch] = React.useState("");
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<CustomCategory | null>(null);
  const [assignModalOpen, setAssignModalOpen] = React.useState(false);

  // Form State
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState<CustomCategory["color"]>("indigo");

  React.useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const activeCategory =
    categories.find((c) => c.id === selectedCategoryId) ?? categories[0] ?? null;

  const categoryWorks = React.useMemo(() => {
    if (!activeCategory) return [];
    return libraryItems.filter((item) => activeCategory.workIds.includes(item.work.id));
  }, [activeCategory, libraryItems]);

  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    );
  }, [categories, search]);

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setName("");
    setDescription("");
    setColor("indigo");
    setCreateModalOpen(true);
  };

  const handleOpenEdit = (cat: CustomCategory, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description);
    setColor(cat.color);
    setCreateModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        color,
      });
      toast({ title: "Category updated", description: `Updated ${name.trim()}` });
    } else {
      const created = createCategory({
        name: name.trim(),
        description: description.trim(),
        color,
      });
      setSelectedCategoryId(created.id);
      toast({ title: "Category created", description: `Added ${name.trim()}` });
    }
    setCreateModalOpen(false);
  };

  const handleDeleteCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCategory(catId);
    toast({ title: "Category deleted" });
  };

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)] flex items-center gap-3">
            <Tag className="h-7 w-7 text-[var(--gm-accent-strong)]" />
            <span>My Categories</span>
          </h1>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
            Create custom genre categorizations, thematic tags, and curated reading shelves.
          </p>
        </div>

        <Button onClick={handleOpenCreate} className="gap-2 shrink-0 self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          <span>New Category</span>
        </Button>
      </div>

      {/* Main Two-Pane View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Categories List (5 cols) */}
        <div className="lg:col-span-4 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--gm-text-subtle)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter categories…"
              className="pl-9 text-gm-xs bg-[var(--gm-surface)]"
            />
          </div>

          <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {filteredCategories.map((cat) => {
              const isSelected = activeCategory?.id === cat.id;
              const colorInfo = COLOR_MAP[cat.color] || COLOR_MAP.indigo;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`group flex items-start justify-between p-3 rounded-gm-lg border transition-all cursor-pointer select-none ${
                    isSelected
                      ? "border-[var(--gm-accent)] bg-[var(--gm-surface)] shadow-xs"
                      : "border-[var(--gm-border)] bg-[var(--gm-surface)]/40 hover:bg-[var(--gm-surface)] hover:border-[var(--gm-border-strong)]"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${colorInfo.pill}`}
                      />
                      <span className="font-semibold text-gm-sm text-[var(--gm-text)] truncate">
                        {cat.name}
                      </span>
                      <span className="text-[10px] font-mono text-[var(--gm-text-subtle)]">
                        ({cat.workIds.length})
                      </span>
                    </div>
                    {cat.description && (
                      <p className="text-[11px] text-[var(--gm-text-muted)] line-clamp-1 leading-snug">
                        {cat.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEdit(cat, e)}
                      title="Edit Category"
                      className="p-1 rounded text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface-raised)]"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCategory(cat.id, e)}
                      title="Delete Category"
                      className="p-1 rounded text-[var(--gm-text-subtle)] hover:text-[var(--gm-danger)] hover:bg-[var(--gm-surface-raised)]"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCategories.length === 0 && (
              <div className="p-6 text-center text-gm-xs text-[var(--gm-text-muted)]">
                No categories found matching &quot;{search}&quot;.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Category Details & Assigned Works (8 cols) */}
        <div className="lg:col-span-8 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-sm">
          {activeCategory ? (
            <div>
              {/* Category Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-[var(--gm-border)]">
                <div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full ${
                        COLOR_MAP[activeCategory.color]?.pill ?? "bg-indigo-500"
                      }`}
                    />
                    <h2 className="text-gm-xl font-bold text-[var(--gm-text)]">
                      {activeCategory.name}
                    </h2>
                    <span className="rounded-gm-full bg-[var(--gm-surface)] px-2 py-0.5 text-gm-xs text-[var(--gm-text-muted)] border border-[var(--gm-border)] font-mono">
                      {activeCategory.workIds.length} works
                    </span>
                  </div>
                  {activeCategory.description && (
                    <p className="mt-2 text-gm-xs text-[var(--gm-text-muted)] leading-relaxed">
                      {activeCategory.description}
                    </p>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAssignModalOpen(true)}
                  className="gap-2 shrink-0 self-start sm:self-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Assign Works</span>
                </Button>
              </div>

              {/* Works in this category */}
              {categoryWorks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryWorks.map(({ work, relationship }) => (
                    <div
                      key={work.id}
                      onClick={() => onNavigateWork?.(work.id)}
                      className="group flex flex-col overflow-hidden rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] hover:border-[var(--gm-border-strong)] transition-all cursor-pointer shadow-xs"
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[var(--gm-bg)]">
                        <Cover
                          title={work.title}
                          src={work.coverRef ?? null}
                          size="lg"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 right-2">
                          <span className="rounded-gm-sm bg-black/70 backdrop-blur-xs px-1.5 py-0.5 text-[10px] font-mono text-white uppercase">
                            {work.contentType}
                          </span>
                        </div>
                      </div>

                      <div className="p-3 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-gm-sm text-[var(--gm-text)] group-hover:text-[var(--gm-accent-strong)] transition-colors line-clamp-1">
                            {work.title}
                          </h4>
                          {relationship?.currentAnchor && (
                            <p className="text-[11px] text-[var(--gm-text-muted)] font-mono mt-0.5">
                              {relationship.currentAnchor.type === "chapter"
                                ? `Ch. ${relationship.currentAnchor.chapter}`
                                : ('title' in relationship.currentAnchor ? relationship.currentAnchor.title as string : null) ?? "Reading"}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--gm-text-subtle)] pt-2 border-t border-[var(--gm-border)]/50">
                          <span className="capitalize">{relationship?.personalState ?? "Saved"}</span>
                          <span className="flex items-center gap-1 text-[var(--gm-accent-strong)] font-medium">
                            View <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  variant="library"
                  actionLabel="Assign Works Now"
                  onAction={() => setAssignModalOpen(true)}
                />
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-[var(--gm-text-muted)]">
              Select or create a category to view works.
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Custom Category"}
            </DialogTitle>
            <DialogDescription>
              Create a custom genre, mood, or classification for your library works.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCategory} className="space-y-4 py-2">
            <div>
              <label className="block text-gm-xs font-semibold text-[var(--gm-text)] mb-1">
                Category Name *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grimdark Fantasy, Comfort Reads…"
                required
              />
            </div>

            <div>
              <label className="block text-gm-xs font-semibold text-[var(--gm-text)] mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What distinguishes this category?"
                rows={2}
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-xs text-[var(--gm-text)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gm-border-focus)]"
              />
            </div>

            <div>
              <label className="block text-gm-xs font-semibold text-[var(--gm-text)] mb-2">
                Color Tag Accent
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(COLOR_MAP) as CustomCategory["color"][]).map((cKey) => {
                  const isSelected = color === cKey;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setColor(cKey)}
                      className={`flex items-center gap-2 p-2 rounded-cv border text-gm-xs capitalize transition-all ${
                        isSelected
                          ? "border-[var(--gm-text)] ring-1 ring-[var(--gm-text)] font-semibold"
                          : "border-[var(--gm-border)] hover:bg-[var(--gm-surface)]"
                      }`}
                    >
                      <span className={`h-3 w-3 rounded-full ${COLOR_MAP[cKey].pill}`} />
                      <span>{cKey}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Works Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Works to &quot;{activeCategory?.name}&quot;</DialogTitle>
            <DialogDescription>
              Toggle which works from your library belong in this custom category.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-80 overflow-y-auto space-y-1.5 py-2 pr-1">
            {libraryItems.map(({ work }) => {
              if (!activeCategory) return null;
              const isAssigned = activeCategory.workIds.includes(work.id);

              return (
                <div
                  key={work.id}
                  onClick={() => toggleWorkInCategory(activeCategory.id, work.id)}
                  className={`flex items-center justify-between p-2.5 rounded-cv border transition-all cursor-pointer ${
                    isAssigned
                      ? "border-[var(--gm-accent)] bg-[var(--gm-surface)]"
                      : "border-[var(--gm-border)] hover:bg-[var(--gm-surface)]/60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Cover
                      title={work.title}
                      src={work.coverRef ?? null}
                      size="sm"
                      className="h-10 w-8 shrink-0 object-cover rounded-xs"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gm-xs text-[var(--gm-text)] truncate">
                        {work.title}
                      </p>
                      <p className="text-[10px] text-[var(--gm-text-muted)]">
                        {work.contentType} · {work.genres.slice(0, 2).join(", ")}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`h-5 w-5 rounded flex items-center justify-center border transition-colors ${
                      isAssigned
                        ? "bg-[var(--gm-accent)] border-[var(--gm-accent)] text-white"
                        : "border-[var(--gm-border)]"
                    }`}
                  >
                    {isAssigned && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setAssignModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
