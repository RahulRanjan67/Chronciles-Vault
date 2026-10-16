import * as React from "react";
import {
  Compass,
  Search,
  Sparkles,
  BookOpen,
  Plus,
  Check,
  AlertTriangle,
  X,
  RotateCcw,
  Globe,
  Library as LibraryIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Cover,
  EmptyState,
  Input,
  PageContainer,
  toast,
} from "@chronicles-vault/ui";
import {
  ContentOrigin,
  ContentType,
  PersonalState,
  PrivacyState,
  PublicationState,
  type WorkCreator,
} from "@chronicles-vault/domain";
import type { WorkId } from "@chronicles-vault/shared";
import {
  clientRepository,
  generateLocalRecommendations,
  useLibraryStore,
  useRecommendationsStore,
  type HydratedWorkItem,
} from "@chronicles-vault/state";

export interface DiscoverProps {
  onNavigateWork?: (workId: string) => void;
}

type ProviderSource = "anilist" | "openlibrary";

interface CatalogCandidate {
  externalKey: string;
  provider: ProviderSource;
  providerId: string;
  title: string;
  alternativeTitles: string[];
  originalTitle: string | null;
  description: string | null;
  coverUrl: string | null;
  contentType: ContentType;
  origin: ContentOrigin;
  publicationState: PublicationState;
  genres: string[];
  totalChapters: number | null;
  totalVolumes: number | null;
  creators: Array<{ name: string; role: "author" | "artist" | "studio" }>;
  siteUrl: string | null;
}

type LibraryMatchState =
  | { kind: "already_in_library"; item: HydratedWorkItem }
  | { kind: "similar_existing"; item: HydratedWorkItem }
  | { kind: "new_work" };

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]+/g, " ")
    .trim();
}

function stripHtmlTags(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
  return cleaned || null;
}

function classifyAgainstLibrary(
  candidate: CatalogCandidate,
  libraryItems: readonly HydratedWorkItem[],
): LibraryMatchState {
  const normCandidate = normalizeTitle(candidate.title);
  const candidateAliases = new Set(
    [candidate.title, ...candidate.alternativeTitles, candidate.originalTitle ?? ""]
      .map(normalizeTitle)
      .filter(Boolean),
  );

  for (const item of libraryItems) {
    if (item.work.deletedAt) continue;
    const hasExtMatch = item.work.externalIds.some(
      (ext) => ext.provider === candidate.provider && ext.externalId === candidate.providerId,
    );
    if (hasExtMatch) {
      return { kind: "already_in_library", item };
    }
    const itemTitles = [
      item.work.title,
      ...item.work.alternativeTitles,
      item.work.originalTitle ?? "",
    ]
      .map(normalizeTitle)
      .filter(Boolean);

    if (itemTitles.some((t) => candidateAliases.has(t))) {
      return { kind: "already_in_library", item };
    }
  }

  // Check token/substring similarity for "Similar existing work"
  const candidateTokens = normCandidate.split(/\s+/).filter((t) => t.length >= 3);
  if (candidateTokens.length > 0) {
    for (const item of libraryItems) {
      if (item.work.deletedAt) continue;
      const normExisting = normalizeTitle(item.work.title);
      if (
        normExisting.length >= 4 &&
        normCandidate.length >= 4 &&
        (normExisting.includes(normCandidate) || normCandidate.includes(normExisting))
      ) {
        return { kind: "similar_existing", item };
      }
      const existingTokens = new Set(normExisting.split(/\s+/).filter((t) => t.length >= 3));
      const overlap = candidateTokens.filter((t) => existingTokens.has(t)).length;
      if (overlap >= 2 && overlap / Math.max(candidateTokens.length, existingTokens.size) >= 0.6) {
        return { kind: "similar_existing", item };
      }
    }
  }

  return { kind: "new_work" };
}

export function Discover({ onNavigateWork }: DiscoverProps) {
  const refreshLibrary = useLibraryStore((s) => s.refresh);
  const { dismissedWorkIds, dismissRecommendation, restoreAllDismissed } =
    useRecommendationsStore();

  const [libraryItems, setLibraryItems] = React.useState<HydratedWorkItem[]>(() =>
    clientRepository.getItems(),
  );
  const [query, setQuery] = React.useState("");
  const [provider, setProvider] = React.useState<ProviderSource>("anilist");
  const [searching, setSearching] = React.useState(false);
  const [hasSearchedCatalog, setHasSearchedCatalog] = React.useState(false);
  const [catalogResults, setCatalogResults] = React.useState<CatalogCandidate[]>([]);
  const [searchError, setSearchError] = React.useState<string | null>(null);

  const syncLibrary = React.useCallback(() => {
    refreshLibrary();
    setLibraryItems(clientRepository.getItems());
  }, [refreshLibrary]);

  // 1. Local library matches for the typed query
  const localMatches = React.useMemo(() => {
    const q = normalizeTitle(query);
    if (!q) return [];
    return libraryItems.filter((item) => {
      if (item.work.deletedAt || item.work.privacyState === PrivacyState.Vault) return false;
      const hay = [
        item.work.title,
        ...item.work.alternativeTitles,
        item.work.originalTitle ?? "",
        ...(item.work.creators ?? []).map((c) => c.name),
      ]
        .map(normalizeTitle)
        .join(" ");
      return hay.includes(q);
    });
  }, [query, libraryItems]);

  // 2. Local explainable recommendations (BACKLOG.md §3.2)
  const recommendations = React.useMemo(() => {
    return generateLocalRecommendations(libraryItems, new Set(dismissedWorkIds));
  }, [libraryItems, dismissedWorkIds]);

  const handleCatalogSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      toast({ title: "Enter a title or keyword to search", variant: "warning" });
      return;
    }

    setSearching(true);
    setSearchError(null);
    setHasSearchedCatalog(true);

    try {
      if (provider === "anilist") {
        const gql = `
          query ($search: String) {
            Page(page: 1, perPage: 10) {
              media(search: $search, sort: SEARCH_MATCH) {
                id
                type
                format
                status
                countryOfOrigin
                chapters
                volumes
                genres
                siteUrl
                description(asHtml: false)
                title {
                  romaji
                  english
                  native
                }
                coverImage {
                  extraLarge
                  large
                }
                staff(perPage: 3) {
                  edges {
                    role
                    node {
                      name {
                        full
                      }
                    }
                  }
                }
              }
            }
          }
        `;
        const res = await fetch("https://graphql.anilist.co", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({ query: gql, variables: { search: trimmed } }),
        });

        if (!res.ok) {
          throw new Error(`AniList returned HTTP ${res.status}`);
        }
        const json = await res.json();
        const mediaList = json?.data?.Page?.media ?? [];
        const mapped: CatalogCandidate[] = mediaList.map((m: Record<string, any>) => {
          const titleObj = m.title ?? {};
          const primaryTitle =
            titleObj.english || titleObj.romaji || titleObj.native || "Untitled";
          const altTitles = [titleObj.romaji, titleObj.english, titleObj.native].filter(
            (t): t is string => Boolean(t && t !== primaryTitle),
          );
          const country = String(m.countryOfOrigin ?? "JP").toUpperCase();
          const format = String(m.format ?? "MANGA").toUpperCase();

          let contentType = ContentType.Manga;
          if (m.type === "ANIME") contentType = ContentType.Anime;
          else if (format === "NOVEL") contentType = ContentType.LightNovel;
          else if (country === "KR") contentType = ContentType.Manhwa;
          else if (country === "CN") contentType = ContentType.Manhua;

          let origin = ContentOrigin.Japanese;
          if (country === "KR") origin = ContentOrigin.Korean;
          else if (country === "CN") origin = ContentOrigin.Chinese;

          let pubState = PublicationState.Ongoing;
          if (m.status === "FINISHED") pubState = PublicationState.Completed;
          else if (m.status === "HIATUS") pubState = PublicationState.Hiatus;
          else if (m.status === "CANCELLED") pubState = PublicationState.Cancelled;

          const creators: Array<{ name: string; role: "author" | "artist" | "studio" }> = [];
          for (const edge of m.staff?.edges ?? []) {
            const name = edge?.node?.name?.full;
            if (!name) continue;
            const roleRaw = String(edge?.role ?? "").toLowerCase();
            const role: "author" | "artist" | "studio" = roleRaw.includes("art")
              ? "artist"
              : "author";
            creators.push({ name, role });
          }

          return {
            externalKey: `anilist-${m.id}`,
            provider: "anilist",
            providerId: String(m.id),
            title: primaryTitle,
            alternativeTitles: Array.from(new Set(altTitles)),
            originalTitle: titleObj.native ?? null,
            description: stripHtmlTags(m.description),
            coverUrl: m.coverImage?.extraLarge || m.coverImage?.large || null,
            contentType,
            origin,
            publicationState: pubState,
            genres: Array.isArray(m.genres) ? m.genres.slice(0, 6) : [],
            totalChapters: typeof m.chapters === "number" ? m.chapters : null,
            totalVolumes: typeof m.volumes === "number" ? m.volumes : null,
            creators,
            siteUrl: typeof m.siteUrl === "string" ? m.siteUrl : null,
          };
        });
        setCatalogResults(mapped);
      } else {
        const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=10`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
          throw new Error(`Open Library returned HTTP ${res.status}`);
        }
        const json = await res.json();
        const docs = Array.isArray(json?.docs) ? json.docs : [];
        const mapped: CatalogCandidate[] = docs.map((doc: Record<string, any>) => {
          const olKey = String(doc.key ?? "").replace("/works/", "");
          const coverId = doc.cover_i;
          const coverUrl = coverId
            ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
            : null;
          const authors: Array<{ name: string; role: "author" | "artist" | "studio" }> =
            Array.isArray(doc.author_name)
              ? doc.author_name.slice(0, 3).map((name: string) => ({ name, role: "author" }))
              : [];

          return {
            externalKey: `openlibrary-${olKey}`,
            provider: "openlibrary",
            providerId: olKey,
            title: String(doc.title ?? "Untitled"),
            alternativeTitles: [],
            originalTitle: null,
            description: doc.first_sentence?.[0] ?? null,
            coverUrl,
            contentType: ContentType.WesternNovel,
            origin: ContentOrigin.Western,
            publicationState: PublicationState.Completed,
            genres: Array.isArray(doc.subject) ? doc.subject.slice(0, 5) : [],
            totalChapters: null,
            totalVolumes: typeof doc.edition_count === "number" ? doc.edition_count : null,
            creators: authors,
            siteUrl: olKey ? `https://openlibrary.org/works/${olKey}` : null,
          };
        });
        setCatalogResults(mapped);
      }
    } catch (err) {
      setSearchError(
        err instanceof Error ? err.message : "Could not reach public metadata catalog.",
      );
    } finally {
      setSearching(false);
    }
  };

  const handleAddCandidateToLibrary = (candidate: CatalogCandidate) => {
    const created = clientRepository.createWork(
      {
        title: candidate.title,
        alternativeTitles: candidate.alternativeTitles,
        aliases: [],
        originalTitle: candidate.originalTitle,
        description: candidate.description,
        contentType: candidate.contentType,
        origin: candidate.origin,
        publicationState: candidate.publicationState,
        privacyState: PrivacyState.Public,
        coverRef: candidate.coverUrl,
        genres: candidate.genres,
        tags: [candidate.provider],
        totalChapters: candidate.totalChapters,
        totalVolumes: candidate.totalVolumes,
        externalIds: [
          {
            provider: candidate.provider,
            externalId: candidate.providerId,
            ...(candidate.siteUrl ? { url: candidate.siteUrl } : {}),
          },
        ],
      },
      PersonalState.Planned,
      undefined,
      candidate.siteUrl
        ? {
            provider: candidate.provider === "anilist" ? "AniList" : "Open Library",
            url: candidate.siteUrl,
            label: `${candidate.provider === "anilist" ? "AniList" : "Open Library"} Catalog Page`,
          }
        : undefined,
    );

    if (candidate.creators.length > 0) {
      const workCreators: WorkCreator[] = candidate.creators.map((c, idx) => ({
        id: `creator-${created.work.id}-${idx}`,
        workId: created.work.id,
        name: c.name,
        role: c.role,
        sortOrder: idx,
      }));
      clientRepository.updateWork(created.work.id, {
        creators: workCreators,
      });
    }

    syncLibrary();
    toast({
      title: "Added to Library",
      description: `"${candidate.title}" was saved to your Library with official metadata.`,
      variant: "success",
    });
  };

  return (
    <PageContainer maxWidth="wide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <Compass className="h-6 w-6 text-[var(--cv-accent-strong)]" />
            <h1 className="text-cv-2xl sm:text-cv-3xl font-extrabold tracking-tight text-[var(--cv-text)]">
              Discover & Recommendations
            </h1>
          </div>
          <p className="mt-1 text-cv-sm text-[var(--cv-text-muted)]">
            Search your library first, query official metadata catalogs (AniList & Open Library), or explore local explainable recommendations.
          </p>
        </div>
      </div>

      {/* Search Bar & Provider Selector */}
      <form
        onSubmit={handleCatalogSearch}
        className="rounded-cv-xl border border-[var(--cv-border-strong)] bg-[var(--cv-bg-elevated)] p-4 mb-8 shadow-sm space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--cv-text-subtle)]" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your library first, then query official catalog metadata…"
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-cv border border-[var(--cv-border)] bg-[var(--cv-surface)] p-0.5">
              <button
                type="button"
                onClick={() => setProvider("anilist")}
                className={`px-3 py-1.5 rounded-cv-sm text-cv-xs font-medium transition-colors cursor-pointer ${
                  provider === "anilist"
                    ? "bg-[var(--cv-accent)] text-white"
                    : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                }`}
              >
                AniList (Manga / LN / Anime)
              </button>
              <button
                type="button"
                onClick={() => setProvider("openlibrary")}
                className={`px-3 py-1.5 rounded-cv-sm text-cv-xs font-medium transition-colors cursor-pointer ${
                  provider === "openlibrary"
                    ? "bg-[var(--cv-accent)] text-white"
                    : "text-[var(--cv-text-muted)] hover:text-[var(--cv-text)]"
                }`}
              >
                Open Library (Books)
              </button>
            </div>

            <Button type="submit" variant="default" disabled={searching} className="gap-1.5">
              <Globe className="h-4 w-4" />
              <span>{searching ? "Searching…" : "Search Catalog"}</span>
            </Button>
          </div>
        </div>
        <p className="text-[11px] text-[var(--cv-text-subtle)]">
          Privacy & Legality Guardrail: No background requests are made until you click Search Catalog. Covers and metadata come strictly from official public APIs.
        </p>
      </form>

      {/* Step 1: Own-Library Matches (shown whenever query is non-empty) */}
      {query.trim().length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-cv-sm font-bold uppercase tracking-wider text-[var(--cv-text-muted)] flex items-center gap-2">
              <LibraryIcon className="h-4 w-4 text-[var(--cv-accent-strong)]" />
              <span>In Your Library ({localMatches.length})</span>
            </h2>
          </div>

          {localMatches.length === 0 ? (
            <div className="rounded-cv-lg border border-dashed border-[var(--cv-border)] bg-[var(--cv-surface)]/40 p-4 text-cv-xs text-[var(--cv-text-muted)]">
              No exact or partial matches found in your local Library for &ldquo;{query.trim()}&rdquo;. Click <strong>Search Catalog</strong> above to query {provider === "anilist" ? "AniList" : "Open Library"}.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {localMatches.map((item) => (
                <div
                  key={item.work.id}
                  className="flex items-center justify-between gap-3 rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 shrink-0">
                      <Cover
                        src={item.work.coverRef ?? undefined}
                        title={item.work.title}
                        size="sm"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          Already in Library
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-cv-sm font-semibold text-[var(--cv-text)]">
                        {item.work.title}
                      </p>
                      <p className="text-cv-xs text-[var(--cv-text-muted)]">
                        {item.work.contentType} · {item.relationship?.personalState ?? "planned"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onNavigateWork?.(item.work.id)}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Step 2: Official Catalog Results */}
      {hasSearchedCatalog && (
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-cv-sm font-bold uppercase tracking-wider text-[var(--cv-text-muted)] flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--cv-accent-strong)]" />
              <span>
                {provider === "anilist" ? "AniList" : "Open Library"} Catalog Results (
                {catalogResults.length})
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setHasSearchedCatalog(false);
                setCatalogResults([]);
              }}
              className="text-cv-xs text-[var(--cv-text-muted)]"
            >
              Clear Results
            </Button>
          </div>

          {searchError ? (
            <div className="rounded-cv-lg border border-red-500/40 bg-red-500/10 p-4 text-cv-xs text-red-300">
              {searchError}
            </div>
          ) : catalogResults.length === 0 && !searching ? (
            <div className="rounded-cv-lg border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6 text-center text-cv-sm text-[var(--cv-text-muted)]">
              No catalog results found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {catalogResults.map((cand) => {
                const matchState = classifyAgainstLibrary(cand, libraryItems);
                return (
                  <div
                    key={cand.externalKey}
                    className="flex gap-4 rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4 shadow-xs"
                  >
                    <div className="w-20 shrink-0">
                      <Cover
                        src={cand.coverUrl ?? undefined}
                        title={cand.title}
                        size="md"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="rounded-cv-sm bg-[var(--cv-surface)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--cv-text-muted)] border border-[var(--cv-border)]">
                            {cand.contentType}
                          </span>
                          {matchState.kind === "already_in_library" && (
                            <Badge variant="success" className="text-[10px] px-1.5 py-0">
                              Already in Library
                            </Badge>
                          )}
                          {matchState.kind === "similar_existing" && (
                            <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                              Similar to &ldquo;{matchState.item.work.title}&rdquo;
                            </Badge>
                          )}
                          {matchState.kind === "new_work" && (
                            <Badge variant="accent" className="text-[10px] px-1.5 py-0">
                              New Work
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-cv-sm font-bold text-[var(--cv-text)] line-clamp-1">
                          {cand.title}
                        </h3>
                        {cand.creators.length > 0 && (
                          <p className="text-cv-xs text-[var(--cv-text-muted)] mt-0.5">
                            {cand.creators.map((c) => c.name).join(" · ")}
                          </p>
                        )}
                        {cand.description && (
                          <p className="mt-1.5 text-cv-xs text-[var(--cv-text-subtle)] line-clamp-2">
                            {cand.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {matchState.kind === "already_in_library" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-cv-xs"
                            onClick={() => onNavigateWork?.(matchState.item.work.id)}
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Open in Library</span>
                          </Button>
                        ) : matchState.kind === "similar_existing" ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1.5 text-cv-xs"
                              onClick={() => onNavigateWork?.(matchState.item.work.id)}
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              <span>View Similar</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1.5 text-cv-xs"
                              onClick={() => handleAddCandidateToLibrary(cand)}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Separate Work</span>
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            className="gap-1.5 text-cv-xs"
                            onClick={() => handleAddCandidateToLibrary(cand)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add to Library</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 3: Local Explainable Recommendation Engine (BACKLOG.md §3.2) */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-cv-base font-bold text-[var(--cv-text)] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--cv-accent-strong)]" />
              <span>Local Explainable Recommendations</span>
            </h2>
            <p className="text-cv-xs text-[var(--cv-text-muted)]">
              Computed 100% locally from your adaptation graph, favorite creators, and top genres — with an explicit reason for every suggestion.
            </p>
          </div>
          {dismissedWorkIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={restoreAllDismissed}
              className="gap-1.5 text-cv-xs text-[var(--cv-text-muted)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Dismissed ({dismissedWorkIds.length})</span>
            </Button>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-6">
            <EmptyState
              variant="custom"
              icon={Sparkles}
              title="No active recommendations right now"
              description="Add more works or restore dismissed suggestions to see explainable local recommendations."
            />
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col justify-between rounded-cv-xl border border-[var(--cv-border)] bg-[var(--cv-bg-elevated)] p-4 shadow-xs hover:border-[var(--cv-border-strong)] transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-14 shrink-0">
                      <Cover
                        src={rec.coverUrl ?? undefined}
                        title={rec.title}
                        size="sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => dismissRecommendation(rec.workId as WorkId)}
                      title="Dismiss this recommendation"
                      className="rounded-cv-sm p-1 text-[var(--cv-text-subtle)] hover:bg-[var(--cv-surface)] hover:text-[var(--cv-text)] cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="text-cv-sm font-bold text-[var(--cv-text)] line-clamp-1">
                    {rec.title}
                  </h3>
                  <p className="mt-1.5 rounded-cv bg-[var(--cv-surface)] px-2.5 py-1.5 text-[11px] leading-snug text-[var(--cv-accent-strong)] border border-[var(--cv-border)]">
                    {rec.reasonLabel}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--cv-border)] flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[var(--cv-text-subtle)]">
                    {rec.contentType}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateWork?.(rec.workId)}
                    className="h-7 px-2 text-cv-xs gap-1 text-[var(--cv-text)]"
                  >
                    <BookOpen className="h-3 w-3" />
                    <span>View Work</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}
