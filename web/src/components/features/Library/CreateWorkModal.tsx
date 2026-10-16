import * as React from "react";
import { BookPlus, Globe, Sparkles } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@chronicles-vault/ui";
import {
  ContentOrigin,
  ContentType,
  PersonalState,
  PrivacyState,
  PublicationState,
  normalizeUrl,
} from "@chronicles-vault/domain";
import { useLibraryStore } from "@chronicles-vault/state";
import { WorkItemData } from "./VirtualWorkGrid";

export interface CreateWorkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkCreated?: (work: WorkItemData) => void;
  initialTitle?: string;
  initialSourceUrl?: string;
}

export function CreateWorkModal({
  open,
  onOpenChange,
  onWorkCreated,
  initialTitle = "",
  initialSourceUrl = "",
}: CreateWorkModalProps) {
  const [title, setTitle] = React.useState("");
  const [alternativeTitles, setAlternativeTitles] = React.useState("");
  const [contentType, setContentType] = React.useState<ContentType>(ContentType.Manga);
  const [origin, setOrigin] = React.useState<ContentOrigin>(ContentOrigin.Japanese);
  const [synopsis, setSynopsis] = React.useState("");
  const [personalState, setPersonalState] = React.useState<PersonalState>(PersonalState.Reading);
  const [initialChapter, setInitialChapter] = React.useState("1");
  const [providerName, setProviderName] = React.useState("");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setTitle(initialTitle);
    setSourceUrl(initialSourceUrl);
    if (initialSourceUrl) {
      try {
        setProviderName(new URL(initialSourceUrl).hostname);
      } catch {
        setProviderName("");
      }
    } else {
      setProviderName("");
    }
  }, [open, initialTitle, initialSourceUrl]);

  const resetForm = () => {
    setTitle("");
    setAlternativeTitles("");
    setContentType(ContentType.Manga);
    setOrigin(ContentOrigin.Japanese);
    setSynopsis("");
    setPersonalState(PersonalState.Reading);
    setInitialChapter("1");
    setProviderName("");
    setSourceUrl("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Canonical title is required");
      return;
    }

    const chapterNum = parseFloat(initialChapter) || 1;
    const altList = alternativeTitles
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    let initialPath: { provider: string; url: string; label: string } | undefined;
    if (sourceUrl.trim()) {
      const normalized = normalizeUrl(sourceUrl);
      if (!normalized.isValid) {
        setError("Source URL must be a valid HTTP or HTTPS address");
        return;
      }
      const label = providerName.trim() || normalized.hostname;
      initialPath = { provider: label, url: normalized.normalizedUrl, label };
    }

    let created;
    try {
      created = useLibraryStore.getState().createWork(
        {
          title: title.trim(),
          alternativeTitles: altList,
          aliases: [],
          description: synopsis.trim() || null,
          contentType,
          origin,
          publicationState: PublicationState.Unknown,
          privacyState: PrivacyState.Public,
          coverRef: null,
          externalIds: [],
          genres: [],
          tags: [],
        },
        personalState,
        { type: "chapter", chapter: chapterNum, title: `Chapter ${chapterNum}` },
        initialPath,
      );
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Unable to add this work to the library.",
      );
      return;
    }

    const newWork: WorkItemData = {
      id: created.work.id,
      title: created.work.title,
      coverSrc: created.work.coverRef,
      contentType: created.work.contentType,
      personalState: created.relationship?.personalState,
      progressAnchor: { type: "chapter", chapter: chapterNum },
      progressPercentage: personalState === PersonalState.Completed ? 100 : 0,
      newMaterialCount: 0,
      sourceHealth: created.accessPaths.length > 0 ? "healthy" : "unknown",
      updatedAt: created.work.updatedAt,
      genres: created.work.genres,
    };

    onWorkCreated?.(newWork);

    toast({
      title: "Work Added to Library",
      description: `"${newWork.title}" has been created and set to ${personalState}.`,
      variant: "success",
    });

    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-[var(--cv-accent-strong)]">
            <BookPlus className="h-5 w-5" />
            <DialogTitle>Add Work to Library</DialogTitle>
          </div>
          <DialogDescription>
            Register a canonical work with format, origin, reading state, and initial tracking
            source.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Canonical Title */}
          <Input
            label="Canonical Title *"
            placeholder="e.g. Omniscient Reader’s Viewpoint"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            autoFocus
          />

          {/* Alternative Titles */}
          <Input
            label="Alternative Titles (comma-separated)"
            placeholder="e.g. ORV, 전지적 독자 시점, Jeonjijeok Dokja Sijeom"
            value={alternativeTitles}
            onChange={(e) => setAlternativeTitles(e.target.value)}
            hint="Used for deduplication, search indexing, and multi-source matching."
          />

          {/* Content Type & Origin Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-cv-xs font-medium text-[var(--cv-text-muted)] select-none">
                Format / Content Type
              </label>
              <Select
                value={contentType}
                onValueChange={(val) => setContentType(val as ContentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ContentType.Manga}>Manga</SelectItem>
                  <SelectItem value={ContentType.Manhwa}>Manhwa</SelectItem>
                  <SelectItem value={ContentType.Manhua}>Manhua</SelectItem>
                  <SelectItem value={ContentType.Webtoon}>Webtoon</SelectItem>
                  <SelectItem value={ContentType.LightNovel}>Light Novel</SelectItem>
                  <SelectItem value={ContentType.WebNovel}>Web Novel</SelectItem>
                  <SelectItem value={ContentType.WesternNovel}>Western Novel</SelectItem>
                  <SelectItem value={ContentType.Anime}>Anime</SelectItem>
                  <SelectItem value={ContentType.Donghua}>Donghua</SelectItem>
                  <SelectItem value={ContentType.EPUB}>EPUB File</SelectItem>
                  <SelectItem value={ContentType.PDF}>PDF Document</SelectItem>
                  <SelectItem value={ContentType.CBZ}>CBZ Comic Archive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-cv-xs font-medium text-[var(--cv-text-muted)] select-none">
                Cultural Origin
              </label>
              <Select value={origin} onValueChange={(val) => setOrigin(val as ContentOrigin)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select origin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ContentOrigin.Japanese}>Japanese</SelectItem>
                  <SelectItem value={ContentOrigin.Korean}>Korean</SelectItem>
                  <SelectItem value={ContentOrigin.Chinese}>Chinese</SelectItem>
                  <SelectItem value={ContentOrigin.Western}>Western</SelectItem>
                  <SelectItem value={ContentOrigin.Original}>Original</SelectItem>
                  <SelectItem value={ContentOrigin.Unknown}>Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Initial Personal State & Initial Anchor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-cv-xs font-medium text-[var(--cv-text-muted)] select-none">
                Initial Personal State
              </label>
              <Select
                value={personalState}
                onValueChange={(val) => setPersonalState(val as PersonalState)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PersonalState.Reading}>Reading</SelectItem>
                  <SelectItem value={PersonalState.Planned}>Plan to Read</SelectItem>
                  <SelectItem value={PersonalState.Waiting}>Waiting for Updates</SelectItem>
                  <SelectItem value={PersonalState.Paused}>Paused / Backlog</SelectItem>
                  <SelectItem value={PersonalState.CaughtUp}>Caught Up</SelectItem>
                  <SelectItem value={PersonalState.Completed}>Completed</SelectItem>
                  <SelectItem value={PersonalState.Dropped}>Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              label="Starting Chapter / Anchor"
              type="number"
              step="any"
              min="0"
              placeholder="1"
              value={initialChapter}
              onChange={(e) => setInitialChapter(e.target.value)}
              hint="Your current reading checkpoint position."
            />
          </div>

          {/* Synopsis */}
          <div className="flex flex-col gap-1.5">
            <label className="text-cv-xs font-medium text-[var(--cv-text-muted)] select-none">
              Synopsis / Description
            </label>
            <textarea
              rows={3}
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="Brief overview or plot summary..."
              className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--cv-border-focus)] transition-colors"
            />
          </div>

          {/* Initial Access Path (Source Provider & URL) */}
          <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-surface)]/40 p-3.5 space-y-3">
            <div className="flex items-center gap-2 text-cv-xs font-semibold text-[var(--cv-text)]">
              <Globe className="h-4 w-4 text-[var(--cv-accent-strong)]" />
              <span>Initial Access Path / Tracking Source (Optional)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Source Provider"
                placeholder="e.g. MangaDex, Webtoons, RSS"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
              />
              <Input
                label="Direct URL"
                placeholder="https://..."
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" variant="default" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Create Work</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
