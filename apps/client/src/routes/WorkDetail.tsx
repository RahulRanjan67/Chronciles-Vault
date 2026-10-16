import * as React from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ExternalLink,
  Minus,
  Plus,
  RefreshCw,
  Share2,
  Star,
  Trash2,
  Check,
  Archive as ArchiveIcon,
  GitMerge,
  Network,
  Upload,
  Link as LinkIcon,
  Film,
  Pencil,
  Play,
  Copy,
  Image as ImageIcon,
  Heart,
  Music,
  Headphones,
  SkipBack,
  SkipForward,
  Youtube,
  Instagram,
} from "lucide-react";
import {
  Badge,
  Button,
  Cover,
  Input,
  MemoryCard,
  PageContainer,
  PersonalStateChip,
  ProgressBar,
  ProgressDisplay,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SourceHealthIndicator,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  relativeTime,
  toast,
} from "@chronicles-vault/ui";
import {
  clientRepository,
  useFandomLinksStore,
  useFanCreationsStore,
  useLibraryStore,
  useNotebookStore,
  useWorkDetailStore,
} from "@chronicles-vault/state";
import {
  PersonalState,
  PrivacyState,
  formatProgressAnchor,
  AccessCapability,
  MemoryType,
  MemoryAssetType,
  ContentType,
  type ContentRating,
  type ShelfPriorityTier,
  type WorkCreator,
  type WorkCreatorRole,
} from "@chronicles-vault/domain";
import type { MemoryId, WorkId } from "@chronicles-vault/shared";
import { toUIHealth, toUIMemoryType } from "../utils/display-adapters";
import { ArchiveWorkModal } from "../components/features/Archive/ArchiveWorkModal";
import { MergeWizardModal } from "../components/features/Merge/MergeWizardModal";
import { WorkRelationTree } from "../components/features/Relations/WorkRelationTree";
import { WorkNotebookPanel } from "../components/features/WorkDetail/WorkNotebookPanel";
import { WorkFandomLinksPanel } from "../components/features/WorkDetail/WorkFandomLinksPanel";
import { ResumeReadingModal } from "../components/features/Reader";
import { seedDemoShelfFiles } from "../utils/demo-shelf-files";

export interface WorkDetailProps {
  workId?: string;
  onBack?: () => void;
  onNavigateWork?: (workId: string) => void;
  onResumeReader?: (id: string, accessPathId?: string) => void;
  onOpenFile?: (id: string) => void;
}

const PERSONAL_STATE_OPTIONS: Array<{ value: PersonalState; label: string }> = [
  { value: PersonalState.Reading, label: "Reading" },
  { value: PersonalState.Watching, label: "Watching" },
  { value: PersonalState.Planned, label: "Plan to Read" },
  { value: PersonalState.Paused, label: "Paused" },
  { value: PersonalState.Waiting, label: "Waiting for Updates" },
  { value: PersonalState.Stalled, label: "Stalled" },
  { value: PersonalState.Rereading, label: "Re-reading" },
  { value: PersonalState.CaughtUp, label: "Caught Up" },
  { value: PersonalState.Completed, label: "Completed" },
  { value: PersonalState.Dropped, label: "Dropped" },
];

const SHELF_TIER_OPTIONS: Array<{ value: ShelfPriorityTier; label: string }> = [
  { value: "standard", label: "Standard" },
  { value: "favorite", label: "★ Favorite" },
  { value: "highlight", label: "✦ Highlight" },
  { value: "priority_watch", label: "⚡ Priority Watch" },
];

export function WorkDetail({
  workId = "work-orv",
  onBack,
  onNavigateWork,
  onResumeReader,
  onOpenFile,
}: WorkDetailProps) {
  const {
    loadWork,
    clearWork,
    activeItem,
    relations,
    updatePersonalState,
    advanceChapter,
    addAccessPath,
    deleteAccessPath,
    setPreferredAccessPath,
    checkAccessPathHealth,
    addMemory,
    updateCover,
  } = useWorkDetailStore();
  const updateWorkInLibrary = useLibraryStore((state) => state.updateWork);
  const updateRelationshipInLibrary = useLibraryStore((state) => state.updateRelationship);

  const [activeTab, setActiveTab] = React.useState("overview");
  const [checkingPathId, setCheckingPathId] = React.useState<string | null>(null);
  const [newSourceLabel, setNewSourceLabel] = React.useState("");
  const [newSourceUrl, setNewSourceUrl] = React.useState("");
  const [newSourceProvider, setNewSourceProvider] = React.useState("");
  const [showLinkVideo, setShowLinkVideo] = React.useState(false);
  const [videoLabel, setVideoLabel] = React.useState("");
  const [videoPath, setVideoPath] = React.useState("");
  const [videoSizeBytes, setVideoSizeBytes] = React.useState<number>(0);
  const [videoMimeType, setVideoMimeType] = React.useState("video/mp4");
  const [pendingVideoFile, setPendingVideoFile] = React.useState<File | null>(null);
  const [videoObjectUrls, setVideoObjectUrls] = React.useState<Record<string, string>>({});
  const [activeVideoPathId, setActiveVideoPathId] = React.useState<string | null>(null);
  const [reattachTargetPathId, setReattachTargetPathId] = React.useState<string | null>(null);
  const videoFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const reattachVideoInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    return () => {
      Object.values(videoObjectUrls).forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const [newMemoryBody, setNewMemoryBody] = React.useState("");
  const [newMemoryTitle, setNewMemoryTitle] = React.useState("");
  const [newMemoryAttemptId, setNewMemoryAttemptId] = React.useState("");
  const [showAddSource, setShowAddSource] = React.useState(false);
  const [showAddMemory, setShowAddMemory] = React.useState(false);
  const [editingMetadata, setEditingMetadata] = React.useState(false);
  const [metaRating, setMetaRating] = React.useState("");
  const [metaCreatorName, setMetaCreatorName] = React.useState("");
  const [metaCreatorRole, setMetaCreatorRole] = React.useState<WorkCreatorRole>("author");
  const [metaTotalChapters, setMetaTotalChapters] = React.useState("");
  const [metaTotalVolumes, setMetaTotalVolumes] = React.useState("");
  const [metaTotalPages, setMetaTotalPages] = React.useState("");
  const [metaOriginalTitle, setMetaOriginalTitle] = React.useState("");
  const [metaOriginalLanguage, setMetaOriginalLanguage] = React.useState("");
  const [metaStartDate, setMetaStartDate] = React.useState("");
  const [metaEndDate, setMetaEndDate] = React.useState("");
  const [metaContentRating, setMetaContentRating] = React.useState<ContentRating>("everyone");
  const [metaContentWarnings, setMetaContentWarnings] = React.useState("");

  const [archiveModalOpen, setArchiveModalOpen] = React.useState(false);
  const [mergeModalOpen, setMergeModalOpen] = React.useState(false);
  const [resumeModalOpen, setResumeModalOpen] = React.useState(false);
  const [fetchingCover, setFetchingCover] = React.useState(false);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [customCoverUrl, setCustomCoverUrl] = React.useState("");
  const coverFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Fan Creations store
  const {
    getFanfictionsForWork,
    getVideoEditsForWork,
    getFanArtForWork,
    addVideoEdit,
    addFanArt,
    promoteFanfictionToWork,
    removeFanfiction,
  } = useFanCreationsStore();

  // Fan Creations dialog state
  const [showAddVideoEdit, setShowAddVideoEdit] = React.useState(false);
  const [newVideoEditUrl, setNewVideoEditUrl] = React.useState("");
  const [newVideoEditTitle, setNewVideoEditTitle] = React.useState("");
  const [newVideoEditPlatform, setNewVideoEditPlatform] = React.useState<"youtube" | "tiktok" | "instagram">("youtube");
  const [showAddFanArt, setShowAddFanArt] = React.useState(false);
  const [newFanArtUrl, setNewFanArtUrl] = React.useState("");
  const [newFanArtTitle, setNewFanArtTitle] = React.useState("");
  const [newFanArtArtist, setNewFanArtArtist] = React.useState("");
  const fanArtFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Memory image upload state
  const [pendingMemoryImageUrl, setPendingMemoryImageUrl] = React.useState<string | null>(null);
  const memoryImageInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFetchCoverFromWeb = async () => {
    if (!work) return;
    setFetchingCover(true);
    try {
      const query = `query($search: String) { Media(search: $search, type: MANGA) { coverImage { extraLarge large medium } } }`;
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables: { search: work.title } }),
      });
      const data = await res.json();
      const media = data.data?.Media;
      const coverUrl =
        media?.coverImage?.extraLarge || media?.coverImage?.large || media?.coverImage?.medium;
      if (coverUrl) {
        updateCover(coverUrl);
        toast({
          title: "Cover Updated",
          description: `Official cover fetched from AniList for ${work.title}`,
          variant: "success",
        });
      } else {
        toast({
          title: "Cover Not Found",
          description: "Could not find a cover on AniList. You can upload an image or enter a URL manually.",
          variant: "warning",
        });
      }
    } catch (err) {
      toast({
        title: "Fetch Failed",
        description: err instanceof Error ? err.message : "Network error fetching cover.",
        variant: "destructive",
      });
    } finally {
      setFetchingCover(false);
    }
  };

  const handleUploadCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid File", description: "Please select an image file (PNG, JPG, WebP).", variant: "warning" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateCover(reader.result);
        toast({ title: "Cover Updated", description: "Custom image saved as cover art.", variant: "success" });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResume = async () => {
    const { listLocalFiles } = await import("@chronicles-vault/reader");
    let files = await listLocalFiles().catch(() => []);
    if (files.length === 0) {
      try {
        await seedDemoShelfFiles();
        files = await listLocalFiles();
      } catch {
        // ignore
      }
    }

    // 1. Direct local file linked via accessPaths
    const localPath = accessPaths.find((p) => p.kind === "local_file" && p.fileId);
    if (localPath?.fileId) {
      const matched = files.find((f) => f.id === localPath.fileId);
      if (matched) {
        toast({
          title: "Resuming reading session",
          description: `Opening ${matched.displayName}`,
        });
        if (onOpenFile) onOpenFile(matched.id);
        else window.location.href = `/reader/${encodeURIComponent(matched.id)}`;
        return;
      }
    }

    // 2. Shelf file linked to this work
    const shelfFile = files.find((f) => f.workId === work.id);
    if (shelfFile) {
      toast({
        title: "Resuming reading session",
        description: `Opening ${shelfFile.displayName}`,
      });
      if (onOpenFile) onOpenFile(shelfFile.id);
      else window.location.href = `/reader/${encodeURIComponent(shelfFile.id)}`;
      return;
    }

    // 3. If a linked local video exists and no ebook is linked, jump to Access Paths tab & open video player
    const linkedVideo = accessPaths.find(
      (p) =>
        p.kind === "local_file" &&
        ((p.mimeType && p.mimeType.startsWith("video/")) ||
          /\.(mp4|mkv|webm|avi|mov)$/i.test(p.filePath ?? "")),
    );
    if (linkedVideo && accessPaths.every((p) => p.kind === "local_file")) {
      setActiveTab("sources");
      setActiveVideoPathId(linkedVideo.id);
      toast({
        title: "Opening linked local video",
        description: linkedVideo.label ?? (linkedVideo.kind === 'local_file' ? linkedVideo.filePath : null) ?? undefined,
      });
      return;
    }

    // 4. Otherwise open ResumeReadingModal to choose web source, video, or shelf EPUB
    setResumeModalOpen(true);
  };

  React.useEffect(() => {
    loadWork(workId as WorkId);
    return () => clearWork();
  }, [workId]);

  // Fallback if work not found
  if (!activeItem) {
    return (
      <PageContainer maxWidth="wide">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-2 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Button>
        </div>
        <div className="text-center py-24 text-[var(--cv-text-muted)]">Work not found.</div>
      </PageContainer>
    );
  }

  const { work, relationship, accessPaths, memories, updates } = activeItem;
  const anchor = relationship?.currentAnchor ?? null;
  const anchorLabel = anchor ? formatProgressAnchor(anchor) : "Not started";
  const preferredPath = accessPaths.find((p) => p.isPreferred) ?? accessPaths[0];

  const handleStateChange = (value: string) => {
    updatePersonalState(value as PersonalState);
    toast({ title: "Status updated", description: `Marked as ${value}` });
  };

  const handleShelfTierChange = (value: string) => {
    const tier = value as ShelfPriorityTier;
    updateRelationshipInLibrary(work.id, { shelfTier: tier });
    loadWork(work.id);
    toast({
      title: "Shelf tier updated",
      description: `Set shelf priority to ${tier.replace("_", " ")}`,
    });
  };

  const handleOpenMetadataEditor = () => {
    setMetaRating(work.rating !== undefined && work.rating !== null ? String(work.rating) : "");
    setMetaCreatorName(work.creators?.[0]?.name ?? "");
    setMetaCreatorRole(work.creators?.[0]?.role ?? "author");
    setMetaTotalChapters(work.totalChapters ? String(work.totalChapters) : "");
    setMetaTotalVolumes(work.totalVolumes ? String(work.totalVolumes) : "");
    setMetaTotalPages(work.totalPages ? String(work.totalPages) : "");
    setMetaOriginalTitle(work.originalTitle ?? "");
    setMetaOriginalLanguage(work.originalLanguage ?? "");
    setMetaStartDate(work.startDate ?? "");
    setMetaEndDate(work.endDate ?? "");
    setMetaContentRating(work.contentRating ?? "everyone");
    setMetaContentWarnings((work.contentWarnings ?? []).join(", "));
    setEditingMetadata(true);
  };

  const handleSaveMetadata = () => {
    const parsedRating =
      metaRating.trim() !== ""
        ? Math.min(10, Math.max(0, Number(metaRating)))
        : null;
    const creators: readonly WorkCreator[] = metaCreatorName.trim()
      ? [
          {
            id: work.creators?.[0]?.id ?? `creator-${work.id}-0`,
            workId: work.id,
            name: metaCreatorName.trim(),
            role: metaCreatorRole,
            sortOrder: 0,
          },
        ]
      : work.creators ?? [];

    updateWorkInLibrary(work.id, {
      rating: parsedRating !== null && Number.isFinite(parsedRating) ? parsedRating : null,
      creators,
      totalChapters:
        metaTotalChapters.trim() && Number.isFinite(Number(metaTotalChapters))
          ? Math.max(0, Math.floor(Number(metaTotalChapters)))
          : null,
      totalVolumes:
        metaTotalVolumes.trim() && Number.isFinite(Number(metaTotalVolumes))
          ? Math.max(0, Math.floor(Number(metaTotalVolumes)))
          : null,
      totalPages:
        metaTotalPages.trim() && Number.isFinite(Number(metaTotalPages))
          ? Math.max(0, Math.floor(Number(metaTotalPages)))
          : null,
      originalTitle: metaOriginalTitle.trim() || null,
      originalLanguage: metaOriginalLanguage.trim() || null,
      startDate: metaStartDate.trim() || null,
      endDate: metaEndDate.trim() || null,
      contentRating: metaContentRating,
      contentWarnings: metaContentWarnings
        .split(",")
        .map((w) => w.trim())
        .filter(Boolean),
    });
    loadWork(work.id);
    setEditingMetadata(false);
    toast({ title: "Work metadata saved" });
  };

  const handleLinkVideoReference = () => {
    if (!videoPath.trim() && !videoLabel.trim()) {
      toast({
        title: "Video file name or path required",
        variant: "destructive",
      });
      return;
    }
    const now = new Date().toISOString();
    const created = addAccessPath({
      kind: "local_file" as Parameters<typeof addAccessPath>[0]["kind"],
      provider: "Local Video Storage",
      label: videoLabel.trim() || videoPath.trim(),
      filePath: videoPath.trim() || videoLabel.trim(),
      fileSizeBytes: videoSizeBytes > 0 ? videoSizeBytes : null,
      mimeType: videoMimeType || "video/mp4",
      capabilities: [AccessCapability.Read, AccessCapability.LocalFile],
      health: "local" as Parameters<typeof addAccessPath>[0]["health"],
      healthState: "local" as Parameters<typeof addAccessPath>[0]["healthState"],
      lastCheckedAt: now,
      lastOpenedAt: now,
      isPreferred: accessPaths.length === 0,
      provenance: { source: "local_video_reference" },
      createdAt: now,
      updatedAt: now,
    } as Parameters<typeof addAccessPath>[0]);

    if (created && pendingVideoFile) {
      const blobUrl = URL.createObjectURL(pendingVideoFile);
      setVideoObjectUrls((prev) => ({ ...prev, [created.id]: blobUrl }));
      setActiveVideoPathId(created.id);
    }

    setVideoLabel("");
    setVideoPath("");
    setVideoSizeBytes(0);
    setPendingVideoFile(null);
    setShowLinkVideo(false);
    toast({
      title: "Local video reference linked",
      description: "Saved local video episode/file reference to this Work in localStorage.",
    });
  };

  const handleAdvance = (delta: number) => {
    advanceChapter(delta);
    const updated = useWorkDetailStore.getState().activeItem;
    const newAnchor = updated?.relationship?.currentAnchor;
    toast({
      title: delta > 0 ? "Progress advanced" : "Progress decremented",
      description: newAnchor ? formatProgressAnchor(newAnchor) : undefined,
    });
  };

  const handleAddSource = () => {
    if (!newSourceUrl.trim() && !newSourceLabel.trim()) {
      toast({ title: "Source URL or label required", variant: "destructive" });
      return;
    }
    addAccessPath({
      kind: "web" as Parameters<typeof addAccessPath>[0]["kind"],
      provider: newSourceProvider || null,
      label: newSourceLabel || newSourceUrl,
      url: newSourceUrl,
      capabilities: [AccessCapability.Read, AccessCapability.Updates],
      health: "healthy" as Parameters<typeof addAccessPath>[0]["health"],
      healthState: "healthy" as Parameters<typeof addAccessPath>[0]["healthState"],
      lastCheckedAt: new Date().toISOString(),
      lastOpenedAt: null,
      isPreferred: accessPaths.length === 0,
      provenance: { source: "manual" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Parameters<typeof addAccessPath>[0]);
    setNewSourceUrl("");
    setNewSourceLabel("");
    setNewSourceProvider("");
    setShowAddSource(false);
    toast({ title: "Source added" });
  };

  const handleAddMemory = () => {
    if (!newMemoryBody.trim() && !newMemoryTitle.trim()) {
      toast({ title: "Memory body or title required", variant: "destructive" });
      return;
    }
    addMemory({
      type: MemoryType.PersonalNote,
      title: newMemoryTitle || null,
      body: newMemoryBody || null,
      privacyState: "private" as Parameters<typeof addMemory>[0]["privacyState"],
      spoilerLevel: "spoiler_free" as Parameters<typeof addMemory>[0]["spoilerLevel"],
      showInGlobalGallery: false,
      accessPathId: preferredPath?.id ?? null,
      progressAnchor: anchor,
      readingAttemptId: newMemoryAttemptId.trim() || null,
      assets: pendingMemoryImageUrl
        ? [
            {
              id: `asset-${Date.now()}` as any,
              memoryId: `memory-${Date.now()}` as any,
              assetType: MemoryAssetType.Image,
              fileId: pendingMemoryImageUrl,
              thumbnailRef: pendingMemoryImageUrl,
              width: null,
              height: null,
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
      tags: [],
    });
    setNewMemoryBody("");
    setNewMemoryTitle("");
    setNewMemoryAttemptId("");
    setPendingMemoryImageUrl(null);

    setShowAddMemory(false);
    toast({ title: "Memory captured" });
  };

  return (
    <PageContainer maxWidth="wide">
      {/* Back */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Library</span>
        </Button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-cv-2xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 sm:p-8 shadow-lg mb-8">
        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          <div className="flex flex-col items-center shrink-0 mx-auto md:mx-0 w-44 sm:w-56">
            <Cover
              title={work.title}
              src={work.coverRef ?? null}
              size="hero"
              className="w-full shadow-2xl"
            />
            {/* Cover Action Controls */}
            <div className="flex flex-col gap-1.5 mt-3 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchCoverFromWeb}
                disabled={fetchingCover}
                className="w-full gap-1.5 text-xs text-[var(--cv-accent-strong)] hover:bg-[var(--cv-accent)]/10"
              >
                <RefreshCw className={cn("h-3 w-3", fetchingCover && "animate-spin")} />
                <span>{fetchingCover ? "Fetching..." : "Fetch Official Cover"}</span>
              </Button>
              <div className="flex items-center gap-1.5 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="flex-1 gap-1 text-[11px] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] border border-[var(--cv-border)]"
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="flex-1 gap-1 text-[11px] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] border border-[var(--cv-border)]"
                >
                  <LinkIcon className="h-3 w-3" />
                  <span>URL</span>
                </Button>
              </div>

              {/* Hidden file upload input */}
              <input
                ref={coverFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadCoverFile}
                className="hidden"
              />

              {/* Inline URL input */}
              {showUrlInput && (
                <div className="flex items-center gap-1 w-full mt-1">
                  <Input
                    value={customCoverUrl}
                    onChange={(e) => setCustomCoverUrl(e.target.value)}
                    placeholder="https://... image URL"
                    className="text-xs h-7 py-0 px-2"
                  />
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      if (customCoverUrl.trim()) {
                        updateCover(customCoverUrl.trim());
                        setCustomCoverUrl("");
                        setShowUrlInput(false);
                        toast({ title: "Cover URL saved", variant: "success" });
                      }
                    }}
                  >
                    Set
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
            <div>
              {/* Meta chips */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="rounded-cv-sm bg-[var(--cv-surface)] px-2 py-0.5 font-mono text-[11px] uppercase text-[var(--cv-text-muted)] border border-[var(--cv-border)]">
                  {work.contentType}
                </span>
                <span className="rounded-cv-sm bg-[var(--cv-surface)] px-2 py-0.5 text-[11px] text-[var(--cv-text-muted)] border border-[var(--cv-border)]">
                  {work.origin} · {work.publicationState}
                </span>
                {preferredPath && (
                  <SourceHealthIndicator
                    health={toUIHealth(preferredPath.health)}
                    label={
                      "provider" in preferredPath && preferredPath.provider
                        ? (preferredPath as { provider: string }).provider
                        : (preferredPath.label ?? "Source")
                    }
                    size="sm"
                  />
                )}
              </div>

              {/* Title */}
              <h1 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
                {work.title}
              </h1>

              {/* Alt titles */}
              {work.alternativeTitles.length > 0 && (
                <p className="mt-1 text-cv-xs text-[var(--cv-text-subtle)]">
                  Also known as: {work.alternativeTitles.join(" · ")}
                </p>
              )}

              {/* Description */}
              {work.description && (
                <p className="mt-4 text-cv-sm text-[var(--cv-text-muted)] leading-relaxed max-w-2xl">
                  {work.description}
                </p>
              )}

              {/* Genres */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {work.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-cv-full bg-[var(--cv-surface)] px-2.5 py-0.5 text-cv-xs text-[var(--cv-text-muted)]"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>

            {/* Progress & Status Controls */}
            <div className="mt-6 pt-5 border-t border-[var(--cv-border)] flex flex-col gap-4">
              {/* Personal State & Shelf Tier Selector */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-cv-xs text-[var(--cv-text-muted)]">Status:</span>
                <Select
                  value={relationship?.personalState ?? "planned"}
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger className="w-44 h-8 text-cv-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PERSONAL_STATE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <span className="text-cv-xs text-[var(--cv-text-muted)] ml-2">Shelf Tier:</span>
                <Select
                  value={relationship?.shelfTier ?? "standard"}
                  onValueChange={handleShelfTierChange}
                >
                  <SelectTrigger className="w-44 h-8 text-cv-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHELF_TIER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Progress Adjuster */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-cv-xs text-[var(--cv-text-muted)]">Progress:</span>
                <span className="text-cv-sm font-medium text-[var(--cv-text)]">{anchorLabel}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAdvance(-1)}
                    title="Go back one chapter"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleAdvance(1)}
                    title="Advance one chapter"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 ml-2"
                  onClick={handleResume}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Resume
                </Button>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setMergeModalOpen(true)}
                    title="Merge duplicates into this record"
                  >
                    <GitMerge className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
                    <span>Merge</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-[var(--cv-text-muted)] hover:text-red-400"
                    onClick={() => setArchiveModalOpen(true)}
                    title="Archive this work out of active library"
                  >
                    <ArchiveIcon className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList variant="horizontal">
          <TabsTrigger value="overview" variant="underline">
            Overview
          </TabsTrigger>
          <TabsTrigger value="relations" variant="underline">
            Relations ({relations.length})
          </TabsTrigger>
          <TabsTrigger value="sources" variant="underline">
            Access Paths ({accessPaths.length})
          </TabsTrigger>
          <TabsTrigger value="memories" variant="underline">
            Memories ({memories.length})
          </TabsTrigger>
          <TabsTrigger value="notebook" variant="underline">
            Notebook
          </TabsTrigger>
          <TabsTrigger value="fandom" variant="underline">
            Fandom
          </TabsTrigger>
          <TabsTrigger value="fancreations" variant="underline">
            Fan Creations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Stats card */}
            <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-5">
              <h3 className="text-cv-sm font-semibold text-[var(--cv-text)] mb-4">Reading Stats</h3>
              <dl className="space-y-2 text-cv-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--cv-text-muted)]">Status</dt>
                  <dd className="font-medium text-[var(--cv-text)]">
                    {relationship?.personalState ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--cv-text-muted)]">Shelf Priority</dt>
                  <dd className="font-medium text-[var(--cv-text)]">
                    {relationship?.shelfTier
                      ? relationship.shelfTier.replace("_", " ")
                      : "standard"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--cv-text-muted)]">Current</dt>
                  <dd className="font-medium text-[var(--cv-text)]">{anchorLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--cv-text-muted)]">Last active</dt>
                  <dd className="font-medium text-[var(--cv-text)]">
                    {relationship?.lastActiveAt ? relativeTime(relationship.lastActiveAt) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--cv-text-muted)]">Started</dt>
                  <dd className="font-medium text-[var(--cv-text)]">
                    {relationship?.startedAt ? relativeTime(relationship.startedAt) : "—"}
                  </dd>
                </div>
                {updates.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--cv-text-muted)]">Latest release</dt>
                    <dd className="font-medium text-[var(--cv-accent-strong)]">
                      {updates[0]?.label ?? "—"}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Tags */}
            <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-5">
              <h3 className="text-cv-sm font-semibold text-[var(--cv-text)] mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {work.tags.length > 0 ? (
                  work.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-cv px-2.5 py-1 text-cv-xs bg-[var(--cv-surface)] text-[var(--cv-text-muted)] border border-[var(--cv-border)]"
                    >
                      #{t}
                    </span>
                  ))
                ) : (
                  <p className="text-cv-xs text-[var(--cv-text-subtle)]">No tags.</p>
                )}
              </div>
            </div>

            {/* Extended Bibliographic Metadata Card */}
            <div className="md:col-span-2 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-cv-sm font-semibold text-[var(--cv-text)]">
                    Bibliographic Metadata & Rating
                  </h3>
                  <p className="text-cv-xs text-[var(--cv-text-muted)]">
                    Optional creator credits, personal rating, chapter/volume counts, and content warnings.
                  </p>
                </div>
                {!editingMetadata && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenMetadataEditor}
                    className="gap-1.5 text-cv-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Metadata</span>
                  </Button>
                )}
              </div>

              {editingMetadata ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-cv-xs">
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Personal Rating (0–10)</span>
                    <Input
                      type="number"
                      min={0}
                      max={10}
                      step={0.5}
                      value={metaRating}
                      onChange={(e) => setMetaRating(e.target.value)}
                      placeholder="e.g. 9.5"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Creator / Author Name</span>
                    <Input
                      value={metaCreatorName}
                      onChange={(e) => setMetaCreatorName(e.target.value)}
                      placeholder="e.g. Sing Shong"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Creator Role</span>
                    <select
                      value={metaCreatorRole}
                      onChange={(e) => setMetaCreatorRole(e.target.value as WorkCreatorRole)}
                      className="w-full h-9 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 text-cv-xs text-[var(--cv-text)]"
                    >
                      <option value="author">Author</option>
                      <option value="artist">Artist</option>
                      <option value="studio">Studio</option>
                      <option value="translator">Translator</option>
                      <option value="editor">Editor</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Total Chapters / Episodes</span>
                    <Input
                      type="number"
                      min={0}
                      value={metaTotalChapters}
                      onChange={(e) => setMetaTotalChapters(e.target.value)}
                      placeholder="e.g. 551"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Total Volumes</span>
                    <Input
                      type="number"
                      min={0}
                      value={metaTotalVolumes}
                      onChange={(e) => setMetaTotalVolumes(e.target.value)}
                      placeholder="e.g. 20"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Total Pages</span>
                    <Input
                      type="number"
                      min={0}
                      value={metaTotalPages}
                      onChange={(e) => setMetaTotalPages(e.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Original Title</span>
                    <Input
                      value={metaOriginalTitle}
                      onChange={(e) => setMetaOriginalTitle(e.target.value)}
                      placeholder="Native script title"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Original Language</span>
                    <Input
                      value={metaOriginalLanguage}
                      onChange={(e) => setMetaOriginalLanguage(e.target.value)}
                      placeholder="e.g. ko, ja, zh, en"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Content Rating</span>
                    <select
                      value={metaContentRating}
                      onChange={(e) => setMetaContentRating(e.target.value as ContentRating)}
                      className="w-full h-9 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 text-cv-xs text-[var(--cv-text)]"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="teen">Teen</option>
                      <option value="mature">Mature</option>
                      <option value="explicit">Explicit</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Start Date</span>
                    <Input
                      type="date"
                      value={metaStartDate}
                      onChange={(e) => setMetaStartDate(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">End Date</span>
                    <Input
                      type="date"
                      value={metaEndDate}
                      onChange={(e) => setMetaEndDate(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--cv-text-muted)]">Content Warnings (comma-separated)</span>
                    <Input
                      value={metaContentWarnings}
                      onChange={(e) => setMetaContentWarnings(e.target.value)}
                      placeholder="e.g. violence, horror"
                    />
                  </label>
                  <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-2 pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingMetadata(false)}
                    >
                      Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveMetadata}>
                      Save Metadata
                    </Button>
                  </div>
                </div>
              ) : (
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-cv-xs">
                  <div className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3">
                    <dt className="text-[var(--cv-text-subtle)]">Personal Rating</dt>
                    <dd className="mt-1 font-mono text-cv-sm font-semibold text-[var(--cv-accent-strong)]">
                      {work.rating !== undefined && work.rating !== null ? `${work.rating} / 10` : "Unrated"}
                    </dd>
                  </div>
                  <div className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3">
                    <dt className="text-[var(--cv-text-subtle)]">Creators</dt>
                    <dd className="mt-1 font-medium text-[var(--cv-text)]">
                      {work.creators && work.creators.length > 0
                        ? work.creators.map((c) => `${c.name} (${c.role})`).join(", ")
                        : "—"}
                    </dd>
                  </div>
                  <div className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3">
                    <dt className="text-[var(--cv-text-subtle)]">Extent</dt>
                    <dd className="mt-1 font-mono text-[var(--cv-text)]">
                      {[
                        work.totalChapters ? `${work.totalChapters} ch` : null,
                        work.totalVolumes ? `${work.totalVolumes} vol` : null,
                        work.totalPages ? `${work.totalPages} p` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </dd>
                  </div>
                  <div className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3">
                    <dt className="text-[var(--cv-text-subtle)]">Original Title / Rating</dt>
                    <dd className="mt-1 text-[var(--cv-text)]">
                      {work.originalTitle ?? "—"}
                      {work.contentRating ? ` · ${work.contentRating}` : ""}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            {/* Relations Section in Overview */}
            <div className="md:col-span-2 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-5">
              <WorkRelationTree workId={work.id} onNavigateWork={onNavigateWork} />
            </div>

            {/* Audiobook Player Console — only shown for audiobook contentType */}
            {work.contentType === ContentType.Audiobook && anchor?.type === "audiobook" && (
              <div className="md:col-span-2 rounded-none border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] shadow-[4px_4px_0px_var(--cv-border-strong)]">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--cv-border)] bg-[var(--cv-surface)]">
                  <Headphones className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cv-text-subtle)]">
                    [ AUDIOBOOK CONSOLE ]
                  </span>
                </div>
                <div className="p-4 grid gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {anchor.narrator && (
                        <p className="text-cv-xs text-[var(--cv-text-muted)]">
                          <span className="font-semibold text-[var(--cv-text)]">Narrator:</span> {anchor.narrator}
                        </p>
                      )}
                      {anchor.title && (
                        <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                          <span className="font-semibold text-[var(--cv-text)]">Book:</span> {anchor.title}
                        </p>
                      )}
                      <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                        <span className="font-semibold text-[var(--cv-text)]">Track:</span> {anchor.track}
                        {anchor.chapter !== undefined && (
                          <span className="ml-2">· <span className="font-semibold text-[var(--cv-text)]">Chapter:</span> {anchor.chapter}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right font-mono text-cv-xs text-[var(--cv-text-muted)]">
                      {anchor.timestampSeconds !== undefined && (
                        <span>
                          {Math.floor(anchor.timestampSeconds / 60)}:{String(anchor.timestampSeconds % 60).padStart(2, "0")}
                          {anchor.totalSeconds && (
                            <span> / {Math.floor(anchor.totalSeconds / 60)}:{String(anchor.totalSeconds % 60).padStart(2, "0")}</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {anchor.timestampSeconds !== undefined && anchor.totalSeconds && anchor.totalSeconds > 0 && (
                    <div className="w-full h-1.5 rounded-none bg-[var(--cv-surface)] overflow-hidden border border-[var(--cv-border)]">
                      <div
                        className="h-full bg-[var(--cv-accent-strong)] transition-all"
                        style={{ width: `${Math.min(100, (anchor.timestampSeconds / anchor.totalSeconds) * 100)}%` }}
                      />
                    </div>
                  )}

                  {/* Pseudo controls */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-none border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--cv-accent)] transition-all cursor-pointer"
                    >
                      <SkipBack className="h-3 w-3" />
                      <span>-15s</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-none border-2 border-[var(--cv-accent-strong)] bg-[var(--cv-accent-strong)] px-3 py-1 text-[11px] font-mono font-bold text-white shadow-[2px_2px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                    >
                      <Play className="h-3 w-3 fill-white" />
                      <span>PLAY</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-none border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--cv-accent)] transition-all cursor-pointer"
                    >
                      <SkipForward className="h-3 w-3" />
                      <span>+30s</span>
                    </button>
                    <select className="ml-auto font-mono text-[11px] border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2 py-1 rounded-none text-[var(--cv-text)] cursor-pointer focus:outline-none">
                      <option value="1.0">1.0×</option>
                      <option value="1.25">1.25×</option>
                      <option value="1.5">1.5×</option>
                      <option value="1.75">1.75×</option>
                      <option value="2.0">2.0×</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-[var(--cv-text-subtle)] font-mono">
                    ⚠ Player controls are UI placeholders — connect your actual audiobook player to update progress.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Relations Tab */}
        <TabsContent value="relations" className="mt-6">
          <div className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 shadow-sm">
            <WorkRelationTree workId={work.id} onNavigateWork={onNavigateWork} />
          </div>
        </TabsContent>

        {/* Access Paths Tab */}
        <TabsContent value="sources" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-cv-xs text-[var(--cv-text-muted)]">
              URLs, local ebook files, and local video references linked to this work.
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setShowLinkVideo(!showLinkVideo);
                  setShowAddSource(false);
                }}
              >
                <Film className="h-3.5 w-3.5 text-[var(--cv-accent-strong)]" />
                Link Local Video
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setShowAddSource(!showAddSource);
                  setShowLinkVideo(false);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Add Source
              </Button>
            </div>
          </div>

          {/* Link Local Video Reference form */}
          {showLinkVideo && (
            <div className="mb-4 rounded-cv-lg border border-[var(--cv-accent-muted)] bg-[var(--cv-bg-elevated)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-cv-xs font-semibold text-[var(--cv-text)]">
                  Link Local Video File Reference (Anime / Donghua / Local Media)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="h-7 text-cv-xs gap-1.5"
                >
                  <Upload className="h-3 w-3" />
                  Pick Video File
                </Button>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/*,.mkv,.mp4,.webm,.avi"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setPendingVideoFile(f);
                    setVideoLabel(f.name.replace(/\.[^.]+$/, ""));
                    setVideoPath(f.name);
                    setVideoSizeBytes(f.size);
                    setVideoMimeType(f.type || "video/mp4");
                  }}
                />
              </div>
              <input
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                placeholder="Episode or Release Label (e.g. Season 1 BD 1080p - Ep 01)"
                value={videoLabel}
                onChange={(e) => setVideoLabel(e.target.value)}
              />
              <input
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)] font-mono"
                placeholder="Local file path, filename, or video URL (e.g. D:/Anime/Episode_01.mp4)"
                value={videoPath}
                onChange={(e) => setVideoPath(e.target.value)}
              />
              {videoSizeBytes > 0 && (
                <p className="text-cv-xs text-[var(--cv-text-muted)] font-mono">
                  Selected file: {(videoSizeBytes / (1024 * 1024)).toFixed(2)} MB ({videoMimeType})
                </p>
              )}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPendingVideoFile(null);
                    setShowLinkVideo(false);
                  }}
                >
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleLinkVideoReference}>
                  Link Video Reference
                </Button>
              </div>
            </div>
          )}

          {/* Hidden input to load a local video file from disk into the inline video player */}
          <input
            ref={reattachVideoInputRef}
            type="file"
            accept="video/*,.mkv,.mp4,.webm,.avi"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.currentTarget.value = "";
              if (!f || !reattachTargetPathId) return;
              const blobUrl = URL.createObjectURL(f);
              setVideoObjectUrls((prev) => {
                if (prev[reattachTargetPathId]) URL.revokeObjectURL(prev[reattachTargetPathId]!);
                return { ...prev, [reattachTargetPathId]: blobUrl };
              });
              setActiveVideoPathId(reattachTargetPathId);
              toast({
                title: "Video loaded for playback",
                description: `Playing ${f.name} locally in browser.`,
              });
            }}
          />

          {/* Add source form */}
          {showAddSource && (
            <div className="mb-4 rounded-cv-lg border border-[var(--cv-accent-muted)] bg-[var(--cv-bg-elevated)] p-4 flex flex-col gap-3">
              <input
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                placeholder="Label (e.g. MangaDex)"
                value={newSourceLabel}
                onChange={(e) => setNewSourceLabel(e.target.value)}
              />
              <input
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                placeholder="URL (https://...)"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
              />
              <input
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                placeholder="Provider name (optional)"
                value={newSourceProvider}
                onChange={(e) => setNewSourceProvider(e.target.value)}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowAddSource(false)}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleAddSource}>
                  Add
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {accessPaths.length === 0 ? (
              <div className="rounded-cv-lg border border-dashed border-[var(--cv-border)] bg-[var(--cv-surface)]/40 p-8 text-center">
                <p className="text-cv-sm font-semibold text-[var(--cv-text)] mb-1">
                  No access paths connected
                </p>
                <p className="text-cv-xs text-[var(--cv-text-muted)] max-w-md mx-auto">
                  A Work in Chronicles Vault is permanent. Even when websites change domains or sources disappear, your reading progress, notes, and relationship remain safe forever. Add a reading source above.
                </p>
              </div>
            ) : (
              accessPaths.map((path) => {
                const url =
                  "url" in path ? path.url : "filePath" in path ? path.filePath : undefined;
                const provider =
                  "provider" in path && path.provider ? (path.provider as string) : undefined;
                const isVideoPath =
                  path.kind === "local_file" &&
                  Boolean(
                    (path.mimeType && path.mimeType.startsWith("video/")) ||
                      (path.provenance &&
                        (path.provenance as { source?: string }).source ===
                          "local_video_reference") ||
                      (url && /\.(mp4|mkv|webm|avi|mov)$/i.test(url)),
                  );
                const sizeBytes =
                  "fileSizeBytes" in path && typeof path.fileSizeBytes === "number"
                    ? path.fileSizeBytes
                    : null;
                const isHttpUrl = Boolean(url && /^https?:\/\//i.test(url));
                const playableSrc =
                  videoObjectUrls[path.id] ??
                  (url && /^(https?:\/\/|blob:|data:video\/)/i.test(url) ? url : null);
                const isPlayerOpen = activeVideoPathId === path.id;

                return (
                  <div
                    key={path.id}
                    className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-cv-sm font-semibold text-[var(--cv-text)]">
                            {path.label ?? provider ?? path.kind}
                          </span>
                          {isVideoPath && (
                            <Badge variant="default" className="gap-1 text-[10px] font-mono">
                              <Film className="h-3 w-3" />
                              LOCAL VIDEO
                            </Badge>
                          )}
                          {sizeBytes !== null && sizeBytes > 0 && (
                            <span className="text-[11px] font-mono text-[var(--cv-text-subtle)]">
                              {(sizeBytes / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          )}
                          {path.isPreferred && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--cv-accent-strong)]">
                              preferred
                            </span>
                          )}
                        </div>
                        {provider && (
                          <p className="text-cv-xs text-[var(--cv-text-muted)]">{provider}</p>
                        )}
                        {url && (
                          <p className="text-cv-xs font-mono text-[var(--cv-text-subtle)] truncate mt-0.5">
                            {url}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                        <SourceHealthIndicator health={toUIHealth(path.health)} size="sm" />

                        {isVideoPath && (
                          <Button
                            variant={isPlayerOpen ? "default" : "outline"}
                            size="sm"
                            className="h-7 px-2.5 text-[11px] gap-1"
                            onClick={() =>
                              setActiveVideoPathId((prev) => (prev === path.id ? null : path.id))
                            }
                            title="Watch or preview linked video"
                          >
                            <Play className="h-3 w-3" />
                            <span>{isPlayerOpen ? "Hide Player" : "Watch"}</span>
                          </Button>
                        )}

                        {!path.isPreferred && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-[var(--cv-text-muted)] hover:text-[var(--cv-accent-strong)]"
                            onClick={() => {
                              setPreferredAccessPath(path.id);
                              toast({ title: "Preferred source updated" });
                            }}
                            title="Set as preferred reading source"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Set Preferred
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                          disabled={checkingPathId === path.id}
                          onClick={async () => {
                            setCheckingPathId(path.id);
                            try {
                              const newHealth = await checkAccessPathHealth(path.id);
                              toast({
                                title: "Health check completed",
                                description: `Source is currently ${newHealth}`,
                              });
                            } finally {
                              setCheckingPathId(null);
                            }
                          }}
                          title="Check source health now"
                        >
                          <RefreshCw
                            className={`h-3.5 w-3.5 ${checkingPathId === path.id ? "animate-spin" : ""}`}
                          />
                        </Button>

                        {url && isHttpUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                            onClick={() => {
                              window.open(url, "_blank", "noopener,noreferrer");
                            }}
                            title="Open URL in browser"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        {url && !isHttpUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                            onClick={() => {
                              if (navigator.clipboard) {
                                void navigator.clipboard.writeText(url);
                              }
                              toast({
                                title: "File path copied",
                                description: url,
                              });
                            }}
                            title="Copy local file path"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-red-500 hover:bg-red-500/10"
                          onClick={() => {
                            if (videoObjectUrls[path.id]) {
                              URL.revokeObjectURL(videoObjectUrls[path.id]!);
                            }
                            if (activeVideoPathId === path.id) {
                              setActiveVideoPathId(null);
                            }
                            deleteAccessPath(path.id);
                            toast({
                              title: "Source removed",
                              description:
                                "Access path removed. The Work remains safe in your library.",
                            });
                          }}
                          title="Remove source"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {isVideoPath && isPlayerOpen && (
                      <div className="rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3 space-y-2">
                        {playableSrc ? (
                          <div className="space-y-2">
                            <video
                              src={playableSrc}
                              controls
                              preload="metadata"
                              className="w-full max-h-96 rounded-cv bg-black"
                            />
                            <div className="flex items-center justify-between text-cv-xs text-[var(--cv-text-muted)]">
                              <span>Playing: {path.label ?? url}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-cv-xs gap-1"
                                onClick={() => {
                                  setReattachTargetPathId(path.id);
                                  reattachVideoInputRef.current?.click();
                                }}
                              >
                                <Upload className="h-3 w-3" />
                                Switch Video File
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                            <div className="text-cv-xs text-[var(--cv-text-muted)]">
                              <p className="font-semibold text-[var(--cv-text)]">
                                Local video reference saved ({url})
                              </p>
                              <p className="mt-0.5">
                                Because browser sandboxes do not persist raw disk handles across page reloads, select the video file from your device to stream it right here.
                              </p>
                            </div>
                            <Button
                              variant="default"
                              size="sm"
                              className="gap-1.5 shrink-0"
                              onClick={() => {
                                setReattachTargetPathId(path.id);
                                reattachVideoInputRef.current?.click();
                              }}
                            >
                              <Upload className="h-3.5 w-3.5" />
                              Select File to Play
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Memories Tab */}
        <TabsContent value="memories" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-cv-xs text-[var(--cv-text-muted)]">
              Quotes, notes, theories, and reflections captured while reading.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => setShowAddMemory(!showAddMemory)}
            >
              <Star className="h-3.5 w-3.5" />
              Capture Memory
            </Button>
          </div>

          {/* Add memory form */}
          {showAddMemory && (
            <div className="mb-4 rounded-cv-lg border border-[var(--cv-accent-muted)] bg-[var(--cv-bg-elevated)] p-4 flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                  placeholder="Title (optional)"
                  value={newMemoryTitle}
                  onChange={(e) => setNewMemoryTitle(e.target.value)}
                />
                <input
                  className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)] font-mono"
                  placeholder="Reread pass / attempt ID (optional, e.g. reread-2026)"
                  value={newMemoryAttemptId}
                  onChange={(e) => setNewMemoryAttemptId(e.target.value)}
                />
              </div>
              <textarea
                rows={3}
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2 text-cv-sm text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)] resize-none"
                placeholder="Quote, note, theory, reaction…"
                value={newMemoryBody}
                onChange={(e) => setNewMemoryBody(e.target.value)}
              />

              {/* Screenshot / Image attachment */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-none border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                  onClick={() => memoryImageInputRef.current?.click()}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  {pendingMemoryImageUrl ? "Change Image" : "Attach Screenshot"}
                </button>
                {pendingMemoryImageUrl && (
                  <>
                    <img
                      src={pendingMemoryImageUrl}
                      alt="Memory attachment preview"
                      className="h-12 w-16 object-cover rounded-none border border-[var(--cv-border-strong)]"
                    />
                    <button
                      type="button"
                      className="text-[11px] text-[var(--cv-text-subtle)] hover:text-[var(--cv-text)] cursor-pointer font-mono"
                      onClick={() => setPendingMemoryImageUrl(null)}
                    >
                      ✕ remove
                    </button>
                  </>
                )}
                <input
                  ref={memoryImageInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      if (typeof reader.result === "string") {
                        setPendingMemoryImageUrl(reader.result);
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setShowAddMemory(false); setPendingMemoryImageUrl(null); }}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleAddMemory}>
                  Save Memory
                </Button>
              </div>
            </div>
          )}


          {memories.length === 0 ? (
            <div className="text-center py-12 text-[var(--cv-text-subtle)]">
              <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-cv-sm">No memories captured yet.</p>
              <p className="text-cv-xs mt-1">Save quotes, notes, and reactions as you read.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {memories.map((m) => (
                <div key={m.id} className="space-y-1.5">
                  <MemoryCard
                    type={toUIMemoryType(m.type)}
                    content={m.body ?? m.title ?? ""}
                    anchorLabel={
                      m.progressAnchor ? formatProgressAnchor(m.progressAnchor) : undefined
                    }
                    createdAt={m.createdAt}
                  />
                  <div className="flex items-center justify-between px-1 text-[11px] text-[var(--cv-text-muted)]">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={m.privacyState === PrivacyState.Private ? "muted" : "accent"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {m.privacyState}
                      </Badge>
                      {m.readingAttemptId && (
                        <span className="font-mono text-[10px] text-[var(--cv-text-subtle)]">
                          Attempt: {m.readingAttemptId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-[var(--cv-text-muted)]"
                        onClick={() => {
                          const nextPrivacy =
                            m.privacyState === PrivacyState.Private
                              ? PrivacyState.Public
                              : PrivacyState.Private;
                          clientRepository.updateMemory(m.id as MemoryId, {
                            privacyState: nextPrivacy,
                            showInGlobalGallery: nextPrivacy === PrivacyState.Public,
                          });
                          loadWork(work.id);
                          toast({
                            title: `Memory marked ${nextPrivacy}`,
                          });
                        }}
                      >
                        Make {m.privacyState === PrivacyState.Private ? "Public" : "Private"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-[var(--cv-text-muted)] hover:text-red-400"
                        onClick={() => {
                          clientRepository.deleteMemory(m.id as MemoryId);
                          loadWork(work.id);
                          toast({ title: "Memory deleted" });
                        }}
                        title="Delete memory"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activatable Notebook Tab (BACKLOG.md §4.3) */}
        <TabsContent value="notebook" className="mt-6">
          <div className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 shadow-sm">
            <WorkNotebookPanel workId={work.id} workTitle={work.title} />
          </div>
        </TabsContent>

        {/* Fandom & Community Links Tab (BACKLOG.md §4.5) */}
        <TabsContent value="fandom" className="mt-6">
          <div className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 shadow-sm">
            <WorkFandomLinksPanel workId={work.id} workTitle={work.title} />
          </div>
        </TabsContent>

        {/* Fan Creations Tab — Fanfiction, Video Edits, Fan Art */}
        <TabsContent value="fancreations" className="mt-6">
          <div className="space-y-6">

            {/* ── Fanfiction ─────────────────────────────────── */}
            <div className="rounded-none border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] shadow-[3px_3px_0px_var(--cv-border-strong)]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--cv-border)] bg-[var(--cv-surface)]">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cv-text-subtle)]">
                    [ FANFICTION ]
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {getFanfictionsForWork(work.id).length === 0 ? (
                  <p className="text-cv-xs text-[var(--cv-text-subtle)] text-center py-4">
                    No fanfiction linked yet. Fanfictions can be promoted to full works once they grow.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {getFanfictionsForWork(work.id).map((fanfic) => (
                      <div key={fanfic.id} className="rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] p-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-cv-sm font-semibold text-[var(--cv-text)] truncate">{fanfic.title}</p>
                          {fanfic.author && (
                            <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">by {fanfic.author}</p>
                          )}
                          {fanfic.sourceUrl && (
                            <a
                              href={fanfic.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-cv-xs text-[var(--cv-accent-strong)] hover:underline mt-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              Read online
                            </a>
                          )}
                          {fanfic.summary && (
                            <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1.5 line-clamp-2">{fanfic.summary}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            title="Promote to full work"
                            className="inline-flex items-center gap-1 rounded-none border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2 py-1 text-[10px] font-mono shadow-[1px_1px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer text-[var(--cv-text-muted)] hover:text-[var(--cv-accent-strong)]"
                            onClick={async () => {
                              const promoted = await promoteFanfictionToWork(fanfic.id);
                              if (promoted) {
                                toast({ title: "Promoted!", description: `"${fanfic.title}" is now a full work in your library.`, variant: "success" });
                              } else {
                                toast({ title: "Promotion failed", variant: "destructive" });
                              }
                            }}
                          >
                            <Network className="h-3 w-3" />
                            Promote
                          </button>
                          <button
                            type="button"
                            title="Remove fanfiction"
                            className="inline-flex items-center rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] p-1 text-[var(--cv-text-subtle)] hover:text-red-500 hover:border-red-400 transition-colors cursor-pointer"
                            onClick={() => removeFanfiction(fanfic.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Video Edits ─────────────────────────────────── */}
            <div className="rounded-none border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] shadow-[3px_3px_0px_var(--cv-border-strong)]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--cv-border)] bg-[var(--cv-surface)]">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cv-text-subtle)]">
                    [ VIDEO EDITS ]
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-none border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2.5 py-1 text-[10px] font-mono shadow-[1px_1px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                  onClick={() => setShowAddVideoEdit(!showAddVideoEdit)}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              {showAddVideoEdit && (
                <div className="p-4 border-b border-[var(--cv-border)] grid gap-2 bg-[var(--cv-surface)]/50">
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select
                      className="font-mono text-[11px] border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2 py-1.5 rounded-none text-[var(--cv-text)] cursor-pointer focus:outline-none"
                      value={newVideoEditPlatform}
                      onChange={(e) => setNewVideoEditPlatform(e.target.value as "youtube" | "tiktok" | "instagram")}
                    >
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="instagram">Instagram</option>
                    </select>
                    <input
                      className="w-full rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)] sm:col-span-2"
                      placeholder="Video URL"
                      value={newVideoEditUrl}
                      onChange={(e) => setNewVideoEditUrl(e.target.value)}
                    />
                  </div>
                  <input
                    className="w-full rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                    placeholder="Title / description (optional)"
                    value={newVideoEditTitle}
                    onChange={(e) => setNewVideoEditTitle(e.target.value)}
                  />
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => setShowAddVideoEdit(false)}>Cancel</Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        if (!newVideoEditUrl.trim()) {
                          toast({ title: "URL required", variant: "destructive" });
                          return;
                        }
                        addVideoEdit({
                          workId: work.id,
                          platform: newVideoEditPlatform,
                          url: newVideoEditUrl.trim(),
                          title: newVideoEditTitle.trim() || "Fan Edit",
                          editorName: "",
                          audioTrack: "",
                          aspectRatio: "16:9",
                        });
                        setNewVideoEditUrl("");
                        setNewVideoEditTitle("");
                        setShowAddVideoEdit(false);
                        toast({ title: "Video edit added" });
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <div className="p-4 space-y-2">
                {getVideoEditsForWork(work.id).length === 0 ? (
                  <p className="text-cv-xs text-[var(--cv-text-subtle)] text-center py-4">
                    No video edits yet. Add YouTube, TikTok, or Instagram links.
                  </p>
                ) : (
                  getVideoEditsForWork(work.id).map((vid) => (
                    <div key={vid.id} className="flex items-center gap-3 rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-2">
                      {vid.platform === "youtube" && <Youtube className="h-4 w-4 text-red-500 shrink-0" />}
                      {vid.platform === "instagram" && <Instagram className="h-4 w-4 text-pink-500 shrink-0" />}
                      {vid.platform === "tiktok" && <Music className="h-4 w-4 text-[var(--cv-text-muted)] shrink-0" />}
                      <div className="min-w-0 flex-1">
                        {vid.title && <p className="text-cv-xs font-semibold text-[var(--cv-text)] truncate">{vid.title}</p>}
                        <a
                          href={vid.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-[var(--cv-accent-strong)] hover:underline font-mono truncate block"
                        >
                          {vid.url}
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Fan Art Gallery ─────────────────────────────── */}
            <div className="rounded-none border-2 border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] shadow-[3px_3px_0px_var(--cv-border-strong)]">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--cv-border)] bg-[var(--cv-surface)]">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-[var(--cv-accent-strong)]" />
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cv-text-subtle)]">
                    [ FAN ART GALLERY ]
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-none border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2.5 py-1 text-[10px] font-mono shadow-[1px_1px_0px_var(--cv-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                  onClick={() => setShowAddFanArt(!showAddFanArt)}
                >
                  <Plus className="h-3 w-3" />
                  Add
                </button>
              </div>

              {showAddFanArt && (
                <div className="p-4 border-b border-[var(--cv-border)] grid gap-2 bg-[var(--cv-surface)]/50">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className="w-full rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                      placeholder="Image URL (or upload below)"
                      value={newFanArtUrl}
                      onChange={(e) => setNewFanArtUrl(e.target.value)}
                    />
                    <input
                      className="w-full rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                      placeholder="Artist name (optional)"
                      value={newFanArtArtist}
                      onChange={(e) => setNewFanArtArtist(e.target.value)}
                    />
                  </div>
                  <input
                    className="w-full rounded-none border border-[var(--cv-border)] bg-[var(--cv-surface)] px-3 py-1.5 text-cv-xs text-[var(--cv-text)] placeholder:text-[var(--cv-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--cv-accent-muted)]"
                    placeholder="Title / caption (optional)"
                    value={newFanArtTitle}
                    onChange={(e) => setNewFanArtTitle(e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-none border border-[var(--cv-border-strong)] bg-[var(--cv-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[1px_1px_0px_var(--cv-border-strong)] cursor-pointer text-[var(--cv-text-muted)]"
                      onClick={() => fanArtFileInputRef.current?.click()}
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload File
                    </button>
                    <input
                      ref={fanArtFileInputRef}
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            setNewFanArtUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    <div className="flex gap-2 ml-auto">
                      <Button variant="ghost" size="sm" onClick={() => { setShowAddFanArt(false); setNewFanArtUrl(""); setNewFanArtTitle(""); setNewFanArtArtist(""); }}>Cancel</Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => {
                          if (!newFanArtUrl.trim()) {
                            toast({ title: "Image URL or file required", variant: "destructive" });
                            return;
                          }
                          addFanArt({
                            workId: work.id,
                            imageUrl: newFanArtUrl.trim(),
                            title: newFanArtTitle.trim() || "Fan Art",
                            artistName: newFanArtArtist.trim() || "Unknown",
                            caption: "",
                            tags: [],
                          });
                          setNewFanArtUrl("");
                          setNewFanArtTitle("");
                          setNewFanArtArtist("");
                          setShowAddFanArt(false);
                          toast({ title: "Fan art added" });
                        }}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4">
                {getFanArtForWork(work.id).length === 0 ? (
                  <p className="text-cv-xs text-[var(--cv-text-subtle)] text-center py-4">
                    No fan art yet. Add image URLs or upload from your device.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {getFanArtForWork(work.id).map((art) => (
                      <div key={art.id} className="group relative rounded-none border border-[var(--cv-border)] overflow-hidden aspect-square bg-[var(--cv-surface)]">
                        <img
                          src={art.imageUrl}
                          alt={art.title ?? "Fan art"}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          loading="lazy"
                        />
                        {(art.title || art.artistName) && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                            {art.title && <p className="text-[10px] text-white font-semibold truncate">{art.title}</p>}
                            {art.artistName && <p className="text-[9px] text-white/70 truncate">by {art.artistName}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Cycle 9 Modals */}
      <ArchiveWorkModal
        open={archiveModalOpen}
        onOpenChange={setArchiveModalOpen}
        workId={work.id}
        workTitle={work.title}
        currentAnchor={anchor}
        onArchived={() => {
          onBack?.();
        }}
      />

      <MergeWizardModal
        open={mergeModalOpen}
        onOpenChange={setMergeModalOpen}
        targetWorkId={work.id}
        onMergeSuccess={(mergedWork) => {
          loadWork(mergedWork.id as WorkId);
        }}
      />

      <ResumeReadingModal
        open={resumeModalOpen}
        onOpenChange={setResumeModalOpen}
        work={work}
        relationship={relationship}
        accessPaths={accessPaths}
        onOpenFile={(fileId) => {
          setResumeModalOpen(false);
          if (onOpenFile) onOpenFile(fileId);
          else window.location.href = `/reader/${encodeURIComponent(fileId)}`;
        }}
        onNavigateShelf={() => {
          setResumeModalOpen(false);
          if (onBack) onBack();
        }}
      />
    </PageContainer>
  );
}
