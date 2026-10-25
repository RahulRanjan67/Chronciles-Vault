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
  Upload,
  Link as LinkIcon,
  Film,
  Pencil,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  FileAudio,
  Copy,
  Image as ImageIcon,
  Headphones,
  SkipBack,
  SkipForward,
  Tag,
  ListFilter,
  Clock,
  Calendar,
  Bell,
  AlertCircle,
  Timer,
  Sparkles,
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
} from "@grimoire/ui";
import {
  clientRepository,
  useCategoriesStore,
  useLibraryStore,
  useListsStore,
  useWorkDetailStore,
} from "@grimoire/state";
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
} from "@grimoire/domain";
import type { MemoryId, WorkId } from "@grimoire/shared";
import { toUIHealth, toUIMemoryType } from "../utils/display-adapters";
import { ArchiveWorkModal } from "../components/features/Archive/ArchiveWorkModal";
import { MergeWizardModal } from "../components/features/Merge/MergeWizardModal";
import { WorkRelationTree } from "../components/features/Relations/WorkRelationTree";
import { WorkNotebookPanel } from "../components/features/WorkDetail/WorkNotebookPanel";
import { WorkFandomLinksPanel } from "../components/features/WorkDetail/WorkFandomLinksPanel";
import { WorkFanCreationsPanel } from "../components/features/WorkDetail/WorkFanCreationsPanel";
import { ResumeReadingModal } from "../components/features/Reader";
import { openLocalDiskPath } from "../utils/local-media";
import { autoFetchCoverForWork, scanDirectoryAccessPathsForTitle, type DiscoveredAccessPathCandidate } from "../utils/official-cover-service";

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
  workId = "",
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
    updateShelfTier,
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

  const { categories, toggleWorkInCategory } = useCategoriesStore();
  const { myLists, addWorkToList, removeWorkFromList } = useListsStore();
  const [listsModalOpen, setListsModalOpen] = React.useState(false);

  const assignedCategories = React.useMemo(() => {
    return categories.filter((c) => c.workIds.includes(workId));
  }, [categories, workId]);

  const assignedLists = React.useMemo(() => {
    return myLists.filter((l) => l.items.some((i) => i.workId === workId));
  }, [myLists, workId]);

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

  // Audiobook Live Player state
  const [audioIsPlaying, setAudioIsPlaying] = React.useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = React.useState<number>(0);
  const [audioDuration, setAudioDuration] = React.useState<number>(2740);
  const [audioVolume, setAudioVolume] = React.useState<number>(1);
  const [audioIsMuted, setAudioIsMuted] = React.useState(false);
  const [audioPlaybackRate, setAudioPlaybackRate] = React.useState<number>(1);
  const [localAudioUrl, setLocalAudioUrl] = React.useState<string | null>(null);
  const [localAudioFileName, setLocalAudioFileName] = React.useState<string | null>(null);
  const audioFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);

  const currentAccessPaths = activeItem?.accessPaths ?? [];
  const currentAnchor = activeItem?.relationship?.currentAnchor ?? null;
  const audioAccessPath = currentAccessPaths.find(
    (p) =>
      (p.kind === "web" && typeof (p as any).url === "string" && /\.(mp3|m4b|m4a|wav|ogg|aac|flac)$/i.test((p as any).url)) ||
      (p.kind === "local_file" && typeof (p as any).filePath === "string" && /\.(mp3|m4b|m4a|wav|ogg|aac|flac)$/i.test((p as any).filePath)),
  );
  const playableAudioPathUrl = (audioAccessPath as any)?.url ?? null;

  React.useEffect(() => {
    if (currentAnchor && (currentAnchor as any).type === "audiobook") {
      const anyAnchor = currentAnchor as any;
      if (typeof anyAnchor.timestampSeconds === "number") {
        setAudioCurrentTime(anyAnchor.timestampSeconds);
      }
      if (typeof anyAnchor.totalSeconds === "number" && anyAnchor.totalSeconds > 0) {
        setAudioDuration(anyAnchor.totalSeconds);
      }
    }
  }, [currentAnchor]);

  React.useEffect(() => {
    return () => {
      if (localAudioUrl) {
        URL.revokeObjectURL(localAudioUrl);
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [localAudioUrl]);

  // ─── Manual Cadence & Hiatus Awakening Timers ─────────────────────────────
  const [showCadenceModal, setShowCadenceModal] = React.useState(false);
  const [selectedPathForCadence, setSelectedPathForCadence] = React.useState<string | null>(null);
  const [cadenceDays, setCadenceDays] = React.useState<number>(7);
  const [cadenceScheduleName, setCadenceScheduleName] = React.useState<string>("Weekly (7 Days)");
  const [showHiatusModal, setShowHiatusModal] = React.useState(false);
  const [hiatusDays, setHiatusDays] = React.useState<number>(30);
  const [hiatusReason, setHiatusReason] = React.useState<string>("Author on hiatus / seasonal break");
  const [hiatusNotes, setHiatusNotes] = React.useState<string>("");

  const [cadenceMap, setCadenceMap] = React.useState<Record<string, { days: number; nextDate: string; label: string }>>(() => {
    try {
      const raw = localStorage.getItem("cv:access_path_cadence:v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const [hiatusMap, setHiatusMap] = React.useState<Record<string, { days: number; recheckDate: string; reason: string; notes?: string }>>(() => {
    try {
      const raw = localStorage.getItem("cv:hiatus_timers:v1");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const saveCadence = (pathId: string, days: number, label: string) => {
    const nextDate = new Date(Date.now() + days * 86400000).toISOString();
    const updated = { ...cadenceMap, [pathId]: { days, nextDate, label } };
    setCadenceMap(updated);
    localStorage.setItem("cv:access_path_cadence:v1", JSON.stringify(updated));
    setShowCadenceModal(false);
    toast({ title: "Update cadence saved", description: `Recheck timer scheduled every ${days} days (${label})` });
  };

  const resetCadenceTimer = (pathId: string) => {
    const existing = cadenceMap[pathId];
    const days = existing?.days ?? 7;
    const label = existing?.label ?? "Weekly (7 Days)";
    const nextDate = new Date(Date.now() + days * 86400000).toISOString();
    const updated = { ...cadenceMap, [pathId]: { days, nextDate, label } };
    setCadenceMap(updated);
    localStorage.setItem("cv:access_path_cadence:v1", JSON.stringify(updated));
    toast({ title: "Cadence timer reset", description: `Next manual check due in ${days} days.` });
  };

  const removeCadence = (pathId: string) => {
    const updated = { ...cadenceMap };
    delete updated[pathId];
    setCadenceMap(updated);
    localStorage.setItem("cv:access_path_cadence:v1", JSON.stringify(updated));
    setShowCadenceModal(false);
    toast({ title: "Cadence timer removed" });
  };

  const saveHiatusTimer = (workIdToSave: string, days: number, reason: string, notes?: string) => {
    const recheckDate = new Date(Date.now() + days * 86400000).toISOString();
    const updated = { ...hiatusMap, [workIdToSave]: { days, recheckDate, reason, notes } };
    setHiatusMap(updated);
    localStorage.setItem("cv:hiatus_timers:v1", JSON.stringify(updated));
    setShowHiatusModal(false);
    toast({ title: "Hiatus Awakening Timer set", description: `Grimoire will prompt you to recheck in ${days} days.` });
  };

  const clearHiatusTimer = (workIdToClear: string) => {
    const updated = { ...hiatusMap };
    delete updated[workIdToClear];
    setHiatusMap(updated);
    localStorage.setItem("cv:hiatus_timers:v1", JSON.stringify(updated));
    toast({ title: "Hiatus timer cleared" });
  };

  // Audio playback ticker for synthetic / fallback audio
  React.useEffect(() => {
    if (!audioIsPlaying) return;
    const interval = setInterval(() => {
      setAudioCurrentTime((prev) => {
        const next = prev + 1;
        if (audioDuration && next >= audioDuration) {
          setAudioIsPlaying(false);
          return audioDuration;
        }
        return next;
      });
    }, 1000 / audioPlaybackRate);

    return () => clearInterval(interval);
  }, [audioIsPlaying, audioDuration, audioPlaybackRate]);

  const handleAudioTimeUpdate = () => {
    if (audioElementRef.current) {
      setAudioCurrentTime(audioElementRef.current.currentTime);
      if (audioElementRef.current.duration && !Number.isNaN(audioElementRef.current.duration)) {
        setAudioDuration(audioElementRef.current.duration);
      }
    }
  };

  const handleAudioSeek = (newTime: number) => {
    setAudioCurrentTime(newTime);
    if (audioElementRef.current) {
      audioElementRef.current.currentTime = newTime;
    }
    if (work && anchor && anchor.type === "audiobook") {
      updateRelationshipInLibrary(work.id, {
        currentAnchor: {
          ...anchor,
          timestampSeconds: Math.floor(newTime),
          totalSeconds: audioDuration || anchor.totalSeconds,
        },
      });
    }
  };

  const toggleAudioPlay = () => {
    if (audioIsPlaying) {
      setAudioIsPlaying(false);
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setAudioIsPlaying(true);
      if (audioElementRef.current && (localAudioUrl || playableAudioPathUrl)) {
        audioElementRef.current.play().catch(() => {});
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const anyAnchor = anchor as any;
        const textToRead = `${work.title}. ${anyAnchor?.title ?? "Audiobook"}. Narrated by ${anyAnchor?.narrator ?? "Soundbooth Theater"}. ${work.description}`;
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = audioPlaybackRate;
        utterance.onend = () => setAudioIsPlaying(false);
        window.speechSynthesis.speak(utterance);
      }
      toast({
        title: "Audiobook Playing",
        description: `Now playing: ${(anchor as any)?.title ?? work.title}`,
      });
    }
  };

  const handleUploadAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (localAudioUrl) URL.revokeObjectURL(localAudioUrl);
    const url = URL.createObjectURL(file);
    setLocalAudioUrl(url);
    setLocalAudioFileName(file.name);
    setAudioIsPlaying(true);
    if (audioElementRef.current) {
      audioElementRef.current.src = url;
      audioElementRef.current.play().catch(() => {});
    }
    toast({
      title: "Audiobook File Loaded",
      description: `Playing ${file.name} directly in browser.`,
      variant: "success",
    });
  };

  const handleAudioVolumeChange = (newVol: number) => {
    setAudioVolume(newVol);
    setAudioIsMuted(newVol === 0);
    if (audioElementRef.current) {
      audioElementRef.current.volume = newVol;
      audioElementRef.current.muted = newVol === 0;
    }
  };

  const toggleAudioMute = () => {
    if (audioIsMuted) {
      setAudioIsMuted(false);
      if (audioElementRef.current) audioElementRef.current.muted = false;
    } else {
      setAudioIsMuted(true);
      if (audioElementRef.current) audioElementRef.current.muted = true;
    }
  };

  const skipAudio = (secondsDelta: number) => {
    const newTime = Math.max(0, Math.min(audioCurrentTime + secondsDelta, audioDuration || 999999));
    handleAudioSeek(newTime);
  };

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
  const [mergeModalOpen, setMergeModalOpen] = React.useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("merge") === "1";
    }
    return false;
  });
  const [resumeModalOpen, setResumeModalOpen] = React.useState(false);
  const [showAccessLinksModal, setShowAccessLinksModal] = React.useState(false);
  const [fetchingCover, setFetchingCover] = React.useState(false);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [customCoverUrl, setCustomCoverUrl] = React.useState("");
  const [isScanningSources, setIsScanningSources] = React.useState(false);
  const [recommendedPaths, setRecommendedPaths] = React.useState<DiscoveredAccessPathCandidate[]>([]);
  const [hasScannedSources, setHasScannedSources] = React.useState(false);

  const handleScanSources = async () => {
    setIsScanningSources(true);
    setHasScannedSources(true);
    try {
      const found = await scanDirectoryAccessPathsForTitle(work.title);
      const existingUrls = new Set(
        accessPaths.map((p) => {
          if ("url" in p && typeof (p as any).url === "string") return (p as any).url;
          if ("filePath" in p && typeof (p as any).filePath === "string") return (p as any).filePath;
          return "";
        }).filter(Boolean),
      );
      const filtered = found.filter((p) => !existingUrls.has(p.url));
      setRecommendedPaths(filtered);
      if (filtered.length > 0) {
        toast({
          title: "Directory Scan Complete",
          description: "Discovered " + filtered.length + " recommended access path(s) for \"" + work.title + "\".",
          variant: "success",
        });
      } else {
        toast({
          title: "Scan Completed",
          description: "All detected sources are already linked to this work.",
          variant: "default",
        });
      }
    } catch (err) {
      toast({
        title: "Scan Failed",
        description: err instanceof Error ? err.message : "Failed to scan directories.",
        variant: "destructive",
      });
    } finally {
      setIsScanningSources(false);
    }
  };

  const handleAttachRecommendedPath = (recPath: DiscoveredAccessPathCandidate) => {
    addAccessPath({
      kind: "web" as Parameters<typeof addAccessPath>[0]["kind"],
      provider: recPath.provider || null,
      label: recPath.label,
      url: recPath.url,
      capabilities: [AccessCapability.Read, AccessCapability.Updates],
      health: "healthy" as Parameters<typeof addAccessPath>[0]["health"],
      healthState: "healthy" as Parameters<typeof addAccessPath>[0]["healthState"],
      lastCheckedAt: new Date().toISOString(),
      lastOpenedAt: null,
      isPreferred: accessPaths.length === 0,
      provenance: { source: "directory_scan_" + recPath.providerKey },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Parameters<typeof addAccessPath>[0]);

    setRecommendedPaths((prev) => prev.filter((p) => p.id !== recPath.id));
    toast({
      title: "Reading Source Attached",
      description: "Linked " + recPath.label + " to this work.",
      variant: "success",
    });
  };

  const handleAttachAllRecommended = () => {
    for (const recPath of recommendedPaths) {
      addAccessPath({
        kind: "web" as Parameters<typeof addAccessPath>[0]["kind"],
        provider: recPath.provider || null,
        label: recPath.label,
        url: recPath.url,
        capabilities: [AccessCapability.Read, AccessCapability.Updates],
        health: "healthy" as Parameters<typeof addAccessPath>[0]["health"],
        healthState: "healthy" as Parameters<typeof addAccessPath>[0]["healthState"],
        lastCheckedAt: new Date().toISOString(),
        lastOpenedAt: null,
        isPreferred: false,
        provenance: { source: "directory_scan_" + recPath.providerKey },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Parameters<typeof addAccessPath>[0]);
    }
    toast({
      title: "All Sources Attached",
      description: "Attached " + recommendedPaths.length + " access paths to \"" + work.title + "\".",
      variant: "success",
    });
    setRecommendedPaths([]);
  };
  const coverFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Memory image upload state
  const [pendingMemoryImageUrl, setPendingMemoryImageUrl] = React.useState<string | null>(null);
  const memoryImageInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleFetchCoverFromWeb = async () => {
    if (!work) return;
    setFetchingCover(true);
    try {
      const coverUrl = await autoFetchCoverForWork(work.id, work.title, { silent: false });
      if (coverUrl) {
        updateCover(coverUrl);
      }
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
            className="gap-2 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Library</span>
          </Button>
        </div>
        <div className="text-center py-24 text-[var(--gm-text-muted)]">Work not found.</div>
      </PageContainer>
    );
  }

  const { work, relationship, accessPaths, memories, updates } = activeItem;
  const anchor = relationship?.currentAnchor ?? null;
  const anchorLabel = anchor ? formatProgressAnchor(anchor) : "Not started";
  const preferredPath = accessPaths.find((p) => p.isPreferred) ?? accessPaths[0];

  const handleResume = async () => {
    if (work?.contentType === ContentType.Audiobook) {
      toggleAudioPlay();
      return;
    }

    // 1. Priority: Check preferredPath FIRST!
    if (preferredPath) {
      if (preferredPath.kind === "web" && preferredPath.url) {
        window.open(preferredPath.url, "_blank");
        return;
      }
      if (preferredPath.kind === "local_file" && preferredPath.fileId) {
        toast({
          title: "Resuming reading session",
          description: `Opening ${preferredPath.label ?? "local file"}`,
        });
        if (onOpenFile) onOpenFile(preferredPath.fileId);
        else window.location.href = `/reader/${encodeURIComponent(preferredPath.fileId)}`;
        return;
      }
    }

    const { listLocalFiles } = await import("@grimoire/reader");
    const files = await listLocalFiles().catch(() => []);

    // 2. Direct local file linked via accessPaths
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

    // 3. Shelf file linked to this work
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

    // 4. If a linked local video exists and no ebook is linked, jump to Access Paths tab & open video player
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

    // 5. If web access paths exist, open directly (1 link) or show picker (2+)
    const webPaths = accessPaths.filter((p): p is typeof p & { url: string } => p.kind === "web" && typeof p.url === "string" && p.url.length > 0);
    if (webPaths.length === 1 && webPaths[0]) {
      window.open(webPaths[0].url, "_blank");
      return;
    }
    if (webPaths.length > 1) {
      setShowAccessLinksModal(true);
      return;
    }

    // 6. Otherwise open ResumeReadingModal to choose web source, video, or shelf EPUB
    setResumeModalOpen(true);
  };

  const handleStateChange = (value: string) => {
    updatePersonalState(value as PersonalState);
    if (value === PersonalState.Paused || value === PersonalState.Dropped) {
      setHiatusReason(value === PersonalState.Paused ? "Author on hiatus / seasonal break" : "Dropped story / lost interest");
      setShowHiatusModal(true);
    } else if (value === PersonalState.Reading && hiatusMap[work.id]) {
      clearHiatusTimer(work.id);
      toast({ title: "Story Resumed!", description: "Hiatus timer cleared. Happy reading!" });
      return;
    }
    toast({ title: "Status updated", description: `Marked as ${value}` });
  };

  const handleShelfTierChange = (value: string) => {
    const tier = value as ShelfPriorityTier;
    updateShelfTier(tier);
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
          className="gap-2 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Library</span>
        </Button>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-gm-2xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 sm:p-8 shadow-lg mb-8">
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
                className="w-full gap-1.5 text-xs text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent)]/10"
              >
                <RefreshCw className={cn("h-3 w-3", fetchingCover && "animate-spin")} />
                <span>{fetchingCover ? "Fetching..." : "Fetch Official Cover"}</span>
              </Button>
              <div className="flex items-center gap-1.5 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="flex-1 gap-1 text-[11px] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] border border-[var(--gm-border)]"
                >
                  <Upload className="h-3 w-3" />
                  <span>Upload</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="flex-1 gap-1 text-[11px] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] border border-[var(--gm-border)]"
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
                <span className="rounded-gm-sm bg-[var(--gm-surface)] px-2 py-0.5 font-mono text-[11px] uppercase text-[var(--gm-text-muted)] border border-[var(--gm-border)]">
                  {work.contentType}
                </span>
                <span className="rounded-gm-sm bg-[var(--gm-surface)] px-2 py-0.5 text-[11px] text-[var(--gm-text-muted)] border border-[var(--gm-border)]">
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
              <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
                {work.title}
              </h1>

              {/* Alt titles */}
              {work.alternativeTitles.length > 0 && (
                <p className="mt-1 text-gm-xs text-[var(--gm-text-subtle)]">
                  Also known as: {work.alternativeTitles.join(" · ")}
                </p>
              )}

              {/* Description */}
              {work.description && (
                <p className="mt-4 text-gm-sm text-[var(--gm-text-muted)] leading-relaxed max-w-2xl">
                  {work.description}
                </p>
              )}

              {/* Genres */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {work.genres.map((g) => (
                  <span
                    key={g}
                    className="rounded-gm-full bg-[var(--gm-surface)] px-2.5 py-0.5 text-gm-xs text-[var(--gm-text-muted)]"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Assigned Categories & Lists Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-[var(--gm-text-subtle)] mr-1">In:</span>
                {assignedCategories.map((c) => (
                  <span
                    key={c.id}
                    className="inline-flex items-center gap-1 rounded-gm-full px-2.5 py-0.5 text-[10px] font-semibold border border-[var(--gm-accent-muted)] bg-[var(--gm-accent)]/10 text-[var(--gm-accent-strong)]"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    <span>{c.name}</span>
                  </span>
                ))}
                {assignedLists.map((l) => (
                  <span
                    key={l.id}
                    className="inline-flex items-center gap-1 rounded-gm-full px-2.5 py-0.5 text-[10px] font-semibold border border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text)]"
                  >
                    <BookOpen className="h-2.5 w-2.5 text-[var(--gm-text-muted)]" />
                    <span>{l.title}</span>
                  </span>
                ))}
                <button
                  type="button"
                  onClick={() => setListsModalOpen(true)}
                  className="inline-flex items-center gap-1 rounded-gm-full px-2 py-0.5 text-[10px] font-medium border border-dashed border-[var(--gm-border-strong)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:border-[var(--gm-accent)] transition-colors cursor-pointer"
                  title="Assign this work to multiple categories or lists"
                >
                  <Plus className="h-2.5 w-2.5" />
                  <span>Assign Categories &amp; Lists</span>
                </button>
              </div>
            </div>

            {/* Progress & Status Controls */}
            <div className="mt-6 pt-5 border-t border-[var(--gm-border)] flex flex-col gap-4">
              {/* Hiatus & Awakening Timer Alert Banner */}
              {(() => {
                const hiatusData = hiatusMap[work.id];
                const isPaused = relationship?.personalState === PersonalState.Paused;
                const isDropped = relationship?.personalState === PersonalState.Dropped;
                if (!hiatusData && !isPaused && !isDropped) return null;

                const now = Date.now();
                const recheckTime = hiatusData ? new Date(hiatusData.recheckDate).getTime() : 0;
                const isDue = hiatusData && now >= recheckTime;
                const daysLeft = hiatusData ? Math.ceil((recheckTime - now) / 86400000) : 0;

                return (
                  <div
                    className={cn(
                      "rounded-gm-lg border p-3.5 space-y-2.5 transition-all text-gm-xs",
                      isDue
                        ? "border-amber-500/80 bg-amber-500/10 shadow-sm animate-pulse"
                        : isDropped
                        ? "border-[var(--gm-border)] bg-[var(--gm-surface)]"
                        : "border-[var(--gm-accent)]/50 bg-[var(--gm-accent-muted)]/20"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isDue ? (
                          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <Clock className="h-4 w-4 text-[var(--gm-accent-strong)] shrink-0" />
                        )}
                        <span className="font-bold text-gm-xs text-[var(--gm-text)]">
                          {isDue
                            ? "🔔 HIATUS AWAKENING RECHECK DUE!"
                            : isDropped
                            ? "Dropped Work Archive"
                            : "Hiatus Awakening Tracker"}
                        </span>
                        {hiatusData && (
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold",
                              isDue
                                ? "bg-amber-500 text-black"
                                : "bg-[var(--gm-surface)] text-[var(--gm-text-muted)] border border-[var(--gm-border)]"
                            )}
                          >
                            {isDue
                              ? "Recheck Now"
                              : daysLeft > 0
                              ? `${daysLeft} days remaining`
                              : "Today"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[10px] gap-1"
                          onClick={() => {
                            setHiatusDays(hiatusData?.days ?? 30);
                            setHiatusReason(hiatusData?.reason ?? (isDropped ? "Dropped story" : "Author hiatus"));
                            setHiatusNotes(hiatusData?.notes ?? "");
                            setShowHiatusModal(true);
                          }}
                        >
                          <Timer className="h-3 w-3" />
                          <span>{hiatusData ? "Edit Timer" : "Set Awakening Timer"}</span>
                        </Button>

                        {isDue && preferredPath && "url" in preferredPath && preferredPath.url && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-6 px-2.5 text-[10px] gap-1 bg-amber-500 text-black hover:bg-amber-600"
                            onClick={() => {
                              window.open((preferredPath as any).url, "_blank", "noopener,noreferrer");
                            }}
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Check Webpage</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                          onClick={() => {
                            handleStateChange(PersonalState.Reading);
                          }}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          <span>Mark Off Hiatus (Resumed)</span>
                        </Button>
                      </div>
                    </div>

                    <p className="text-[11px] text-[var(--gm-text-muted)] leading-relaxed">
                      {isDue
                        ? "The scheduled hiatus period has concluded. Check whether new chapters have been published on your reading source. If the story has resumed, click 'Mark Off Hiatus' to return it to your active reading rotation!"
                        : hiatusData?.reason
                        ? `Status note: ${hiatusData.reason}${hiatusData.notes ? ` · Note: ${hiatusData.notes}` : ""}`
                        : "This work is paused. Set a Hiatus Awakening Timer to schedule an automated prompt to recheck the source later."}
                    </p>
                  </div>
                );
              })()}
              {/* Personal State & Shelf Tier Selector */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-gm-xs text-[var(--gm-text-muted)]">Status:</span>
                <Select
                  value={relationship?.personalState ?? "planned"}
                  onValueChange={handleStateChange}
                >
                  <SelectTrigger className="w-44 h-8 text-gm-sm">
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

                <span className="text-gm-xs text-[var(--gm-text-muted)] ml-2">Shelf Tier:</span>
                <Select
                  value={relationship?.shelfTier ?? "standard"}
                  onValueChange={handleShelfTierChange}
                >
                  <SelectTrigger className="w-44 h-8 text-gm-sm">
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
                <span className="text-gm-xs text-[var(--gm-text-muted)]">Progress:</span>
                <span className="text-gm-sm font-medium text-[var(--gm-text)]">{anchorLabel}</span>
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
                  {work.contentType === ContentType.Audiobook ? (
                    <>
                      {audioIsPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                      <span>{audioIsPlaying ? "Pause Audio" : "Listen / Play"}</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Resume</span>
                    </>
                  )}
                </Button>

                <div className="flex items-center gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setListsModalOpen(true)}
                    title="Assign to custom categories and personal lists"
                  >
                    <Tag className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
                    <span>Categories &amp; Lists</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => setMergeModalOpen(true)}
                    title="Merge duplicates into this record"
                  >
                    <GitMerge className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
                    <span>Merge</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-[var(--gm-text-muted)] hover:text-red-400"
                    onClick={() => setArchiveModalOpen(true)}
                    title="Archive this work out of active library"
                  >
                    <ArchiveIcon className="h-3.5 w-3.5" />
                    <span>Archive</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (typeof window !== 'undefined' && !window.confirm(`Permanently purge "${work.title}" and all its records? This cannot be undone.`)) return;
                      try {
                        clientRepository.purgeWork(work.id as WorkId);
                        toast({ title: 'Work purged', description: `"${work.title}" was permanently removed.` });
                        if (onBack) onBack();
                      } catch (err) {
                        toast({ title: 'Purge failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
                      }
                    }}
                    className="gap-1.5 text-gm-xs text-[var(--gm-danger)] hover:bg-[var(--gm-danger-muted)]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Permanently Purge</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audiobook Support: Live Audio Player Bar */}
      {work.contentType === ContentType.Audiobook && (
        <div className="mb-6 rounded-gm-xl border-2 border-[var(--gm-accent-strong)] bg-[var(--gm-bg-elevated)] p-4 sm:p-5 shadow-lg space-y-3">
          {/* Hidden audio element and local file input */}
          <audio
            ref={audioElementRef}
            src={localAudioUrl || playableAudioPathUrl || undefined}
            onTimeUpdate={handleAudioTimeUpdate}
            onEnded={() => setAudioIsPlaying(false)}
            onPlay={() => setAudioIsPlaying(true)}
            onPause={() => setAudioIsPlaying(false)}
            preload="metadata"
            className="hidden"
          />
          <input
            ref={audioFileInputRef}
            type="file"
            accept="audio/*,.mp3,.m4b,.m4a,.wav,.ogg,.aac,.flac"
            onChange={handleUploadAudioFile}
            className="hidden"
          />

          {/* Top Bar: Title, Chapter, Narrator, Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--gm-border)] pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-cv bg-[var(--gm-accent)]/15 text-[var(--gm-accent-strong)]">
                <Headphones className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-gm-sm font-bold text-[var(--gm-text)] truncate">
                    {(anchor as any)?.title ?? `${work.title} — Audio Edition`}
                  </h3>
                  <Badge variant="default" className="text-[10px] font-mono shrink-0">
                    {audioIsPlaying ? "PLAYING" : "PAUSED"}
                  </Badge>
                </div>
                <p className="text-gm-xs text-[var(--gm-text-muted)] truncate">
                  {(anchor as any)?.narrator ? <span>Narrated by <strong className="text-[var(--gm-text)]">{(anchor as any).narrator}</strong> · </span> : null}
                  {(anchor as any)?.track !== undefined && <span>Track {(anchor as any).track} · </span>}
                  {(anchor as any)?.chapter !== undefined && <span>Chapter {(anchor as any).chapter} · </span>}
                  <span>{localAudioFileName ? `Local File: ${localAudioFileName}` : (audioAccessPath ? "Soundbooth / Linked Audio" : "Sanctum Audio Engine")}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => audioFileInputRef.current?.click()}
                className="h-7 text-[11px] gap-1"
                title="Select a local audio file from disk to stream"
              >
                <Upload className="h-3 w-3" />
                <span>{localAudioFileName ? "Switch Audio File" : "Choose Audio File"}</span>
              </Button>
            </div>
          </div>

          {/* Center Scrubber Progress Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-gm-xs font-mono text-[var(--gm-text-muted)]">
              <span>
                {Math.floor(audioCurrentTime / 60)}:{String(Math.floor(audioCurrentTime % 60)).padStart(2, "0")}
              </span>
              <span className="text-[11px]">
                {Math.round(((audioCurrentTime) / (audioDuration || 1)) * 100)}% Complete
              </span>
              <span>
                {Math.floor((audioDuration || 2740) / 60)}:{String(Math.floor((audioDuration || 2740) % 60)).padStart(2, "0")}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={audioDuration || 2740}
              value={audioCurrentTime}
              onChange={(e) => handleAudioSeek(Number(e.target.value))}
              className="w-full h-2 rounded-none bg-[var(--gm-surface)] accent-[var(--gm-accent-strong)] cursor-pointer"
            />
          </div>

          {/* Bottom Player Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Play, Skip Back, Skip Forward */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => skipAudio(-15)}
                className="h-8 px-2 text-gm-xs font-mono gap-1"
                title="Skip back 15 seconds"
              >
                <SkipBack className="h-3.5 w-3.5" />
                <span>-15s</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={toggleAudioPlay}
                className="h-8 px-4 text-gm-xs font-bold gap-1.5 bg-[var(--gm-accent-strong)] text-white hover:opacity-95 cursor-pointer"
              >
                {audioIsPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white" />}
                <span>{audioIsPlaying ? "PAUSE" : "PLAY"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skipAudio(30)}
                className="h-8 px-2 text-gm-xs font-mono gap-1"
                title="Skip forward 30 seconds"
              >
                <SkipForward className="h-3.5 w-3.5" />
                <span>+30s</span>
              </Button>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2 min-w-[130px]">
              <button
                type="button"
                onClick={toggleAudioMute}
                className="text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] cursor-pointer"
                title={audioIsMuted ? "Unmute" : "Mute"}
              >
                {audioIsMuted || audioVolume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : audioVolume < 0.5 ? (
                  <Volume1 className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={audioIsMuted ? 0 : audioVolume}
                onChange={(e) => handleAudioVolumeChange(Number(e.target.value))}
                className="w-20 sm:w-24 h-1.5 accent-[var(--gm-accent-strong)] cursor-pointer"
                title="Volume"
              />
            </div>

            {/* Speed Selector */}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-[11px] font-mono text-[var(--gm-text-muted)]">Speed:</span>
              <select
                value={String(audioPlaybackRate)}
                onChange={(e) => {
                  const rate = Number(e.target.value);
                  setAudioPlaybackRate(rate);
                  if (audioElementRef.current) audioElementRef.current.playbackRate = rate;
                }}
                className="h-7 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2 text-gm-xs font-mono text-[var(--gm-text)] cursor-pointer focus:outline-none"
              >
                <option value="0.75">0.75×</option>
                <option value="1">1.0×</option>
                <option value="1.25">1.25×</option>
                <option value="1.5">1.5×</option>
                <option value="1.75">1.75×</option>
                <option value="2">2.0×</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
            <div className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5">
              <h3 className="text-gm-sm font-semibold text-[var(--gm-text)] mb-4">Reading Stats</h3>
              <dl className="space-y-2 text-gm-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--gm-text-muted)]">Status</dt>
                  <dd className="font-medium text-[var(--gm-text)]">
                    {relationship?.personalState ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--gm-text-muted)]">Shelf Priority</dt>
                  <dd className="font-medium text-[var(--gm-text)]">
                    {relationship?.shelfTier
                      ? relationship.shelfTier.replace("_", " ")
                      : "standard"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--gm-text-muted)]">Current</dt>
                  <dd className="font-medium text-[var(--gm-text)]">{anchorLabel}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--gm-text-muted)]">Last active</dt>
                  <dd className="font-medium text-[var(--gm-text)]">
                    {relationship?.lastActiveAt ? relativeTime(relationship.lastActiveAt) : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[var(--gm-text-muted)]">Started</dt>
                  <dd className="font-medium text-[var(--gm-text)]">
                    {relationship?.startedAt ? relativeTime(relationship.startedAt) : "—"}
                  </dd>
                </div>
                {updates.length > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--gm-text-muted)]">Latest release</dt>
                    <dd className="font-medium text-[var(--gm-accent-strong)]">
                      {updates[0]?.label ?? "—"}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Tags */}
            <div className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5">
              <h3 className="text-gm-sm font-semibold text-[var(--gm-text)] mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {work.tags.length > 0 ? (
                  work.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-cv px-2.5 py-1 text-gm-xs bg-[var(--gm-surface)] text-[var(--gm-text-muted)] border border-[var(--gm-border)]"
                    >
                      #{t}
                    </span>
                  ))
                ) : (
                  <p className="text-gm-xs text-[var(--gm-text-subtle)]">No tags.</p>
                )}
              </div>
            </div>

            {/* Extended Bibliographic Metadata Card */}
            <div className="md:col-span-2 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-gm-sm font-semibold text-[var(--gm-text)]">
                    Bibliographic Metadata & Rating
                  </h3>
                  <p className="text-gm-xs text-[var(--gm-text-muted)]">
                    Optional creator credits, personal rating, chapter/volume counts, and content warnings.
                  </p>
                </div>
                {!editingMetadata && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenMetadataEditor}
                    className="gap-1.5 text-gm-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Edit Metadata</span>
                  </Button>
                )}
              </div>

              {editingMetadata ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-gm-xs">
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Personal Rating (0–10)</span>
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
                    <span className="text-[var(--gm-text-muted)]">Creator / Author Name</span>
                    <Input
                      value={metaCreatorName}
                      onChange={(e) => setMetaCreatorName(e.target.value)}
                      placeholder="e.g. Sing Shong"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Creator Role</span>
                    <select
                      value={metaCreatorRole}
                      onChange={(e) => setMetaCreatorRole(e.target.value as WorkCreatorRole)}
                      className="w-full h-9 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2.5 text-gm-xs text-[var(--gm-text)]"
                    >
                      <option value="author">Author</option>
                      <option value="artist">Artist</option>
                      <option value="studio">Studio</option>
                      <option value="translator">Translator</option>
                      <option value="editor">Editor</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Total Chapters / Episodes</span>
                    <Input
                      type="number"
                      min={0}
                      value={metaTotalChapters}
                      onChange={(e) => setMetaTotalChapters(e.target.value)}
                      placeholder="e.g. 551"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Total Volumes</span>
                    <Input
                      type="number"
                      min={0}
                      value={metaTotalVolumes}
                      onChange={(e) => setMetaTotalVolumes(e.target.value)}
                      placeholder="e.g. 20"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Total Pages</span>
                    <Input
                      type="number"
                      min={0}
                      value={metaTotalPages}
                      onChange={(e) => setMetaTotalPages(e.target.value)}
                      placeholder="Optional"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Original Title</span>
                    <Input
                      value={metaOriginalTitle}
                      onChange={(e) => setMetaOriginalTitle(e.target.value)}
                      placeholder="Native script title"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Original Language</span>
                    <Input
                      value={metaOriginalLanguage}
                      onChange={(e) => setMetaOriginalLanguage(e.target.value)}
                      placeholder="e.g. ko, ja, zh, en"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Content Rating</span>
                    <select
                      value={metaContentRating}
                      onChange={(e) => setMetaContentRating(e.target.value as ContentRating)}
                      className="w-full h-9 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-2.5 text-gm-xs text-[var(--gm-text)]"
                    >
                      <option value="everyone">Everyone</option>
                      <option value="teen">Teen</option>
                      <option value="mature">Mature</option>
                      <option value="explicit">Explicit</option>
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Start Date</span>
                    <Input
                      type="date"
                      value={metaStartDate}
                      onChange={(e) => setMetaStartDate(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">End Date</span>
                    <Input
                      type="date"
                      value={metaEndDate}
                      onChange={(e) => setMetaEndDate(e.target.value)}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[var(--gm-text-muted)]">Content Warnings (comma-separated)</span>
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
                <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-gm-xs">
                  <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3">
                    <dt className="text-[var(--gm-text-subtle)]">Personal Rating</dt>
                    <dd className="mt-1 font-mono text-gm-sm font-semibold text-[var(--gm-accent-strong)]">
                      {work.rating !== undefined && work.rating !== null ? `${work.rating} / 10` : "Unrated"}
                    </dd>
                  </div>
                  <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3">
                    <dt className="text-[var(--gm-text-subtle)]">Creators</dt>
                    <dd className="mt-1 font-medium text-[var(--gm-text)]">
                      {work.creators && work.creators.length > 0
                        ? work.creators.map((c) => `${c.name} (${c.role})`).join(", ")
                        : "—"}
                    </dd>
                  </div>
                  <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3">
                    <dt className="text-[var(--gm-text-subtle)]">Extent</dt>
                    <dd className="mt-1 font-mono text-[var(--gm-text)]">
                      {[
                        work.totalChapters ? `${work.totalChapters} ch` : null,
                        work.totalVolumes ? `${work.totalVolumes} vol` : null,
                        work.totalPages ? `${work.totalPages} p` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ") || "—"}
                    </dd>
                  </div>
                  <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3">
                    <dt className="text-[var(--gm-text-subtle)]">Original Title / Rating</dt>
                    <dd className="mt-1 text-[var(--gm-text)]">
                      {work.originalTitle ?? "—"}
                      {work.contentRating ? ` · ${work.contentRating}` : ""}
                    </dd>
                  </div>
                </dl>
              )}
            </div>

            {/* Relations Section in Overview */}
            <div className="md:col-span-2 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5">
              <WorkRelationTree workId={work.id} onNavigateWork={onNavigateWork} />
            </div>

            {/* Audiobook Player Console — shown for audiobook contentType */}
            {work.contentType === ContentType.Audiobook && (
              <div className="md:col-span-2 rounded-none border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] shadow-[4px_4px_0px_var(--gm-border-strong)]">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gm-border)] bg-[var(--gm-surface)]">
                  <div className="flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                    <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--gm-text-subtle)]">
                      [ AUDIOBOOK CONSOLE ]
                    </span>
                  </div>
                  <Badge variant="default" className="text-[10px] font-mono">
                    {audioIsPlaying ? "PLAYING" : "STANDBY"}
                  </Badge>
                </div>
                <div className="p-4 grid gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {(anchor as any)?.narrator ? (
                        <p className="text-gm-xs text-[var(--gm-text-muted)]">
                          <span className="font-semibold text-[var(--gm-text)]">Narrator:</span> {(anchor as any).narrator}
                        </p>
                      ) : null}
                      <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                        <span className="font-semibold text-[var(--gm-text)]">Book:</span> {(anchor as any)?.title ?? work.title}
                      </p>
                      <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                        <span className="font-semibold text-[var(--gm-text)]">Track:</span> {(anchor as any)?.track ?? 1}
                        {(anchor as any)?.chapter !== undefined && (
                          <span className="ml-2">· <span className="font-semibold text-[var(--gm-text)]">Chapter:</span> {(anchor as any).chapter}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right font-mono text-gm-xs text-[var(--gm-text-muted)]">
                      <span>
                        {Math.floor(audioCurrentTime / 60)}:{String(Math.floor(audioCurrentTime % 60)).padStart(2, "0")}
                        <span> / {Math.floor((audioDuration || 2740) / 60)}:{String(Math.floor((audioDuration || 2740) % 60)).padStart(2, "0")}</span>
                      </span>
                    </div>
                  </div>

                  {/* Live Progress Scrubber */}
                  <div className="space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 2740}
                      value={audioCurrentTime}
                      onChange={(e) => handleAudioSeek(Number(e.target.value))}
                      className="w-full h-2 rounded-none bg-[var(--gm-surface)] accent-[var(--gm-accent-strong)] cursor-pointer"
                    />
                  </div>

                  {/* Interactive Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => skipAudio(-15)}
                      className="inline-flex items-center gap-1 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--gm-accent)] transition-all cursor-pointer"
                      title="Skip back 15 seconds"
                    >
                      <SkipBack className="h-3 w-3" />
                      <span>-15s</span>
                    </button>
                    <button
                      type="button"
                      onClick={toggleAudioPlay}
                      className="inline-flex items-center gap-1 rounded-none border-2 border-[var(--gm-accent-strong)] bg-[var(--gm-accent-strong)] px-3 py-1 text-[11px] font-mono font-bold text-white shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                    >
                      {audioIsPlaying ? (
                        <>
                          <Pause className="h-3 w-3 fill-white" />
                          <span>PAUSE</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 fill-white" />
                          <span>PLAY</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => skipAudio(30)}
                      className="inline-flex items-center gap-1 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_var(--gm-accent)] transition-all cursor-pointer"
                      title="Skip forward 30 seconds"
                    >
                      <SkipForward className="h-3 w-3" />
                      <span>+30s</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => audioFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
                      title="Attach local audio file"
                    >
                      <Upload className="h-3 w-3" />
                      <span>Attach Audio</span>
                    </button>
                    <select
                      value={String(audioPlaybackRate)}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        setAudioPlaybackRate(rate);
                        if (audioElementRef.current) audioElementRef.current.playbackRate = rate;
                      }}
                      className="ml-auto font-mono text-[11px] border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2 py-1 rounded-none text-[var(--gm-text)] cursor-pointer focus:outline-none"
                    >
                      <option value="0.75">0.75×</option>
                      <option value="1">1.0×</option>
                      <option value="1.25">1.25×</option>
                      <option value="1.5">1.5×</option>
                      <option value="1.75">1.75×</option>
                      <option value="2">2.0×</option>
                    </select>
                  </div>
                  <p className="text-[10px] text-[var(--gm-text-muted)] font-mono">
                    ✓ Interactive audio player — playback progress automatically syncs with your reading anchor.
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Relations Tab */}
        <TabsContent value="relations" className="mt-6">
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-sm">
            <WorkRelationTree workId={work.id} onNavigateWork={onNavigateWork} />
          </div>
        </TabsContent>

        {/* Access Paths Tab */}
        <TabsContent value="sources" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <p className="text-gm-xs text-[var(--gm-text-muted)]">
              URLs, local ebook files, and local video references linked to this work.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isScanningSources}
                onClick={handleScanSources}
                className="gap-1.5 border-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent)]/10"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>{isScanningSources ? "Scanning Directories…" : "Scan Directory Sources"}</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  setShowLinkVideo(!showLinkVideo);
                  setShowAddSource(false);
                }}
              >
                <Film className="h-3.5 w-3.5 text-[var(--gm-accent-strong)]" />
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

          {/* Discovered Recommended Access Paths Panel */}
          {recommendedPaths.length > 0 && (
            <div className="mb-5 rounded-gm-xl border border-[var(--gm-accent-muted)] bg-[var(--gm-bg-elevated)] p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="text-gm-sm font-bold text-[var(--gm-text)] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                    <span>Discovered Directory Reading Sources ({recommendedPaths.length})</span>
                  </h4>
                  <p className="text-[11px] text-[var(--gm-text-muted)]">
                    Matching editions found across Project Gutenberg, Internet Archive, Comick, MangaDex & Goodreads.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAttachAllRecommended}
                    className="gap-1.5 text-gm-xs font-semibold"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Attach All ({recommendedPaths.length})</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRecommendedPaths([])}
                    className="text-gm-xs text-[var(--gm-text-subtle)]"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {recommendedPaths.map((rec) => (
                  <div
                    key={rec.id}
                    className="flex flex-col justify-between rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3 hover:border-[var(--gm-border-strong)] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono text-[10px] uppercase font-bold text-[var(--gm-accent-strong)] bg-[var(--gm-accent-muted)]/40 px-1.5 py-0.5 rounded">
                          {rec.provider}
                        </span>
                        {rec.format && (
                          <span className="font-mono text-[9px] px-1 py-0.2 rounded bg-[var(--gm-bg-elevated)] text-[var(--gm-text-subtle)] border border-[var(--gm-border)]">
                            {rec.format}
                          </span>
                        )}
                      </div>
                      <p className="text-gm-xs font-semibold text-[var(--gm-text)] line-clamp-1">
                        {rec.label}
                      </p>
                      {rec.description && (
                        <p className="text-[11px] text-[var(--gm-text-muted)] line-clamp-1 mt-0.5">
                          {rec.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-[var(--gm-border)]/50 flex items-center justify-between gap-2">
                      <a
                        href={rec.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] hover:underline truncate flex items-center gap-1 max-w-[170px]"
                        title={rec.url}
                      >
                        <ExternalLink className="h-3 w-3 shrink-0" />
                        <span className="truncate">Preview Link</span>
                      </a>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleAttachRecommendedPath(rec)}
                        className="h-6 px-2 text-[11px] gap-1 shrink-0"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Attach to Work</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link Local Video Reference form */}
          {showLinkVideo && (
            <div className="mb-4 rounded-gm-lg border border-[var(--gm-accent-muted)] bg-[var(--gm-bg-elevated)] p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <p className="text-gm-xs font-semibold text-[var(--gm-text)]">
                  Link Local Video File Reference (Anime / Donghua / Local Media)
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => videoFileInputRef.current?.click()}
                  className="h-7 text-gm-xs gap-1.5"
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
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
                placeholder="Episode or Release Label (e.g. Season 1 BD 1080p - Ep 01)"
                value={videoLabel}
                onChange={(e) => setVideoLabel(e.target.value)}
              />
              <input
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)] font-mono"
                placeholder="Local file path, filename, or video URL (e.g. D:/Anime/Episode_01.mp4)"
                value={videoPath}
                onChange={(e) => setVideoPath(e.target.value)}
              />
              {videoSizeBytes > 0 && (
                <p className="text-gm-xs text-[var(--gm-text-muted)] font-mono">
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
            <div className="mb-4 rounded-gm-lg border border-[var(--gm-accent-muted)] bg-[var(--gm-bg-elevated)] p-4 flex flex-col gap-3">
              <input
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
                placeholder="Label (e.g. MangaDex)"
                value={newSourceLabel}
                onChange={(e) => setNewSourceLabel(e.target.value)}
              />
              <input
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
                placeholder="URL (https://...)"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
              />
              <input
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
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
              <div className="rounded-gm-lg border border-dashed border-[var(--gm-border)] bg-[var(--gm-surface)]/40 p-8 text-center">
                <p className="text-gm-sm font-semibold text-[var(--gm-text)] mb-1">
                  No access paths connected
                </p>
                <p className="text-gm-xs text-[var(--gm-text-muted)] max-w-md mx-auto">
                  A Work in Grimoire is permanent. Even when websites change domains or sources disappear, your reading progress, notes, and relationship remain safe forever. Add a reading source above.
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
                    className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-gm-sm font-semibold text-[var(--gm-text)]">
                            {path.label ?? provider ?? path.kind}
                          </span>
                          {isVideoPath && (
                            <Badge variant="default" className="gap-1 text-[10px] font-mono">
                              <Film className="h-3 w-3" />
                              LOCAL VIDEO
                            </Badge>
                          )}
                          {sizeBytes !== null && sizeBytes > 0 && (
                            <span className="text-[11px] font-mono text-[var(--gm-text-subtle)]">
                              {(sizeBytes / (1024 * 1024)).toFixed(1)} MB
                            </span>
                          )}
                          {path.isPreferred && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gm-accent-strong)]">
                              preferred
                            </span>
                          )}
                        </div>
                        {provider && (
                          <p className="text-gm-xs text-[var(--gm-text-muted)]">{provider}</p>
                        )}
                        {url && (
                          <div className="mt-0.5">
                            {isVideoPath ? (
                              <button
                                type="button"
                                onClick={() => void openLocalDiskPath(url, path.label ?? undefined)}
                                className="text-left text-gm-xs font-mono text-[var(--gm-accent-strong)] hover:underline flex items-center gap-1.5 cursor-pointer group"
                                title="Tap to open in system default video player app (VLC, Windows Media Player, MPC)"
                              >
                                <ExternalLink className="h-3 w-3 shrink-0 opacity-70 group-hover:opacity-100" />
                                <span className="truncate">{url}</span>
                              </button>
                            ) : (
                              <p className="text-gm-xs font-mono text-[var(--gm-text-subtle)] truncate">
                                {url}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 flex-shrink-0">
                        <SourceHealthIndicator health={toUIHealth(path.health)} size="sm" />

                        {isVideoPath && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2.5 text-[11px] gap-1 text-[var(--gm-accent-strong)] hover:bg-[var(--gm-accent)]/10"
                              onClick={() => {
                                if (url) void openLocalDiskPath(url, path.label ?? undefined);
                                else toast({ title: "No file path available for this video" });
                              }}
                              title="Open video directly in system default player app (VLC, Media Player)"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Default App</span>
                            </Button>
                            <Button
                              variant={isPlayerOpen ? "default" : "outline"}
                              size="sm"
                              className="h-7 px-2.5 text-[11px] gap-1"
                              onClick={() =>
                                setActiveVideoPathId((prev) => (prev === path.id ? null : path.id))
                              }
                              title="Watch in embedded video player"
                            >
                              <Play className="h-3 w-3" />
                              <span>{isPlayerOpen ? "Hide Player" : "Watch"}</span>
                            </Button>
                          </>
                        )}

                        {!path.isPreferred && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-[var(--gm-text-muted)] hover:text-[var(--gm-accent-strong)]"
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

                        {/* Cadence & Update Timer Trigger */}
                        {path.kind === "web" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[11px] text-[var(--gm-text-muted)] hover:text-[var(--gm-accent-strong)] gap-1"
                            onClick={() => {
                              setSelectedPathForCadence(path.id);
                              const existing = cadenceMap[path.id];
                              if (existing) {
                                setCadenceDays(existing.days);
                                setCadenceScheduleName(existing.label);
                              } else {
                                setCadenceDays(7);
                                setCadenceScheduleName("Weekly (7 Days)");
                              }
                              setShowCadenceModal(true);
                            }}
                            title="Configure manual chapter release cadence & update timer"
                          >
                            <Clock className="h-3 w-3" />
                            <span>{cadenceMap[path.id]?.label ?? "Set Timer"}</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
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
                            className="h-7 w-7 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
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
                            className="h-7 w-7 text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
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
                          className="h-7 w-7 text-[var(--gm-text-muted)] hover:text-red-500 hover:bg-red-500/10"
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

                    {/* Access Path Cadence Schedule Row */}
                    {(() => {
                      const cadence = cadenceMap[path.id];
                      if (!cadence) return null;
                      const now = Date.now();
                      const nextTime = new Date(cadence.nextDate).getTime();
                      const isDue = now >= nextTime;
                      const daysDiff = Math.ceil((nextTime - now) / 86400000);

                      return (
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--gm-border)]/50 text-[11px]">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Timer className={cn("h-3.5 w-3.5", isDue ? "text-amber-500 animate-pulse" : "text-[var(--gm-accent-strong)]")} />
                            <span className={cn(isDue ? "text-amber-500 font-bold" : "text-[var(--gm-text-muted)]")}>
                              {isDue
                                ? "⚠️ Manual Check Due Now! Click URL to check chapters."
                                : `Cadence: ${cadence.label} · Next check in ${daysDiff}d (${new Date(cadence.nextDate).toLocaleDateString()})`}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-[var(--gm-accent-strong)] hover:underline"
                            onClick={() => resetCadenceTimer(path.id)}
                            title="Mark checked and restart cadence interval"
                          >
                            Mark Checked &amp; Reset (+{cadence.days}d)
                          </Button>
                        </div>
                      );
                    })()}

                    {isVideoPath && isPlayerOpen && (
                      <div className="rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3 space-y-2">
                        {playableSrc ? (
                          <div className="space-y-2">
                            <video
                              src={playableSrc}
                              controls
                              preload="metadata"
                              className="w-full max-h-96 rounded-cv bg-black"
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2 text-gm-xs text-[var(--gm-text-muted)]">
                              <span className="truncate max-w-xs">Playing: {path.label ?? url}</span>
                              <div className="flex items-center gap-2">
                                {url && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-gm-xs gap-1"
                                    onClick={() => void openLocalDiskPath(url, path.label ?? undefined)}
                                    title="Open this file in system default video player (VLC / Media Player)"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                    Open in Default App
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-gm-xs gap-1"
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
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
                            <div className="text-gm-xs text-[var(--gm-text-muted)]">
                              <p className="font-semibold text-[var(--gm-text)]">
                                Local video reference saved ({url})
                              </p>
                              <p className="mt-0.5">
                                Launch directly in your default system player (VLC / Media Player) or select the video file from your device to stream embedded.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1.5 shrink-0"
                                  onClick={() => void openLocalDiskPath(url, path.label ?? undefined)}
                                  title="Launch file in system video player"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open in Default App
                                </Button>
                              )}
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
            <p className="text-gm-xs text-[var(--gm-text-muted)]">
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
            <div className="mb-4 rounded-gm-lg border border-[var(--gm-accent-muted)] bg-[var(--gm-bg-elevated)] p-4 flex flex-col gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
                  placeholder="Title (optional)"
                  value={newMemoryTitle}
                  onChange={(e) => setNewMemoryTitle(e.target.value)}
                />
                <input
                  className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)] font-mono"
                  placeholder="Reread pass / attempt ID (optional, e.g. reread-2026)"
                  value={newMemoryAttemptId}
                  onChange={(e) => setNewMemoryAttemptId(e.target.value)}
                />
              </div>
              <textarea
                rows={3}
                className="w-full rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2 text-gm-sm text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)] resize-none"
                placeholder="Quote, note, theory, reaction…"
                value={newMemoryBody}
                onChange={(e) => setNewMemoryBody(e.target.value)}
              />

              {/* Screenshot / Image attachment */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[2px_2px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
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
                      className="h-12 w-16 object-cover rounded-none border border-[var(--gm-border-strong)]"
                    />
                    <button
                      type="button"
                      className="text-[11px] text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] cursor-pointer font-mono"
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
            <div className="text-center py-12 text-[var(--gm-text-subtle)]">
              <Star className="h-8 w-8 mx-auto mb-3 opacity-30" />
              <p className="text-gm-sm">No memories captured yet.</p>
              <p className="text-gm-xs mt-1">Save quotes, notes, and reactions as you read.</p>
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
                  <div className="flex items-center justify-between px-1 text-[11px] text-[var(--gm-text-muted)]">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={m.privacyState === PrivacyState.Private ? "muted" : "accent"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {m.privacyState}
                      </Badge>
                      {m.readingAttemptId && (
                        <span className="font-mono text-[10px] text-[var(--gm-text-subtle)]">
                          Attempt: {m.readingAttemptId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-[var(--gm-text-muted)]"
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
                        className="h-6 w-6 text-[var(--gm-text-muted)] hover:text-red-400"
                        onClick={() => {
                          clientRepository.deleteMemory(m.id as MemoryId);
                          loadWork(work.id);
                          toast({
                            title: "Memory moved to Trash Bin",
                            description: "You can restore this memory from the Trash Bin within 30 days.",
                          });
                        }}
                        title="Move memory to Trash Bin"
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
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-sm">
            <WorkNotebookPanel workId={work.id} workTitle={work.title} />
          </div>
        </TabsContent>

        {/* Fandom & Community Links Tab (BACKLOG.md §4.5) */}
        <TabsContent value="fandom" className="mt-6">
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 shadow-sm">
            <WorkFandomLinksPanel workId={work.id} workTitle={work.title} />
          </div>
        </TabsContent>

        {/* Fan Creations Tab — Fanfiction, Video Edits, Fan Art */}
        <TabsContent value="fancreations" className="mt-6">
          <WorkFanCreationsPanel workId={work.id} />
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

      {/* Access Links Picker — shown when Resume is clicked and 2+ web access paths exist */}
      {showAccessLinksModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowAccessLinksModal(false)}
        >
          <div
            className="bg-[var(--gm-bg-elevated)] border border-[var(--gm-border-strong)] rounded-gm-xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-gm-base text-[var(--gm-text)]">Choose Source</h3>
            <div className="space-y-2">
              {accessPaths
                .filter((p): p is typeof p & { url: string } => p.kind === "web" && typeof p.url === "string" && p.url.length > 0)
                .map((path) => (
                  <button
                    key={path.id}
                    onClick={() => {
                      if (path.url) {
                        window.open(path.url, "_blank");
                        setShowAccessLinksModal(false);
                      }
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-cv border border-[var(--gm-border)] hover:border-[var(--gm-accent)] hover:bg-[var(--gm-surface)] text-left transition-all"
                  >
                    <span className="text-gm-sm text-[var(--gm-text)]">{path.label || path.url}</span>
                    <ExternalLink className="h-4 w-4 text-[var(--gm-accent)]" />
                  </button>
                ))}
            </div>
            <button
              onClick={() => setShowAccessLinksModal(false)}
              className="text-gm-xs text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Multi-Category & Multi-List Assignment Dialog */}
      <Dialog open={listsModalOpen} onOpenChange={setListsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              <span>Assign &quot;{work.title}&quot;</span>
            </DialogTitle>
            <DialogDescription>
              Assign this work to multiple custom categories and personal reading lists. Changes save instantly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {/* Custom Categories Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gm-xs font-bold uppercase tracking-wider text-[var(--gm-text-muted)]">
                  Custom Categories ({assignedCategories.length}/{categories.length})
                </span>
              </div>
              {categories.length > 0 ? (
                <div className="space-y-1.5">
                  {categories.map((cat) => {
                    const isAssigned = cat.workIds.includes(workId);
                    return (
                      <div
                        key={cat.id}
                        onClick={() => toggleWorkInCategory(cat.id, workId)}
                        className={`flex items-center justify-between p-2.5 rounded-cv border transition-all cursor-pointer ${
                          isAssigned
                            ? "border-[var(--gm-accent)] bg-[var(--gm-surface)]"
                            : "border-[var(--gm-border)] hover:bg-[var(--gm-surface)]/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-[var(--gm-accent-strong)] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gm-xs text-[var(--gm-text)] truncate">
                              {cat.name}
                            </p>
                            {cat.description && (
                              <p className="text-[10px] text-[var(--gm-text-muted)] truncate">
                                {cat.description}
                              </p>
                            )}
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
              ) : (
                <p className="text-gm-xs text-[var(--gm-text-muted)] italic">
                  No categories created yet. Create some in My Categories!
                </p>
              )}
            </div>

            {/* Personal Lists Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gm-xs font-bold uppercase tracking-wider text-[var(--gm-text-muted)]">
                  Personal Lists ({assignedLists.length}/{myLists.length})
                </span>
              </div>
              {myLists.length > 0 ? (
                <div className="space-y-1.5">
                  {myLists.map((list) => {
                    const isAssigned = list.items.some((i) => i.workId === workId);
                    return (
                      <div
                        key={list.id}
                        onClick={() => {
                          if (isAssigned) {
                            removeWorkFromList(list.id, workId);
                          } else {
                            addWorkToList(list.id, workId);
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-cv border transition-all cursor-pointer ${
                          isAssigned
                            ? "border-[var(--gm-accent)] bg-[var(--gm-surface)]"
                            : "border-[var(--gm-border)] hover:bg-[var(--gm-surface)]/60"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <BookOpen className="h-3.5 w-3.5 text-[var(--gm-text-muted)] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-gm-xs text-[var(--gm-text)] truncate">
                              {list.title}
                            </p>
                            <p className="text-[10px] text-[var(--gm-text-muted)]">
                              {list.items.length} works
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
              ) : (
                <p className="text-gm-xs text-[var(--gm-text-muted)] italic">
                  No personal lists created yet. Create one in Lists!
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button onClick={() => setListsModalOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 1: Configure Chapter Release Cadence & Update Timer ────── */}
      <Dialog open={showCadenceModal} onOpenChange={setShowCadenceModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-[var(--gm-accent-strong)]" />
              <span>Configure Release Cadence &amp; Check Timer</span>
            </DialogTitle>
            <DialogDescription>
              When websites cannot be scraped automatically (e.g. Cloudflare protection or apps), Grimoire tracks your expected chapter cadence and alerts you when a manual check is due.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-gm-xs font-semibold text-[var(--gm-text)] block mb-1.5">
                Release Check Interval:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  { days: 1, label: "Daily (1 Day)" },
                  { days: 3, label: "Every 3 Days" },
                  { days: 7, label: "Weekly (7 Days)" },
                  { days: 14, label: "Bi-Weekly (14 Days)" },
                  { days: 30, label: "Monthly (30 Days)" },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => {
                      setCadenceDays(preset.days);
                      setCadenceScheduleName(preset.label);
                    }}
                    className={cn(
                      "p-2.5 rounded-cv border text-left text-gm-xs font-mono transition-all cursor-pointer",
                      cadenceDays === preset.days
                        ? "border-[var(--gm-accent)] bg-[var(--gm-accent-muted)] text-[var(--gm-text)] font-bold shadow-xs"
                        : "border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                    )}
                  >
                    <div>{preset.label}</div>
                    <div className="text-[10px] text-[var(--gm-text-subtle)] mt-0.5">+{preset.days} days</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-cv border border-[var(--gm-border)] bg-[var(--gm-surface)] text-gm-xs space-y-1">
              <div className="font-semibold text-[var(--gm-text)]">Scheduled Check Date:</div>
              <div className="text-[var(--gm-accent-strong)] font-mono">
                {new Date(Date.now() + cadenceDays * 86400000).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <p className="text-[11px] text-[var(--gm-text-muted)] pt-1">
                Grimoire will display a notification badge on this work when this date arrives so you can recheck the source.
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2">
            {selectedPathForCadence && cadenceMap[selectedPathForCadence] ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-gm-xs"
                onClick={() => removeCadence(selectedPathForCadence)}
              >
                Remove Timer
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowCadenceModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if (selectedPathForCadence) {
                    saveCadence(selectedPathForCadence, cadenceDays, cadenceScheduleName);
                  }
                }}
              >
                Save Cadence Timer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal 2: Hiatus Awakening & Dropped Lifecycle ────────────────── */}
      <Dialog open={showHiatusModal} onOpenChange={setShowHiatusModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-amber-500" />
              <span>Hiatus Awakening &amp; Lifecycle Settings</span>
            </DialogTitle>
            <DialogDescription>
              Record why this work is paused or dropped, and schedule a Hiatus Awakening Timer to recheck whether chapters have resumed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-gm-xs font-semibold text-[var(--gm-text)] block mb-1.5">
                Hiatus / Dropped Reason:
              </label>
              <Input
                value={hiatusReason}
                onChange={(e) => setHiatusReason(e.target.value)}
                placeholder="e.g. Author on medical hiatus, Season 1 ended, etc."
                className="text-gm-xs"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  "Author on hiatus / seasonal break",
                  "Season 1 completed, awaiting Season 2",
                  "Translation caught up to raw chapters",
                  "Scanlation group disbanded",
                  "Dropped after chapter milestone",
                ].map((reasonPreset) => (
                  <button
                    key={reasonPreset}
                    type="button"
                    onClick={() => setHiatusReason(reasonPreset)}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:border-[var(--gm-accent)] transition-colors cursor-pointer"
                  >
                    {reasonPreset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gm-xs font-semibold text-[var(--gm-text)] block mb-1.5">
                Hiatus Awakening Recheck Timer:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { days: 14, label: "14 Days" },
                  { days: 30, label: "30 Days" },
                  { days: 60, label: "60 Days" },
                  { days: 90, label: "90 Days" },
                ].map((preset) => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setHiatusDays(preset.days)}
                    className={cn(
                      "p-2 rounded-cv border text-center text-gm-xs font-mono transition-all cursor-pointer",
                      hiatusDays === preset.days
                        ? "border-amber-500 bg-amber-500/15 text-[var(--gm-text)] font-bold shadow-xs"
                        : "border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)]"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gm-xs font-semibold text-[var(--gm-text)] block mb-1.5">
                Personal Notes (Optional):
              </label>
              <Input
                value={hiatusNotes}
                onChange={(e) => setHiatusNotes(e.target.value)}
                placeholder="e.g. Check publisher Twitter @author or discord announcement"
                className="text-gm-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-row items-center justify-between gap-2 pt-2">
            {hiatusMap[work.id] ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 text-gm-xs"
                onClick={() => clearHiatusTimer(work.id)}
              >
                Clear Timer
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowHiatusModal(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => saveHiatusTimer(work.id, hiatusDays, hiatusReason, hiatusNotes)}
              >
                Set Awakening Timer
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
