import * as React from "react";
import {
  ExternalLink,
  Film,
  Heart,
  ImageIcon,
  Instagram,
  Music,
  Network,
  Plus,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { Button, toast } from "@grimoire/ui";
import { useFanCreationsStore } from "@grimoire/state";

export interface WorkFanCreationsPanelProps {
  workId: string;
}

export function WorkFanCreationsPanel({ workId }: WorkFanCreationsPanelProps) {
  const {
    getFanfictionsForWork,
    getVideoEditsForWork,
    getFanArtForWork,
    addVideoEdit,
    addFanArt,
    promoteFanfictionToWork,
    removeFanfiction,
  } = useFanCreationsStore();

  // Video edit state
  const [showAddVideoEdit, setShowAddVideoEdit] = React.useState(false);
  const [newVideoEditUrl, setNewVideoEditUrl] = React.useState("");
  const [newVideoEditTitle, setNewVideoEditTitle] = React.useState("");
  const [newVideoEditPlatform, setNewVideoEditPlatform] = React.useState<
    "youtube" | "tiktok" | "instagram"
  >("youtube");

  // Fan art state
  const [showAddFanArt, setShowAddFanArt] = React.useState(false);
  const [newFanArtUrl, setNewFanArtUrl] = React.useState("");
  const [newFanArtTitle, setNewFanArtTitle] = React.useState("");
  const [newFanArtArtist, setNewFanArtArtist] = React.useState("");
  const fanArtFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const fanfictions = getFanfictionsForWork(workId);
  const videoEdits = getVideoEditsForWork(workId);
  const fanArts = getFanArtForWork(workId);

  return (
    <div className="space-y-6">
      {/* ── Fanfiction ─────────────────────────────────── */}
      <div className="rounded-none border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] shadow-[3px_3px_0px_var(--gm-border-strong)]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-[var(--gm-accent-strong)]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--gm-text-subtle)]">
              [ FANFICTION ]
            </span>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {fanfictions.length === 0 ? (
            <p className="text-gm-xs text-[var(--gm-text-subtle)] text-center py-4">
              No fanfiction linked yet. Fanfictions can be promoted to full works once they grow.
            </p>
          ) : (
            <div className="space-y-3">
              {fanfictions.map((fanfic) => (
                <div
                  key={fanfic.id}
                  className="rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-gm-sm font-semibold text-[var(--gm-text)] truncate">{fanfic.title}</p>
                    {fanfic.author && (
                      <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">by {fanfic.author}</p>
                    )}
                    {fanfic.sourceUrl && (
                      <a
                        href={fanfic.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-gm-xs text-[var(--gm-accent-strong)] hover:underline mt-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Read online
                      </a>
                    )}
                    {fanfic.summary && (
                      <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1.5 line-clamp-2">
                        {fanfic.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      title="Promote to full work"
                      className="inline-flex items-center gap-1 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2 py-1 text-[10px] font-mono shadow-[1px_1px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer text-[var(--gm-text-muted)] hover:text-[var(--gm-accent-strong)]"
                      onClick={async () => {
                        const promoted = await promoteFanfictionToWork(fanfic.id);
                        if (promoted) {
                          toast({
                            title: "Promoted!",
                            description: `"${fanfic.title}" is now a full work in your library.`,
                            variant: "success",
                          });
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
                      className="inline-flex items-center rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] p-1 text-[var(--gm-text-subtle)] hover:text-red-500 hover:border-red-400 transition-colors cursor-pointer"
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
      <div className="rounded-none border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] shadow-[3px_3px_0px_var(--gm-border-strong)]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="flex items-center gap-2">
            <Film className="h-4 w-4 text-[var(--gm-accent-strong)]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--gm-text-subtle)]">
              [ VIDEO EDITS ]
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[10px] font-mono shadow-[1px_1px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
            onClick={() => setShowAddVideoEdit(!showAddVideoEdit)}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {showAddVideoEdit && (
          <div className="p-4 border-b border-[var(--gm-border)] grid gap-2 bg-[var(--gm-surface)]/50">
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                className="font-mono text-[11px] border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2 py-1.5 rounded-none text-[var(--gm-text)] cursor-pointer focus:outline-none"
                value={newVideoEditPlatform}
                onChange={(e) =>
                  setNewVideoEditPlatform(e.target.value as "youtube" | "tiktok" | "instagram")
                }
              >
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
              </select>
              <input
                className="w-full rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-1.5 text-gm-xs text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)] sm:col-span-2"
                placeholder="Video URL"
                value={newVideoEditUrl}
                onChange={(e) => setNewVideoEditUrl(e.target.value)}
              />
            </div>
            <input
              className="w-full rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-1.5 text-gm-xs text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
              placeholder="Title / description (optional)"
              value={newVideoEditTitle}
              onChange={(e) => setNewVideoEditTitle(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => setShowAddVideoEdit(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (!newVideoEditUrl.trim()) {
                    toast({ title: "URL required", variant: "destructive" });
                    return;
                  }
                  addVideoEdit({
                    workId,
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
          {videoEdits.length === 0 ? (
            <p className="text-gm-xs text-[var(--gm-text-subtle)] text-center py-4">
              No video edits yet. Add YouTube, TikTok, or Instagram links.
            </p>
          ) : (
            videoEdits.map((vid) => (
              <div
                key={vid.id}
                className="flex items-center gap-3 rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-2"
              >
                {vid.platform === "youtube" && (
                  <Youtube className="h-4 w-4 text-red-500 shrink-0" />
                )}
                {vid.platform === "instagram" && (
                  <Instagram className="h-4 w-4 text-pink-500 shrink-0" />
                )}
                {vid.platform === "tiktok" && (
                  <Music className="h-4 w-4 text-[var(--gm-text-muted)] shrink-0" />
                )}
                <div className="min-w-0 flex-1">
                  {vid.title && (
                    <p className="text-gm-xs font-semibold text-[var(--gm-text)] truncate">
                      {vid.title}
                    </p>
                  )}
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-[var(--gm-accent-strong)] hover:underline font-mono truncate block"
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
      <div className="rounded-none border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] shadow-[3px_3px_0px_var(--gm-border-strong)]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--gm-border)] bg-[var(--gm-surface)]">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-[var(--gm-accent-strong)]" />
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--gm-text-subtle)]">
              [ FAN ART GALLERY ]
            </span>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[10px] font-mono shadow-[1px_1px_0px_var(--gm-border-strong)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
            onClick={() => setShowAddFanArt(!showAddFanArt)}
          >
            <Plus className="h-3 w-3" />
            Add
          </button>
        </div>

        {showAddFanArt && (
          <div className="p-4 border-b border-[var(--gm-border)] grid gap-2 bg-[var(--gm-surface)]/50">
            <div className="grid gap-2 sm:grid-cols-2">
              <input
                className="w-full rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-1.5 text-gm-xs text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
                placeholder="Image URL (or upload below)"
                value={newFanArtUrl}
                onChange={(e) => setNewFanArtUrl(e.target.value)}
              />
              <input
                className="w-full rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-1.5 text-gm-xs text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
                placeholder="Artist name (optional)"
                value={newFanArtArtist}
                onChange={(e) => setNewFanArtArtist(e.target.value)}
              />
            </div>
            <input
              className="w-full rounded-none border border-[var(--gm-border)] bg-[var(--gm-surface)] px-3 py-1.5 text-gm-xs text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none focus:ring-1 focus:ring-[var(--gm-accent-muted)]"
              placeholder="Title / caption (optional)"
              value={newFanArtTitle}
              onChange={(e) => setNewFanArtTitle(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-none border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] px-2.5 py-1 text-[11px] font-mono shadow-[1px_1px_0px_var(--gm-border-strong)] cursor-pointer text-[var(--gm-text-muted)]"
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddFanArt(false);
                    setNewFanArtUrl("");
                    setNewFanArtTitle("");
                    setNewFanArtArtist("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    if (!newFanArtUrl.trim()) {
                      toast({ title: "Image URL or file required", variant: "destructive" });
                      return;
                    }
                    addFanArt({
                      workId,
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
          {fanArts.length === 0 ? (
            <p className="text-gm-xs text-[var(--gm-text-subtle)] text-center py-4">
              No fan art yet. Add image URLs or upload from your device.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fanArts.map((art) => (
                <div
                  key={art.id}
                  className="group relative rounded-none border border-[var(--gm-border)] overflow-hidden aspect-square bg-[var(--gm-surface)]"
                >
                  <img
                    src={art.imageUrl}
                    alt={art.title ?? "Fan art"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                  {(art.title || art.artistName) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1">
                      {art.title && (
                        <p className="text-[10px] text-white font-semibold truncate">{art.title}</p>
                      )}
                      {art.artistName && (
                        <p className="text-[9px] text-white/70 truncate">by {art.artistName}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
