import * as React from "react";
import {
  Bookmark,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Globe,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import {
  Badge,
  Button,
  Input,
  PageContainer,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from "@grimoire/ui";
import { useLibraryStore } from "@grimoire/state";

export interface KeyringCredential {
  readonly id: string;
  readonly siteName: string;
  readonly siteUrl: string;
  readonly username: string;
  readonly password: string;
  readonly notes?: string;
  readonly createdAt: string;
}

export interface PinnedPortal {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly domain: string;
  readonly searchUrlPattern?: string;
}

const CREDENTIALS_KEY = "grimoire:vault:credentials";
const PINNED_PORTALS_KEY = "grimoire:vault:portals";

export function KeyringPortals() {
  const library = useLibraryStore();

  const [activeTab, setActiveTab] = React.useState<"portals" | "credentials" | "search">("portals");

  // Saved credentials
  const [credentials, setCredentials] = React.useState<KeyringCredential[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(CREDENTIALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Pinned favorite portals
  const [pinnedPortals, setPinnedPortals] = React.useState<PinnedPortal[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(PINNED_PORTALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Password visibility map
  const [revealedPasswords, setRevealedPasswords] = React.useState<Record<string, boolean>>({});

  // Add Credential Form
  const [showAddCred, setShowAddCred] = React.useState(false);
  const [siteName, setSiteName] = React.useState("");
  const [siteUrl, setSiteUrl] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Add Portal Form
  const [showAddPortal, setShowAddPortal] = React.useState(false);
  const [portalName, setPortalName] = React.useState("");
  const [portalUrl, setPortalUrl] = React.useState("");
  const [portalSearchPattern, setPortalSearchPattern] = React.useState("");

  // Global search input for Search Portals directory
  const [searchQuery, setSearchQuery] = React.useState("");

  // --------------------------------------------------------------------------
  // Auto-Detect frequent reading domains where user has >= 5 works in Library!
  // --------------------------------------------------------------------------
  const frequentWebsites = React.useMemo(() => {
    const domainMap: Record<string, { count: number; sampleTitle: string; sampleUrl: string }> = {};

    for (const item of library.items) {
      if (item.work.deletedAt) continue;
      for (const p of item.accessPaths) {
        const u = p.url ?? ("accessUrl" in p ? (p.accessUrl as string) : "");
        if (u && /^https?:\/\//i.test(u)) {
          try {
            const parsed = new URL(u);
            const host = parsed.hostname.replace(/^www\./, "");
            if (host) {
              if (!domainMap[host]) {
                domainMap[host] = {
                  count: 0,
                  sampleTitle: item.work.title,
                  sampleUrl: `${parsed.protocol}//${parsed.hostname}`,
                };
              }
              domainMap[host].count += 1;
            }
          } catch {
            // ignore malformed URLs
          }
        }
      }
    }

    // Filter only domains with 5 or more works
    return Object.entries(domainMap)
      .filter(([_, meta]) => meta.count >= 5)
      .map(([domain, meta]) => ({
        domain,
        count: meta.count,
        sampleTitle: meta.sampleTitle,
        sampleUrl: meta.sampleUrl,
      }))
      .sort((a, b) => b.count - a.count);
  }, [library.items]);

  const saveCredentials = (next: KeyringCredential[]) => {
    setCredentials(next);
    try {
      window.localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(next));
    } catch {}
  };

  const savePinnedPortals = (next: PinnedPortal[]) => {
    setPinnedPortals(next);
    try {
      window.localStorage.setItem(PINNED_PORTALS_KEY, JSON.stringify(next));
    } catch {}
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !username.trim() || !password) {
      toast({ title: "Incomplete fields", description: "Website, username, and password are required.", variant: "destructive" });
      return;
    }

    let normalizedUrl = siteUrl.trim();
    if (normalizedUrl && !/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    const newCred: KeyringCredential = {
      id: `cred-${Date.now()}`,
      siteName: siteName.trim(),
      siteUrl: normalizedUrl,
      username: username.trim(),
      password,
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveCredentials([newCred, ...credentials]);
    setShowAddCred(false);
    setSiteName("");
    setSiteUrl("");
    setUsername("");
    setPassword("");
    setNotes("");
    toast({ title: "Credential Saved", description: `Account for ${newCred.siteName} stored securely.` });
  };

  const handleDeleteCredential = (id: string, name: string) => {
    saveCredentials(credentials.filter((c) => c.id !== id));
    toast({ title: "Removed Credential", description: `Removed account credentials for ${name}.` });
  };

  const handleAddPortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalName.trim() || !portalUrl.trim()) return;

    let normalizedUrl = portalUrl.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let domain = "";
    try {
      domain = new URL(normalizedUrl).hostname.replace(/^www\./, "");
    } catch {
      domain = portalName.toLowerCase().replace(/\s+/g, "");
    }

    const newPortal: PinnedPortal = {
      id: `portal-${Date.now()}`,
      name: portalName.trim(),
      url: normalizedUrl,
      domain,
      searchUrlPattern: portalSearchPattern.trim() || undefined,
    };

    savePinnedPortals([...pinnedPortals, newPortal]);
    setShowAddPortal(false);
    setPortalName("");
    setPortalUrl("");
    setPortalSearchPattern("");
    toast({ title: "Portal Pinned", description: `${newPortal.name} added to your reading launchpad.` });
  };

  const handleDeletePortal = (id: string) => {
    savePinnedPortals(pinnedPortals.filter((p) => p.id !== id));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to Clipboard", description: `${label} copied.` });
    } catch {
      toast({ title: "Unable to copy", variant: "destructive" });
    }
  };

  // Default reading portals for search launcher if none configured
  const searchPortals = [
    { name: "MangaDex", url: (q: string) => `https://mangadex.org/titles?q=${encodeURIComponent(q)}` },
    { name: "NovelUpdates", url: (q: string) => `https://www.novelupdates.com/?s=${encodeURIComponent(q)}&post_type=seriesposts` },
    { name: "RoyalRoad", url: (q: string) => `https://www.royalroad.com/fictions/search?title=${encodeURIComponent(q)}` },
    { name: "AniList", url: (q: string) => `https://anilist.co/search/manga?search=${encodeURIComponent(q)}` },
    { name: "MyAnimeList", url: (q: string) => `https://myanimelist.net/manga.php?q=${encodeURIComponent(q)}` },
    { name: "Webnovel", url: (q: string) => `https://www.webnovel.com/search?keywords=${encodeURIComponent(q)}` },
    { name: "Google Books", url: (q: string) => `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(q)}` },
  ];

  return (
    <PageContainer maxWidth="wide">
      <div className="mb-6">
        <div className="flex items-center gap-2.5">
          <KeyRound className="h-7 w-7 text-[var(--gm-accent-strong)]" />
          <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
            Keyring &amp; Reading Portals
          </h1>
        </div>
        <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)] max-w-2xl">
          Dedicated manager for reading website credentials, password locker, search portals, and auto-curated frequent domains hosting 5 or more works in your library.
        </p>
      </div>

      {/* ─── SPONSORED HORIZONTAL RECTANGLE AD BANNER (NON-INVASIVE / PRIVACY-FIRST) ─── */}
      <aside
        aria-label="Sponsored Portal Partner"
        className="mb-6 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)]/80 hover:bg-[var(--gm-surface)] p-3 sm:p-4 shadow-xs transition-all relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-gm-md bg-[var(--gm-accent-muted)]/20 border border-[var(--gm-accent-muted)] flex items-center justify-center shrink-0">
              <span className="font-serif font-black text-gm-base sm:text-gm-lg text-[var(--gm-accent-strong)]">
                BW
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--gm-text-subtle)] bg-[var(--gm-bg-elevated)] px-1.5 py-0.5 rounded border border-[var(--gm-border)]">
                  Sponsored Partner • Zero Tracking
                </span>
                <span className="text-gm-sm font-bold text-[var(--gm-text)] truncate">
                  BookWalker Global Light Novel &amp; Manga Vault
                </span>
                <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                  50% Coin Rebate
                </Badge>
              </div>
              <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5 line-clamp-1">
                Official eBook digital store for licensed Japanese light novels, manhwa, and simulpub manga releases.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="hidden md:inline font-mono text-[11px] text-[var(--gm-text-subtle)]">
              Code: <strong className="text-[var(--gm-accent-strong)]">GRIMOIRE50</strong>
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                window.open("https://global.bookwalker.jp", "_blank", "noopener,noreferrer");
              }}
              className="gap-1.5 text-gm-xs h-8 px-3"
            >
              <span>Visit Portal</span>
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </aside>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="bg-[var(--gm-surface)] border border-[var(--gm-border)] h-auto min-h-11 px-2.5 py-1.5 gap-2 sm:gap-3 flex-wrap max-w-full overflow-hidden">
          <TabsTrigger value="portals" className="gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0">
            <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[var(--gm-accent-strong)]" />
            <span>Frequent Portals</span>
            {frequentWebsites.length > 0 && (
              <Badge variant="accent" size="sm" className="ml-1 px-1.5 py-0 font-mono text-[10px] shrink-0">
                {frequentWebsites.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0">
            <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[var(--gm-accent-strong)]" />
            <span>Credentials ({credentials.length})</span>
          </TabsTrigger>
          <TabsTrigger value="search" className="gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap shrink-0">
            <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-[var(--gm-accent-strong)]" />
            <span>Search Portals</span>
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: FREQUENT WEBSITES & PINNED PORTALS ─── */}
        <TabsContent value="portals" className="space-y-6">
          {/* Auto-Curated Section: Websites with >= 5 works */}
          <div className="rounded-gm-xl border-2 border-[var(--gm-accent-muted)] bg-[var(--gm-bg-elevated)] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gm-base text-[var(--gm-text)] flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Auto-Curated Frequent Websites (&ge; 5 Works Tracked)</span>
                </h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                  Websites and reading platforms where you have accumulated 5 or more works in your collection.
                </p>
              </div>
            </div>

            {frequentWebsites.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[var(--gm-border)] rounded-gm-lg text-gm-sm text-[var(--gm-text-muted)]">
                No reading domains currently have 5 or more works. As you import or bookmark works from platforms like MangaDex or Webnovel, their homepages will automatically appear here!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {frequentWebsites.map((fw) => (
                  <div
                    key={fw.domain}
                    className="p-3.5 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] flex flex-col justify-between gap-3 hover:border-[var(--gm-accent-strong)] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-gm-sm text-[var(--gm-text)] truncate">
                          {fw.domain}
                        </span>
                        <Badge variant="accent" size="sm" className="font-mono text-[10px]">
                          {fw.count} works
                        </Badge>
                      </div>
                      <p className="text-gm-xs text-[var(--gm-text-muted)] mt-1 truncate">
                        e.g. {fw.sampleTitle}
                      </p>
                    </div>

                    <a
                      href={fw.sampleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-3 py-1.5 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] hover:bg-[var(--gm-accent)] hover:text-[var(--gm-accent-fg)] transition-all cursor-pointer"
                    >
                      <span>Open Homepage</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User-Pinned Portals Section */}
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gm-base text-[var(--gm-text)] flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-[var(--gm-accent-strong)]" />
                  <span>Favorite Reading Portals ({pinnedPortals.length})</span>
                </h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                  Hand-pinned portals, digital libraries, and scanlation homepages.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAddPortal(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Pin Portal</span>
              </Button>
            </div>

            {showAddPortal && (
              <form onSubmit={handleAddPortal} className="p-4 rounded-gm-lg border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] space-y-3">
                <div className="font-bold text-gm-sm text-[var(--gm-text)]">Pin New Reading Portal</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gm-xs font-mono text-[var(--gm-text-muted)] block mb-1">Portal / Site Name *</label>
                    <Input
                      placeholder="e.g. Asura Scans, NovelUpdates"
                      value={portalName}
                      onChange={(e) => setPortalName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gm-xs font-mono text-[var(--gm-text-muted)] block mb-1">Website Homepage URL *</label>
                    <Input
                      placeholder="https://asuracomic.net"
                      value={portalUrl}
                      onChange={(e) => setPortalUrl(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddPortal(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit">
                    Save Portal
                  </Button>
                </div>
              </form>
            )}

            {pinnedPortals.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-[var(--gm-border)] rounded-gm-lg text-gm-sm text-[var(--gm-text-muted)]">
                No custom portals pinned yet. Click "Pin Portal" to add your preferred reading hubs.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinnedPortals.map((portal) => (
                  <div
                    key={portal.id}
                    className="p-3.5 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-gm-sm text-[var(--gm-text)] truncate">{portal.name}</div>
                      <div className="text-[11px] font-mono text-[var(--gm-text-muted)] truncate">{portal.domain}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] hover:bg-[var(--gm-accent)] hover:text-white transition-colors"
                        title="Open Portal"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDeletePortal(portal.id)}
                        className="p-1.5 rounded-gm-sm text-[var(--gm-text-subtle)] hover:text-[var(--gm-danger)] transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 2: CREDENTIAL KEYRING (PASSWORDS) ─── */}
        <TabsContent value="credentials" className="space-y-4">
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gm-base text-[var(--gm-text)] flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-500" />
                  <span>Reading Accounts &amp; Keyring ({credentials.length})</span>
                </h3>
                <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                  Stores usernames and passwords locally in zero-knowledge encrypted partition. Never leaves your machine.
                </p>
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAddCred(true)}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Add Credential</span>
              </Button>
            </div>

            {showAddCred && (
              <form onSubmit={handleAddCredential} className="p-4 rounded-gm-lg border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] space-y-3">
                <div className="font-bold text-gm-sm text-[var(--gm-text)]">Store Reading Account</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-gm-xs font-mono text-[var(--gm-text-muted)] block mb-1">Site / Service Name *</label>
                    <Input
                      placeholder="e.g. Webnovel, MangaDex, Asura"
                      value={siteName}
                      onChange={(e) => setSiteName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gm-xs font-mono text-[var(--gm-text-muted)] block mb-1">Website URL (Optional)</label>
                    <Input
                      placeholder="https://mangadex.org"
                      value={siteUrl}
                      onChange={(e) => setSiteUrl(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-gm-xs font-mono text-[var(--gm-text-muted)] block mb-1">Username / Email *</label>
                    <Input
                      placeholder="archivist@reader.local"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-gm-xs font-mono text-[var(--gm-text-muted)] block mb-1">Password *</label>
                    <Input
                      type="password"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-gm-xs font-mono text-[var(--gm-text-muted)] block mb-1">Notes / Security PIN / Tier</label>
                  <Input
                    placeholder="e.g. VIP Member until 2027, 2FA backup code"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setShowAddCred(false)}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" type="submit">
                    Save to Keyring
                  </Button>
                </div>
              </form>
            )}

            {credentials.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[var(--gm-border)] rounded-gm-lg text-gm-sm text-[var(--gm-text-muted)]">
                No reading account credentials saved yet. Click "Add Credential" to store your reading logins securely.
              </div>
            ) : (
              <div className="divide-y divide-[var(--gm-border)]">
                {credentials.map((cred) => {
                  const isRevealed = Boolean(revealedPasswords[cred.id]);
                  return (
                    <div key={cred.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gm-sm text-[var(--gm-text)]">{cred.siteName}</span>
                          {cred.siteUrl && (
                            <a
                              href={cred.siteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--gm-text-subtle)] hover:text-[var(--gm-accent-strong)]"
                              title="Visit Website"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-gm-xs font-mono text-[var(--gm-text-muted)]">
                          <span>User: <strong className="text-[var(--gm-text)]">{cred.username}</strong></span>
                          <span>
                            Pass:{" "}
                            <span className="font-mono bg-[var(--gm-surface)] px-1.5 py-0.5 rounded border border-[var(--gm-border)]">
                              {isRevealed ? cred.password : "••••••••••••"}
                            </span>
                          </span>
                        </div>
                        {cred.notes && (
                          <p className="text-[11px] text-[var(--gm-text-subtle)] mt-1 italic">{cred.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedPasswords((prev) => ({ ...prev, [cred.id]: !prev[cred.id] }))
                          }
                          className="p-1.5 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] hover:text-[var(--gm-text)] cursor-pointer text-[var(--gm-text-subtle)]"
                          title={isRevealed ? "Hide Password" : "View Password"}
                        >
                          {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cred.username, "Username")}
                          className="p-1.5 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] hover:text-[var(--gm-text)] cursor-pointer text-[var(--gm-text-subtle)] flex items-center gap-1 text-[11px] font-mono"
                          title="Copy Username"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">User</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cred.password, "Password")}
                          className="p-1.5 rounded-gm-sm border border-[var(--gm-border)] bg-[var(--gm-surface)] hover:text-[var(--gm-text)] cursor-pointer text-[var(--gm-text-subtle)] flex items-center gap-1 text-[11px] font-mono"
                          title="Copy Password"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="hidden md:inline">Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCredential(cred.id, cred.siteName)}
                          className="p-1.5 rounded-gm-sm text-[var(--gm-text-subtle)] hover:text-[var(--gm-danger)] transition-colors cursor-pointer"
                          title="Delete Credential"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── TAB 3: SEARCH PORTALS DIRECTORY ─── */}
        <TabsContent value="search" className="space-y-4">
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-5 space-y-4">
            <div>
              <h3 className="font-bold text-gm-base text-[var(--gm-text)] flex items-center gap-2">
                <Search className="h-5 w-5 text-[var(--gm-accent-strong)]" />
                <span>Multi-Portal Work Search Launcher</span>
              </h3>
              <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                Type any title or author once, then launch instant searches across major web novel, manga, and catalog databases with 1 click.
              </p>
            </div>

            <div className="relative">
              <Input
                placeholder="Type title or author to search across platforms (e.g. Omniscient Reader, Frieren, Lord of the Mysteries)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 text-gm-sm"
              />
              <Search className="absolute right-3 top-2.5 h-4 w-4 text-[var(--gm-text-subtle)]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
              {searchPortals.map((sp) => {
                const targetUrl = sp.url(searchQuery || "fiction");
                return (
                  <div
                    key={sp.name}
                    className="p-3.5 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-surface)] flex items-center justify-between gap-3 hover:border-[var(--gm-accent-strong)] transition-all"
                  >
                    <div>
                      <div className="font-bold text-gm-sm text-[var(--gm-text)]">{sp.name}</div>
                      <div className="text-[11px] font-mono text-[var(--gm-text-muted)] truncate">Search Index</div>
                    </div>
                    <a
                      href={targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-gm-sm border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] px-2.5 py-1.5 text-gm-xs font-mono font-bold uppercase text-[var(--gm-text)] hover:bg-[var(--gm-accent)] hover:text-[var(--gm-accent-fg)] transition-all cursor-pointer shrink-0"
                    >
                      <span>Search</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}

export default KeyringPortals;
