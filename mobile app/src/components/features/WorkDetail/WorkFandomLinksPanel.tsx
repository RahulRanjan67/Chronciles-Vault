import * as React from "react";
import {
  Globe,
  Plus,
  ExternalLink,
  Trash2,
  Check,
  Users,
} from "lucide-react";
import { Badge, Button, Input, toast } from "@chronicles-vault/ui";
import type { WorkId } from "@chronicles-vault/shared";
import {
  useFandomLinksStore,
  type FandomLinkProvider,
} from "@chronicles-vault/state";

export interface WorkFandomLinksPanelProps {
  workId: WorkId;
  workTitle: string;
}

export function WorkFandomLinksPanel({ workId, workTitle }: WorkFandomLinksPanelProps) {
  const { links, addFandomLink, removeFandomLink, setPreferredFandomLink } =
    useFandomLinksStore();

  const workLinks = React.useMemo(
    () =>
      links
        .filter((l) => l.workId === workId)
        .sort((a, b) => (a.isPreferred === b.isPreferred ? 0 : a.isPreferred ? -1 : 1)),
    [links, workId],
  );

  const [showAdd, setShowAdd] = React.useState(false);
  const [communityName, setCommunityName] = React.useState("");
  const [url, setUrl] = React.useState("");
  const [provider, setProvider] = React.useState<FandomLinkProvider>("fandom");
  const [language, setLanguage] = React.useState("en");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast({ title: "Enter a community or wiki URL", variant: "warning" });
      return;
    }
    try {
      addFandomLink({
        workId,
        communityName: communityName.trim() || `${workTitle} Wiki`,
        url: url.trim(),
        provider,
        canonicalTitle: workTitle,
        language: language.trim() || "en",
      });
      setCommunityName("");
      setUrl("");
      setShowAdd(false);
      toast({
        title: "Fandom community linked",
        description: "Stored separately from reading Access Paths.",
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Invalid community URL",
        description: err instanceof Error ? err.message : "URL must be HTTP(S).",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-cv-sm font-semibold text-[var(--cv-text)] flex items-center gap-2">
            <Users className="h-4 w-4 text-[var(--cv-accent-strong)]" />
            <span>Fandom & Community Links ({workLinks.length})</span>
          </h3>
          <p className="text-cv-xs text-[var(--cv-text-muted)]">
            First-class wiki and community links (`fandom_links`), kept separate from reading Access Paths so lore wikis never pollute reading sources or leak into publications.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAdd(!showAdd)}
          className="gap-1.5 text-cv-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Fandom / Wiki</span>
        </Button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="rounded-cv-xl border border-[var(--cv-accent-muted)] bg-[var(--cv-bg-elevated)] p-4 space-y-3"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
              placeholder={`Community Name (e.g. ${workTitle} Wiki)`}
            />
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as FandomLinkProvider)}
              className="h-9 rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] px-2.5 text-cv-xs text-[var(--cv-text)]"
            >
              <option value="fandom">Fandom Wiki</option>
              <option value="wiki">Independent Wiki</option>
              <option value="subreddit">Subreddit</option>
              <option value="forum">Discussion Forum</option>
              <option value="custom">Custom Community</option>
            </select>
            <Input
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              placeholder="Language (e.g. en, ja, ko)"
            />
          </div>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowAdd(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" size="sm">
              Save Community Link
            </Button>
          </div>
        </form>
      )}

      {workLinks.length === 0 ? (
        <div className="rounded-cv-lg border border-dashed border-[var(--cv-border)] bg-[var(--cv-surface)]/40 p-6 text-center text-cv-xs text-[var(--cv-text-muted)]">
          No fandom wikis or community hubs linked to this work yet.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workLinks.map((link) => (
            <div
              key={link.id}
              className="flex items-start justify-between gap-3 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge variant="muted" className="text-[10px] px-1.5 py-0 uppercase font-mono">
                    {link.provider}
                  </Badge>
                  <span className="rounded-cv-sm bg-[var(--cv-surface)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--cv-text-muted)] border border-[var(--cv-border)]">
                    {link.language}
                  </span>
                  {link.isPreferred && (
                    <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                      Preferred Wiki
                    </Badge>
                  )}
                </div>
                <h4 className="text-cv-sm font-semibold text-[var(--cv-text)] truncate">
                  {link.communityName}
                </h4>
                <p className="text-cv-xs text-[var(--cv-text-subtle)] truncate mt-0.5">
                  {link.url}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!link.isPreferred && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPreferredFandomLink(workId, link.id);
                      toast({ title: "Preferred community link updated" });
                    }}
                    className="h-7 px-2 text-[11px] text-[var(--cv-text-muted)]"
                    title="Set as preferred community link"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Preferred
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                  onClick={() => window.open(link.url, "_blank", "noopener,noreferrer")}
                  title="Open community externally"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-[var(--cv-text-muted)] hover:text-red-400"
                  onClick={() => {
                    removeFandomLink(link.id);
                    toast({ title: "Community link removed" });
                  }}
                  title="Remove community link"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
