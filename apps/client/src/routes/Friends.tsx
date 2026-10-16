import * as React from "react";
import {
  Users,
  UserCheck,
  UserPlus,
  Share2,
  Sparkles,
  BookOpen,
  Headphones,
  Star,
  Plus,
  Copy,
  Check,
  ThumbsUp,
  MessageSquare,
  Bookmark,
  ExternalLink,
  Flame,
  Clock,
  Layers,
} from "lucide-react";
import {
  Badge,
  Button,
  Input,
  PageContainer,
  toast,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@chronicles-vault/ui";
import {
  useFriendsStore,
  useLibraryStore,
  useListsStore,
  type FriendProfile,
  type FriendActivityItem,
  type SharedShelf,
} from "@chronicles-vault/state";

export interface FriendsProps {
  onNavigateWork?: (id: string) => void;
}

export function Friends({ onNavigateWork }: FriendsProps) {
  const {
    friends,
    activityFeed,
    sharedShelves,
    toggleFollow,
    addWorkToSharedShelf,
    upvoteShelfWork,
    createSharedShelf,
  } = useFriendsStore();

  const libraryItems = useLibraryStore((s) => s.items);
  const addWorkToList = useListsStore((s) => s.addWorkToList);
  const createList = useListsStore((s) => s.createList);

  const [activeTab, setActiveTab] = React.useState<"shelves" | "friends" | "feed">("shelves");
  const [activityFilter, setActivityFilter] = React.useState<string>("all");
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  // Modal: Add work to shared shelf
  const [targetShelfId, setTargetShelfId] = React.useState<string | null>(null);
  const [selectedWorkId, setSelectedWorkId] = React.useState<string>("");
  const [shelfWorkNote, setShelfWorkNote] = React.useState<string>("");

  // Modal: Create new shared shelf
  const [showCreateShelfModal, setShowCreateShelfModal] = React.useState(false);
  const [newShelfTitle, setNewShelfTitle] = React.useState("");
  const [newShelfDesc, setNewShelfDesc] = React.useState("");
  const [newShelfEmoji, setNewShelfEmoji] = React.useState("📚");
  const [newShelfIsPublic, setNewShelfIsPublic] = React.useState(true);

  const followingCount = friends.filter((f) => f.isFollowing).length;

  const handleCopyShareCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    toast({
      title: "Share Code Copied",
      description: `Code ${code} copied to clipboard. Share it with fellow readers!`,
      variant: "success",
    });
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleCloneShelfToPersonalList = (shelf: SharedShelf) => {
    const newList = createList({
      title: `[Shared] ${shelf.title}`,
      description: `Imported from shared shelf curated by ${shelf.createdByHandle}. ${shelf.description}`,
    });
    const listId = newList.id;

    let importedCount = 0;
    shelf.works.forEach((w) => {
      // Find matching work or link if present
      const match = libraryItems.find(
        (item) => item.work.id === w.workId || item.work.title.toLowerCase() === w.title.toLowerCase(),
      );
      if (match) {
        addWorkToList(listId, match.work.id);
        importedCount++;
      }
    });

    toast({
      title: "Shared Shelf Cloned",
      description: `Cloned "${shelf.title}" into your Personal Lists (${importedCount} works matched with your Library).`,
      variant: "success",
    });
  };

  const handleConfirmAddToShelf = () => {
    if (!targetShelfId || !selectedWorkId) {
      toast({ title: "Please select a work", variant: "warning" });
      return;
    }
    const chosen = libraryItems.find((i) => i.work.id === selectedWorkId);
    if (!chosen) return;

    addWorkToSharedShelf(targetShelfId, {
      id: chosen.work.id,
      title: chosen.work.title,
      contentType: chosen.work.contentType,
      coverRef: chosen.work.coverRef ?? undefined,
      note: shelfWorkNote.trim() || undefined,
    });

    toast({
      title: "Added to Shared Shelf",
      description: `"${chosen.work.title}" is now shared on the shelf!`,
      variant: "success",
    });

    setTargetShelfId(null);
    setSelectedWorkId("");
    setShelfWorkNote("");
  };

  const handleConfirmCreateShelf = () => {
    if (!newShelfTitle.trim()) {
      toast({ title: "Shelf title required", variant: "warning" });
      return;
    }
    const created = createSharedShelf(
      newShelfTitle.trim(),
      newShelfDesc.trim() || "Collaborative shelf curated by @DemoUser1",
      newShelfEmoji.trim() || "📖",
      newShelfIsPublic,
    );
    toast({
      title: "Shared Shelf Created",
      description: `Shelf "${created.title}" initialized with share code ${created.publicShareCode}.`,
      variant: "success",
    });
    setShowCreateShelfModal(false);
    setNewShelfTitle("");
    setNewShelfDesc("");
  };

  const filteredActivity = React.useMemo(() => {
    if (activityFilter === "all") return activityFeed;
    if (activityFilter === "audiobook")
      return activityFeed.filter((a) => a.actionType === "audiobook_listen");
    if (activityFilter === "progress")
      return activityFeed.filter((a) => a.actionType === "progress");
    if (activityFilter === "quotes")
      return activityFeed.filter((a) => a.actionType === "quote");
    if (activityFilter === "shelf")
      return activityFeed.filter((a) => a.actionType === "shelf_add");
    return activityFeed;
  }, [activityFeed, activityFilter]);

  return (
    <PageContainer maxWidth="wide">
      {/* Header Banner */}
      <div className="mb-8 border border-[var(--cv-border-strong)] bg-gradient-to-r from-[var(--cv-bg-elevated)] via-[var(--cv-surface)] to-[var(--cv-bg-elevated)] p-6 rounded-cv-lg shadow-[3px_3px_0px_var(--cv-border-strong)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="inline-flex items-center gap-1.5 border border-[var(--cv-accent-strong)] bg-[var(--cv-accent)]/15 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[var(--cv-accent-strong)] uppercase tracking-wider">
                <Users className="h-3.5 w-3.5" />
                COMMUNITY NETWORK &amp; COLLABORATION
              </span>
              <span className="font-mono text-[11px] text-[var(--cv-text-muted)] border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2 py-0.5">
                ACTIVE ACCOUNT: @DemoUser1
              </span>
            </div>
            <h1 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
              Following Friends &amp; Shared Shelves
            </h1>
            <p className="mt-1 text-cv-sm text-[var(--cv-text-muted)] max-w-2xl leading-relaxed">
              Follow reading companions, track friends' real-time chapter &amp; audiobook milestones, curate collaborative shared shelves with friends, and discover public community reading lists.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowCreateShelfModal(true)}
              className="gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Create Shared Shelf</span>
            </Button>
          </div>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-[var(--cv-border)]">
          <button
            type="button"
            onClick={() => setActiveTab("shelves")}
            className={`px-3.5 py-1.5 text-cv-xs font-semibold rounded-cv border transition-all cursor-pointer ${
              activeTab === "shelves"
                ? "border-[var(--cv-accent-strong)] bg-[var(--cv-accent-strong)] text-[var(--cv-accent-contrast)] shadow-[2px_2px_0px_var(--cv-border-strong)]"
                : "border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
            }`}
          >
            Shared Shelves &amp; Public Lists ({sharedShelves.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("friends")}
            className={`px-3.5 py-1.5 text-cv-xs font-semibold rounded-cv border transition-all cursor-pointer ${
              activeTab === "friends"
                ? "border-[var(--cv-accent-strong)] bg-[var(--cv-accent-strong)] text-[var(--cv-accent-contrast)] shadow-[2px_2px_0px_var(--cv-border-strong)]"
                : "border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
            }`}
          >
            Friends &amp; Following ({followingCount} / {friends.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("feed")}
            className={`px-3.5 py-1.5 text-cv-xs font-semibold rounded-cv border transition-all cursor-pointer ${
              activeTab === "feed"
                ? "border-[var(--cv-accent-strong)] bg-[var(--cv-accent-strong)] text-[var(--cv-accent-contrast)] shadow-[2px_2px_0px_var(--cv-border-strong)]"
                : "border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
            }`}
          >
            Live Friend Activity Feed ({activityFeed.length})
          </button>
        </div>
      </div>

      {/* TAB 1: SHARED SHELVES & PUBLIC LISTS */}
      {activeTab === "shelves" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                Collaborative Shelves &amp; Curated Public Lists
              </h2>
              <p className="text-cv-xs text-[var(--cv-text-muted)]">
                Shelves where you and your friends add personal recommendations, leave notes, and upvote favorite reads.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {sharedShelves.map((shelf) => (
              <div
                key={shelf.id}
                className="border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] rounded-cv-lg p-5 shadow-[2px_2px_0px_var(--cv-border-strong)] space-y-4"
              >
                {/* Shelf Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--cv-border)]">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-2 rounded-cv bg-[var(--cv-surface)] border border-[var(--cv-border)] select-none">
                      {shelf.iconEmoji}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-cv-base font-bold text-[var(--cv-text)]">
                          {shelf.title}
                        </h3>
                        {shelf.isPublicList && (
                          <Badge variant="default" className="text-[10px] font-mono">
                            PUBLIC LIST
                          </Badge>
                        )}
                        <span className="text-cv-xs text-[var(--cv-text-muted)]">
                          Curated by <strong className="text-[var(--cv-accent-strong)]">{shelf.createdByHandle}</strong>
                        </span>
                      </div>
                      <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                        {shelf.description}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] font-mono text-[var(--cv-text-subtle)]">
                        <span>Members:</span>
                        {shelf.memberHandles.map((h) => (
                          <span
                            key={h}
                            className="bg-[var(--cv-surface)] px-1.5 py-0.2 border border-[var(--cv-border)] rounded-cv-sm"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleCopyShareCode(shelf.publicShareCode)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-cv-xs font-mono border border-[var(--cv-border)] bg-[var(--cv-surface)] hover:border-[var(--cv-accent-strong)] transition-colors cursor-pointer"
                      title="Copy Public Share Code"
                    >
                      {copiedCode === shelf.publicShareCode ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-green-500" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[var(--cv-text-muted)]" />
                          <span>{shelf.publicShareCode}</span>
                        </>
                      )}
                    </button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCloneShelfToPersonalList(shelf)}
                      className="gap-1.5 text-cv-xs"
                      title="Clone this entire shelf into your personal Lists"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      <span>Clone to My Lists</span>
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setTargetShelfId(shelf.id)}
                      className="gap-1.5 text-cv-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Work</span>
                    </Button>
                  </div>
                </div>

                {/* Shelf Works Grid */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                  {shelf.works.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 p-3 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] hover:border-[var(--cv-accent-strong)] transition-all"
                    >
                      {item.coverRef ? (
                        <img
                          src={item.coverRef}
                          alt={item.title}
                          className="w-14 h-20 object-cover rounded-cv-sm border border-[var(--cv-border)] shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-20 bg-[var(--cv-bg-elevated)] border border-[var(--cv-border)] flex items-center justify-center text-cv-xs font-mono text-[var(--cv-text-subtle)] shrink-0">
                          {item.contentType.slice(0, 3).toUpperCase()}
                        </div>
                      )}

                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono text-[10px] uppercase text-[var(--cv-text-subtle)]">
                              {item.contentType.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-[var(--cv-text-muted)]">
                              by {item.addedByHandle}
                            </span>
                          </div>
                          <h4
                            onClick={() => onNavigateWork?.(item.workId)}
                            className="font-bold text-cv-xs text-[var(--cv-text)] line-clamp-1 hover:text-[var(--cv-accent-strong)] cursor-pointer mt-0.5"
                          >
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[var(--cv-text-muted)] line-clamp-2 mt-1 italic">
                            "{item.recommenderNote}"
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-[var(--cv-border)]/50">
                          <button
                            type="button"
                            onClick={() => upvoteShelfWork(shelf.id, item.id)}
                            className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[var(--cv-accent-strong)] hover:scale-105 transition-transform cursor-pointer"
                            title="Upvote recommendation"
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>▲ {item.upvotesCount}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onNavigateWork?.(item.workId)}
                            className="text-[10px] font-mono text-[var(--cv-text-muted)] hover:text-[var(--cv-text)] inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            View <ExternalLink className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: FRIENDS & FOLLOWING */}
      {activeTab === "friends" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                Reading Companions &amp; Community Circles
              </h2>
              <p className="text-cv-xs text-[var(--cv-text-muted)]">
                Readers in your circle. Follow friends to receive live updates whenever they advance chapters, log audiobook timecodes, or capture quotes.
              </p>
            </div>
            <Badge variant="muted" className="font-mono text-cv-xs">
              Following: {followingCount} of {friends.length}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] rounded-cv-lg p-5 shadow-[2px_2px_0px_var(--cv-border-strong)] flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={friend.avatarUrl}
                        alt={friend.displayName}
                        className="w-12 h-12 rounded-cv-full object-cover border-2 border-[var(--cv-border-strong)]"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-cv-sm text-[var(--cv-text)]">
                            {friend.displayName}
                          </h3>
                          <span className="font-mono text-[11px] text-[var(--cv-text-subtle)]">
                            {friend.handle}
                          </span>
                        </div>
                        <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                          {friend.bio}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant={friend.isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => {
                        toggleFollow(friend.id);
                        toast({
                          title: friend.isFollowing ? `Unfollowed ${friend.displayName}` : `Following ${friend.displayName}`,
                          description: friend.isFollowing
                            ? `You will no longer receive live feed alerts from ${friend.handle}.`
                            : `Live reading milestones from ${friend.handle} are now synced to your activity feed.`,
                        });
                      }}
                      className="gap-1.5 shrink-0 text-cv-xs"
                    >
                      {friend.isFollowing ? (
                        <>
                          <UserCheck className="h-3.5 w-3.5 text-green-500" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Currently Consuming Banner */}
                  <div className="mt-4 p-3 rounded-cv bg-[var(--cv-surface)] border border-[var(--cv-border)] flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase text-[var(--cv-accent-strong)] font-bold">
                        {friend.currentlyConsuming.medium.toLowerCase().includes("audio") ? (
                          <Headphones className="h-3 w-3" />
                        ) : (
                          <BookOpen className="h-3 w-3" />
                        )}
                        Currently Reading / Listening
                      </div>
                      <p className="font-bold text-cv-xs text-[var(--cv-text)] truncate mt-0.5">
                        {friend.currentlyConsuming.title}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--cv-text-muted)] truncate">
                        {friend.currentlyConsuming.progress}
                      </p>
                    </div>

                    {friend.currentlyConsuming.coverRef && (
                      <img
                        src={friend.currentlyConsuming.coverRef}
                        alt="cover"
                        className="w-9 h-12 object-cover rounded-cv-sm border border-[var(--cv-border)] shrink-0"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--cv-border)] text-[11px] font-mono text-[var(--cv-text-subtle)]">
                  <span>Works Logged: {friend.totalWorksLogged}</span>
                  <span>Mutual Shelves: {friend.mutualShelvesCount}</span>
                  <span>Joined: {friend.joinedYear}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LIVE FRIEND ACTIVITY FEED */}
      {activeTab === "feed" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-cv-lg font-bold text-[var(--cv-text)]">
                Live Companion Reading Feed
              </h2>
              <p className="text-cv-xs text-[var(--cv-text-muted)]">
                Real-time activity and reading milestones from friends you follow.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: "all", label: "All Activity" },
                { id: "progress", label: "Reading Progress" },
                { id: "audiobook", label: "Audiobooks" },
                { id: "quotes", label: "Quotes & Notes" },
                { id: "shelf", label: "Shelf Additions" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setActivityFilter(f.id)}
                  className={`px-2.5 py-1 text-cv-xs font-mono rounded-cv border transition-colors cursor-pointer ${
                    activityFilter === f.id
                      ? "border-[var(--cv-accent-strong)] bg-[var(--cv-accent-strong)] text-[var(--cv-accent-contrast)] font-bold"
                      : "border-[var(--cv-border)] bg-[var(--cv-surface)] text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 max-w-3xl">
            {filteredActivity.map((item) => (
              <div
                key={item.id}
                className="border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] rounded-cv-lg p-4 shadow-sm flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <img
                    src={item.friendAvatar}
                    alt={item.friendDisplayName}
                    className="w-10 h-10 rounded-cv-full object-cover border border-[var(--cv-border)] shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <strong className="text-cv-xs font-bold text-[var(--cv-text)]">
                        {item.friendDisplayName}
                      </strong>
                      <span className="font-mono text-[11px] text-[var(--cv-text-subtle)]">
                        {item.friendHandle}
                      </span>
                      <span className="text-[10px] text-[var(--cv-text-subtle)]">
                        • {item.timestamp}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <Badge variant="muted" className="text-[10px] font-mono">
                        {item.actionType === "audiobook_listen" && "🎧 AUDIOBOOK"}
                        {item.actionType === "progress" && "📖 PROGRESS"}
                        {item.actionType === "quote" && "💬 QUOTE"}
                        {item.actionType === "shelf_add" && "📚 SHELF RECOMMENDATION"}
                        {item.actionType === "review" && "★ REVIEW"}
                      </Badge>
                      <span className="font-bold text-cv-xs text-[var(--cv-text)]">
                        {item.workTitle}
                      </span>
                    </div>

                    <p className="text-cv-xs text-[var(--cv-text-muted)] mt-1.5 leading-relaxed">
                      {item.detail}
                    </p>

                    {item.rating && (
                      <div className="flex items-center gap-1 mt-2 text-yellow-500 text-cv-xs">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-current" />
                        ))}
                        <span className="font-mono text-[11px] text-[var(--cv-text-muted)] ml-1">
                          {item.rating}/5 Stars
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {item.coverRef && (
                  <img
                    src={item.coverRef}
                    alt="work"
                    className="w-12 h-16 object-cover rounded-cv-sm border border-[var(--cv-border)] shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DIALOG: ADD WORK TO SHARED SHELF */}
      <Dialog open={Boolean(targetShelfId)} onOpenChange={(open) => !open && setTargetShelfId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Work to Shared Shelf</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-cv-xs font-semibold text-[var(--cv-text)] block mb-1">
                Select Work from Your Library
              </label>
              <select
                value={selectedWorkId}
                onChange={(e) => setSelectedWorkId(e.target.value)}
                className="w-full h-9 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 text-cv-xs text-[var(--cv-text)]"
              >
                <option value="">Choose a title…</option>
                {libraryItems.map((item) => (
                  <option key={item.work.id} value={item.work.id}>
                    {item.work.title} ({item.work.contentType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-cv-xs font-semibold text-[var(--cv-text)] block mb-1">
                Recommender Note for Friends
              </label>
              <textarea
                rows={3}
                value={shelfWorkNote}
                onChange={(e) => setShelfWorkNote(e.target.value)}
                placeholder="Why should your friends read/watch this? Mention favorite arcs, narrators, or chapters…"
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-2.5 text-cv-xs text-[var(--cv-text)] resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setTargetShelfId(null)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleConfirmAddToShelf}>
              Share to Shelf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: CREATE NEW SHARED SHELF */}
      <Dialog open={showCreateShelfModal} onOpenChange={setShowCreateShelfModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Collaborative Shelf</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-cv-xs font-semibold text-[var(--cv-text)] block mb-1">
                Shelf Title
              </label>
              <Input
                value={newShelfTitle}
                onChange={(e) => setNewShelfTitle(e.target.value)}
                placeholder="e.g. S-Tier Dark Fantasy Circle"
              />
            </div>

            <div>
              <label className="text-cv-xs font-semibold text-[var(--cv-text)] block mb-1">
                Icon Emoji
              </label>
              <Input
                value={newShelfEmoji}
                onChange={(e) => setNewShelfEmoji(e.target.value)}
                placeholder="⚔️, 🎧, 📚, 🩸"
              />
            </div>

            <div>
              <label className="text-cv-xs font-semibold text-[var(--cv-text)] block mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={newShelfDesc}
                onChange={(e) => setNewShelfDesc(e.target.value)}
                placeholder="What belongs on this shelf?"
                className="w-full rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-2 text-cv-xs text-[var(--cv-text)] resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPublic"
                checked={newShelfIsPublic}
                onChange={(e) => setNewShelfIsPublic(e.target.checked)}
                className="rounded border-[var(--cv-border)]"
              />
              <label htmlFor="isPublic" className="text-cv-xs text-[var(--cv-text)]">
                Make Public (Generates shareable share-code for cloning)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateShelfModal(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleConfirmCreateShelf}>
              Create Shelf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
