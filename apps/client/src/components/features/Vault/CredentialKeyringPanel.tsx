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
import { Badge, Button, Input, toast } from "@grimoire/ui";
import { clientRepository, useLibraryStore } from "@grimoire/state";

export interface VaultCredential {
  readonly id: string;
  readonly siteName: string;
  readonly siteUrl: string;
  readonly searchUrl?: string;
  readonly username: string;
  readonly password: string; // Stored securely while vault is active
  readonly notes?: string;
  readonly createdAt: string;
}

export interface PinnedPortal {
  readonly id: string;
  readonly name: string;
  readonly url: string;
  readonly domain: string;
  readonly isAutoDetected?: boolean;
  readonly workCount?: number;
}

const CREDENTIALS_STORAGE_KEY = "grimoire:vault:credentials";
const PINNED_PORTALS_STORAGE_KEY = "grimoire:vault:portals";

export function CredentialKeyringPanel() {
  const library = useLibraryStore();
  const [credentials, setCredentials] = React.useState<VaultCredential[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(CREDENTIALS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [pinnedPortals, setPinnedPortals] = React.useState<PinnedPortal[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(PINNED_PORTALS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // State for new credential form
  const [showAddCred, setShowAddCred] = React.useState(false);
  const [siteName, setSiteName] = React.useState("");
  const [siteUrl, setSiteUrl] = React.useState("");
  const [searchUrl, setSearchUrl] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [revealedPasswords, setRevealedPasswords] = React.useState<Record<string, boolean>>({});

  // State for new portal form
  const [showAddPortal, setShowAddPortal] = React.useState(false);
  const [portalName, setPortalName] = React.useState("");
  const [portalUrl, setPortalUrl] = React.useState("");

  // Auto-detect domains where user has >= 5 works in their library!
  const autoDetectedPortals = React.useMemo(() => {
    const domainCounts: Record<string, { count: number; sampleTitle: string; sampleUrl: string; providerName: string }> = {};

    const items = clientRepository.getItems();
    for (const item of items) {
      if (item.work.deletedAt) continue;
      for (const p of item.accessPaths) {
        let domain = "";
        let sampleUrl = "";
        const u = p.url ?? ("accessUrl" in p ? (p.accessUrl as string) : "");
        if (u && /^https?:\/\//i.test(u)) {
          try {
            const parsed = new URL(u);
            const host = parsed.hostname.replace(/^www\./, "");
            if (host) {
              domain = host;
              sampleUrl = `${parsed.protocol}//${parsed.hostname}`;
            }
          } catch {
            // ignore malformed URLs
          }
        }
        if (!domain && p.provider && p.provider !== "local_file" && p.provider !== "import") {
          domain = p.provider.toLowerCase();
          sampleUrl = `https://${domain}`;
        }

        if (domain) {
          if (!domainCounts[domain]) {
            domainCounts[domain] = {
              count: 0,
              sampleTitle: item.work.title,
              sampleUrl: sampleUrl || `https://${domain}`,
              providerName: p.provider || domain,
            };
          }
          domainCounts[domain]!.count += 1;
        }
      }
    }

    // Filter to domains with >= 5 works
    const frequent: PinnedPortal[] = [];
    for (const [domain, meta] of Object.entries(domainCounts)) {
      if (meta.count >= 5) {
        frequent.push({
          id: `auto-${domain}`,
          name: meta.providerName ? meta.providerName.toUpperCase() : domain,
          url: meta.sampleUrl,
          domain,
          isAutoDetected: true,
          workCount: meta.count,
        });
      }
    }

    return frequent.sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0));
  }, [library.items]);

  const saveCredentials = (updated: VaultCredential[]) => {
    setCredentials(updated);
    try {
      window.localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const savePortals = (updated: PinnedPortal[]) => {
    setPinnedPortals(updated);
    try {
      window.localStorage.setItem(PINNED_PORTALS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleAddCredential = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteName.trim() || !username.trim() || !password.trim()) {
      toast({
        title: "Required Fields Missing",
        description: "Please specify Site Name, Username, and Password.",
        variant: "destructive",
      });
      return;
    }

    const newCred: VaultCredential = {
      id: `cred-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      siteName: siteName.trim(),
      siteUrl: siteUrl.trim() || (siteName.includes(".") ? `https://${siteName.trim()}` : ""),
      searchUrl: searchUrl.trim() || undefined,
      username: username.trim(),
      password: password.trim(),
      notes: notes.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    saveCredentials([newCred, ...credentials]);
    setSiteName("");
    setSiteUrl("");
    setSearchUrl("");
    setUsername("");
    setPassword("");
    setNotes("");
    setShowAddCred(false);

    toast({
      title: "Credential Secured in Vault",
      description: `Stored credentials for ${newCred.siteName}.`,
      variant: "success",
    });
  };

  const handleDeleteCredential = (id: string, name: string) => {
    if (!window.confirm(`Delete saved credentials for "${name}" from your vault?`)) return;
    saveCredentials(credentials.filter((c) => c.id !== id));
    toast({
      title: "Credential Removed",
      description: `Removed credentials for ${name}.`,
    });
  };

  const handleAddPortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!portalName.trim() || !portalUrl.trim()) return;

    let cleanUrl = portalUrl.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = `https://${cleanUrl}`;
    }

    let domain = cleanUrl;
    try {
      domain = new URL(cleanUrl).hostname.replace(/^www\./, "");
    } catch {
      // fallback
    }

    const newPortal: PinnedPortal = {
      id: `portal-${Date.now()}`,
      name: portalName.trim(),
      url: cleanUrl,
      domain,
      isAutoDetected: false,
    };

    savePortals([...pinnedPortals, newPortal]);
    setPortalName("");
    setPortalUrl("");
    setShowAddPortal(false);
    toast({
      title: "Favorite Portal Added",
      description: `Pinned ${newPortal.name} to quick launchpad.`,
      variant: "success",
    });
  };

  const handleDeletePortal = (id: string) => {
    savePortals(pinnedPortals.filter((p) => p.id !== id));
  };

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      toast({
        title: `${label} Copied`,
        description: "Copied to your clipboard.",
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* ──────────────────────────────────────────────────────────
          PART 1: FAVORITE & FREQUENT PORTALS LAUNCHPAD
          ────────────────────────────────────────────────────────── */}
      <section className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-6 shadow-[4px_4px_0px_var(--gm-border-strong)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--gm-border-strong)] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-[var(--gm-warning)]" />
              <h2 className="text-gm-lg font-extrabold text-[var(--gm-text)]">
                Favorite &amp; Frequent Portals Launchpad
              </h2>
            </div>
            <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
              Quick launch portals for reading platforms, novel sites, and auto-curated domains with 5+ works in your library.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAddPortal((prev) => !prev)}
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4 text-[var(--gm-accent-strong)]" />
            <span>{showAddPortal ? "Cancel" : "Pin Favorite Website"}</span>
          </Button>
        </div>

        {/* Add portal form */}
        {showAddPortal && (
          <form
            onSubmit={handleAddPortal}
            className="mb-6 p-4 border border-[var(--gm-border)] bg-[var(--gm-surface)] rounded-gm-sm space-y-3"
          >
            <p className="text-gm-xs font-bold uppercase tracking-wider text-[var(--gm-accent-strong)]">
              Pin a Website to Launchpad
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                placeholder="Portal Name (e.g. Royal Road, MangaDex)"
                value={portalName}
                onChange={(e) => setPortalName(e.target.value)}
                required
              />
              <Input
                placeholder="Homepage URL (e.g. https://www.royalroad.com)"
                value={portalUrl}
                onChange={(e) => setPortalUrl(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddPortal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm" className="gap-1.5">
                <Bookmark className="h-3.5 w-3.5" />
                <span>Save Portal</span>
              </Button>
            </div>
          </form>
        )}

        {/* Portals list */}
        {autoDetectedPortals.length === 0 && pinnedPortals.length === 0 ? (
          <div className="py-8 text-center text-gm-sm text-[var(--gm-text-muted)]">
            <Globe className="h-8 w-8 mx-auto mb-2 text-[var(--gm-text-subtle)] opacity-70" />
            <p className="font-semibold text-[var(--gm-text)]">No pinned portals yet</p>
            <p className="text-gm-xs mt-1">
              Add websites you frequently visit, or import works — domains with 5 or more works will automatically appear here!
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {/* Auto-detected portals (5+ works) */}
            {autoDetectedPortals.map((portal) => (
              <div
                key={portal.id}
                className="group relative flex items-center justify-between border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] p-3.5 hover:border-[var(--gm-accent-strong)] transition-all shadow-[2px_2px_0px_var(--gm-border)]"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-gm-sm text-[var(--gm-text)] truncate">
                      {portal.name}
                    </span>
                    <Badge variant="default" className="text-[9px] font-mono py-0 px-1.5">
                      {portal.workCount} Works in Library
                    </Badge>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--gm-text-muted)] truncate mt-0.5">
                    {portal.domain}
                  </p>
                </div>
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] hover:bg-[var(--gm-accent-strong)] hover:text-white transition-colors"
                  title={`Open ${portal.domain} homepage`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}

            {/* User-pinned portals */}
            {pinnedPortals.map((portal) => (
              <div
                key={portal.id}
                className="group relative flex items-center justify-between border border-[var(--gm-border)] bg-[var(--gm-surface)] p-3.5 hover:border-[var(--gm-accent-strong)] transition-all shadow-[2px_2px_0px_var(--gm-border)]"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5 text-[var(--gm-warning)] shrink-0" />
                    <span className="font-bold text-gm-sm text-[var(--gm-text)] truncate">
                      {portal.name}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-[var(--gm-text-muted)] truncate mt-0.5">
                    {portal.domain}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={portal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 w-8 items-center justify-center border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] hover:bg-[var(--gm-accent-strong)] hover:text-white transition-colors"
                    title={`Open ${portal.name} homepage`}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeletePortal(portal.id)}
                    className="inline-flex h-8 w-8 items-center justify-center text-[var(--gm-text-muted)] hover:text-[var(--gm-danger)] transition-colors cursor-pointer"
                    title="Unpin portal"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ──────────────────────────────────────────────────────────
          PART 2: SECURE CREDENTIAL KEYRING (PASSWORDS & USERNAME STORAGE)
          ────────────────────────────────────────────────────────── */}
      <section className="border-2 border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-6 shadow-[4px_4px_0px_var(--gm-border-strong)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--gm-border-strong)] pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[var(--gm-accent-strong)]" />
              <h2 className="text-gm-lg font-extrabold text-[var(--gm-text)]">
                Secure Credential Keyring ({credentials.length} Saved)
              </h2>
            </div>
            <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
              Encrypted login storage for your reading sites and novel accounts. Passwords remain sealed behind your Master Passphrase.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setShowAddCred((prev) => !prev)}
            className="gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{showAddCred ? "Cancel" : "Add Website Login"}</span>
          </Button>
        </div>

        {/* Add credential form */}
        {showAddCred && (
          <form
            onSubmit={handleAddCredential}
            className="mb-6 p-4 border border-[var(--gm-border-strong)] bg-[var(--gm-surface)] rounded-gm-sm space-y-4"
          >
            <div className="flex items-center gap-2 text-gm-xs font-bold uppercase tracking-wider text-[var(--gm-accent-strong)]">
              <ShieldCheck className="h-4 w-4" />
              <span>Store Login Credentials</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-[var(--gm-text-subtle)] mb-1">
                  Website / Service Name *
                </label>
                <Input
                  placeholder="e.g. MangaDex, Royal Road, Ao3"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--gm-text-subtle)] mb-1">
                  Website URL (Optional)
                </label>
                <Input
                  placeholder="e.g. https://mangadex.org"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--gm-text-subtle)] mb-1">
                  Username / Email *
                </label>
                <Input
                  placeholder="Your username or email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--gm-text-subtle)] mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  placeholder="Account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold text-[var(--gm-text-subtle)] mb-1">
                  Search URL Template (Optional)
                </label>
                <Input
                  placeholder="e.g. https://mangadex.org/search?q={query}"
                  value={searchUrl}
                  onChange={(e) => setSearchUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[var(--gm-text-subtle)] mb-1">
                  Security Notes / Recovery Code (Optional)
                </label>
                <Input
                  placeholder="2FA backup codes, PIN, or reading notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--gm-border)]">
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCred(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="default" size="sm" className="gap-1.5">
                <KeyRound className="h-3.5 w-3.5" />
                <span>Save to Keyring</span>
              </Button>
            </div>
          </form>
        )}

        {/* Credentials list */}
        {credentials.length === 0 ? (
          <div className="py-8 text-center text-gm-sm text-[var(--gm-text-muted)]">
            <KeyRound className="h-8 w-8 mx-auto mb-2 text-[var(--gm-text-subtle)] opacity-70" />
            <p className="font-semibold text-[var(--gm-text)]">Keyring is empty</p>
            <p className="text-gm-xs mt-1">
              Store usernames and passwords for your favorite webtoon, novel, and anime accounts safely in one place.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--gm-border)] border border-[var(--gm-border)] bg-[var(--gm-surface)]">
            {credentials.map((cred) => {
              const isPasswordVisible = Boolean(revealedPasswords[cred.id]);

              return (
                <div
                  key={cred.id}
                  className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-[var(--gm-bg-elevated)]/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gm-sm text-[var(--gm-text)]">
                        {cred.siteName}
                      </span>
                      {cred.siteUrl && (
                        <a
                          href={cred.siteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-mono text-[var(--gm-accent-strong)] hover:underline inline-flex items-center gap-0.5"
                        >
                          <span>visit</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-4 text-gm-xs">
                      <div className="flex items-center gap-1.5 font-mono bg-[var(--gm-bg-elevated)] px-2 py-0.5 border border-[var(--gm-border)]">
                        <span className="text-[var(--gm-text-muted)]">User:</span>
                        <span className="font-semibold text-[var(--gm-text)] select-all">
                          {cred.username}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cred.username, "Username")}
                          className="text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] transition-colors cursor-pointer ml-1"
                          title="Copy Username"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono bg-[var(--gm-bg-elevated)] px-2 py-0.5 border border-[var(--gm-border)]">
                        <span className="text-[var(--gm-text-muted)]">Pass:</span>
                        <span className="font-semibold text-[var(--gm-text)]">
                          {isPasswordVisible ? cred.password : "••••••••••••"}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setRevealedPasswords((prev) => ({
                              ...prev,
                              [cred.id]: !prev[cred.id],
                            }))
                          }
                          className="text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] transition-colors cursor-pointer ml-1"
                          title={isPasswordVisible ? "Hide Password" : "Reveal Password"}
                        >
                          {isPasswordVisible ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(cred.password, "Password")}
                          className="text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] transition-colors cursor-pointer ml-0.5"
                          title="Copy Password"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>

                      {cred.searchUrl && (
                        <div className="flex items-center gap-1.5 font-mono bg-[var(--gm-bg-elevated)] px-2 py-0.5 border border-[var(--gm-border)]">
                          <span className="text-[var(--gm-text-muted)]">Search:</span>
                          <span className="text-[var(--gm-accent-strong)] truncate max-w-[180px]" title={cred.searchUrl}>
                            {cred.searchUrl}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(cred.searchUrl!, "Search URL")}
                            className="text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] transition-colors cursor-pointer ml-1"
                            title="Copy Search URL"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <a
                            href={cred.searchUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--gm-accent-strong)] hover:underline ml-0.5"
                            title="Open Search Page"
                          >
                            <Search className="h-3 w-3" />
                          </a>
                        </div>
                      )}

                      {cred.notes && (
                        <span className="text-[11px] text-[var(--gm-text-muted)] italic">
                          Note: {cred.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cred.siteUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1 text-[11px]"
                        onClick={() => {
                          copyToClipboard(cred.password, "Password");
                          window.open(cred.siteUrl, "_blank", "noopener,noreferrer");
                        }}
                        title="Copy password and open website in new tab"
                      >
                        <ExternalLink className="h-3 w-3" />
                        <span>Launch &amp; Copy Pass</span>
                      </Button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCredential(cred.id, cred.siteName)}
                      className="inline-flex h-8 w-8 items-center justify-center text-[var(--gm-text-muted)] hover:text-[var(--gm-danger)] transition-colors cursor-pointer"
                      title="Delete credential"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
