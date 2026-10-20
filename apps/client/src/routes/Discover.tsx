import * as React from "react";
import {
  Compass,
  Search,
  Sparkles,
  BookOpen,
  BookMarked,
  Plus,
  Check,
  AlertTriangle,
  X,
  RotateCcw,
  Globe,
  Library as LibraryIcon,
  Tv,
  Layers,
  Clapperboard,
  Flame,
  PlaySquare,
  Feather,
  Palette,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import {
  Badge,
  Button,
  Cover,
  EmptyState,
  Input,
  PageContainer,
  toast,
} from "@grimoire/ui";
import {
  ContentOrigin,
  ContentType,
  PersonalState,
  PrivacyState,
  PublicationState,
  type WorkCreator,
} from "@grimoire/domain";
import type { WorkId } from "@grimoire/shared";
import {
  clientRepository,
  generateLocalRecommendations,
  useLibraryStore,
  useRecommendationsStore,
  type HydratedWorkItem,
} from "@grimoire/state";

export interface DiscoverProps {
  onNavigateWork?: (workId: string) => void;
}

type ProviderSource =
  | "all"
  | "anilist"
  | "mangaupdates"
  | "goodreads"
  | "mangadex"
  | "openlibrary"
  | "gbooks"
  | "imdb"
  | "rottentomatoes"
  | "kissasian"
  | "webnovel"
  | "novelupdates"
  | "kemono";

const PROVIDER_NAMES: Record<ProviderSource, string> = {
  all: "All (AniList + MangaUpdates + Google Books)",
  anilist: "AniList",
  mangaupdates: "MangaUpdates",
  goodreads: "Goodreads",
  mangadex: "MangaDex",
  openlibrary: "Open Library",
  gbooks: "Google Books",
  imdb: "IMDb (Movies & TV)",
  rottentomatoes: "Rotten Tomatoes",
  kissasian: "KissAsian (Asian Drama)",
  webnovel: "Webnovel (Qidian)",
  novelupdates: "NovelUpdates",
  kemono: "Kemono (Creator Hub)",
};

export interface ProviderOption {
  id: ProviderSource;
  label: string;
  tag: string;
  category: "all" | "manga" | "books" | "media";
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { id: "all", label: "All Catalogs", tag: "Universal", category: "all", icon: Globe, description: "Parallel search across AniList, MangaUpdates, & Google Books" },
  { id: "anilist", label: "AniList", tag: "Anime & Manga", category: "manga", icon: Tv, description: "Official anime, manga, and light novel database with rich metadata" },
  { id: "mangaupdates", label: "MangaUpdates", tag: "Baka-Updates", category: "manga", icon: BookOpen, description: "Community manga release tracker, scanlation groups, and licensed volumes" },
  { id: "goodreads", label: "Goodreads", tag: "Books & Reviews", category: "books", icon: BookMarked, description: "World's largest book catalog, author bibliographies, and ratings" },
  { id: "mangadex", label: "MangaDex", tag: "Manga Scanlations", category: "manga", icon: Layers, description: "Open manga library, scanlation chapters, and alternative titles" },
  { id: "openlibrary", label: "Open Library", tag: "Public Archive", category: "books", icon: LibraryIcon, description: "Internet Archive universal open book catalog and ISBN lookup" },
  { id: "gbooks", label: "Google Books", tag: "Digital Books", category: "books", icon: BookOpen, description: "Google's comprehensive published book index and preview data" },
  { id: "imdb", label: "IMDb", tag: "Movies & Shows", category: "media", icon: Clapperboard, description: "Cinema, TV series, animated adaptations, and filmography index" },
  { id: "rottentomatoes", label: "Rotten Tomatoes", tag: "Tomatometer", category: "media", icon: Flame, description: "Verified audience and critic review scores for film and TV" },
  { id: "kissasian", label: "KissAsian", tag: "Asian Drama", category: "media", icon: PlaySquare, description: "K-Drama, J-Drama, and Asian television adaptation catalog" },
  { id: "webnovel", label: "Webnovel", tag: "Qidian Web", category: "books", icon: Feather, description: "Serialized webnovels, translated progression fantasy, and originals" },
  { id: "novelupdates", label: "NovelUpdates", tag: "Light Novels", category: "books", icon: Compass, description: "Asian web and light novel translations, releases, and chapter indexes" },
  { id: "kemono", label: "Kemono", tag: "Creator Hub", category: "media", icon: Palette, description: "Independent creators, Patreon archives, fanbox art, and illustrations" },
];

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

async function searchAniList(trimmed: string, signal?: AbortSignal): Promise<CatalogCandidate[]> {
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
    signal,
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
  return mediaList.map((m: Record<string, any>) => {
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
      provider: "anilist" as const,
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
}

async function searchMangaUpdates(trimmed: string, signal?: AbortSignal): Promise<CatalogCandidate[]> {
  const res = await fetch("https://api.mangaupdates.com/v1/series/search", {
    signal,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ search: trimmed, perpage: 10 }),
  });

  if (!res.ok) {
    throw new Error(`MangaUpdates returned HTTP ${res.status}`);
  }
  const json = await res.json();
  const results = Array.isArray(json?.results) ? json.results : [];
  return results.map((item: any) => {
    const rec = item?.record ?? {};
    const seriesId = String(rec.series_id ?? "");
    const typeStr = String(rec.type ?? "").toLowerCase();

    let contentType = ContentType.Manga;
    let origin = ContentOrigin.Japanese;
    if (typeStr.includes("manhwa")) {
      contentType = ContentType.Manhwa;
      origin = ContentOrigin.Korean;
    } else if (typeStr.includes("manhua")) {
      contentType = ContentType.Manhua;
      origin = ContentOrigin.Chinese;
    } else if (typeStr.includes("novel")) {
      contentType = ContentType.LightNovel;
    }

    const genres: string[] = Array.isArray(rec.genres)
      ? rec.genres.map((g: any) => g.genre).filter(Boolean)
      : [];

    return {
      externalKey: `mangaupdates-${seriesId}`,
      provider: "mangaupdates" as const,
      providerId: seriesId,
      title: rec.title ?? "Untitled",
      alternativeTitles: [],
      originalTitle: null,
      description: stripHtmlTags(rec.description),
      coverUrl: rec.image?.url?.original || rec.image?.url?.thumb || null,
      contentType,
      origin,
      publicationState: PublicationState.Ongoing,
      genres: genres.slice(0, 6),
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: rec.url ?? (seriesId ? `https://www.mangaupdates.com/series.html?id=${seriesId}` : null),
    };
  });
}

async function searchMangaDex(trimmed: string, signal?: AbortSignal): Promise<CatalogCandidate[]> {
  const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(trimmed)}&limit=10&includes[]=cover_art&includes[]=author&includes[]=artist`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`MangaDex returned HTTP ${res.status}`);
  }
  const json = await res.json();
  const data = Array.isArray(json?.data) ? json.data : [];
  return data.map((item: any) => {
    const mangaId = String(item.id ?? "");
    const attrs = item.attributes ?? {};
    const titles = attrs.title ?? {};
    const primaryTitle =
      titles.en ||
      titles["ja-ro"] ||
      titles["ko-ro"] ||
      titles.ja ||
      titles.ko ||
      (Object.values(titles)[0] as string | undefined) ||
      "Untitled";

    const altTitles: string[] = [];
    if (Array.isArray(attrs.altTitles)) {
      for (const altObj of attrs.altTitles) {
        for (const val of Object.values(altObj)) {
          if (typeof val === "string" && val !== primaryTitle) {
            altTitles.push(val);
          }
        }
      }
    }

    const coverRel = (item.relationships ?? []).find((r: any) => r.type === "cover_art");
    const fileName = coverRel?.attributes?.fileName;
    const coverUrl = fileName
      ? `https://uploads.mangadex.org/covers/${mangaId}/${fileName}.512.jpg`
      : null;

    const creators: Array<{ name: string; role: "author" | "artist" | "studio" }> = [];
    for (const rel of item.relationships ?? []) {
      if (rel.type === "author" && rel.attributes?.name) {
        creators.push({ name: rel.attributes.name, role: "author" });
      } else if (rel.type === "artist" && rel.attributes?.name) {
        creators.push({ name: rel.attributes.name, role: "artist" });
      }
    }

    const lang = String(attrs.originalLanguage ?? "ja").toLowerCase();
    let contentType = ContentType.Manga;
    let origin = ContentOrigin.Japanese;
    if (lang === "ko") {
      contentType = ContentType.Manhwa;
      origin = ContentOrigin.Korean;
    } else if (lang === "zh" || lang === "zh-hk") {
      contentType = ContentType.Manhua;
      origin = ContentOrigin.Chinese;
    }

    let pubState = PublicationState.Ongoing;
    if (attrs.status === "completed") pubState = PublicationState.Completed;
    else if (attrs.status === "hiatus") pubState = PublicationState.Hiatus;
    else if (attrs.status === "cancelled") pubState = PublicationState.Cancelled;

    const genres: string[] = [];
    if (Array.isArray(attrs.tags)) {
      for (const t of attrs.tags) {
        const name = t.attributes?.name?.en;
        if (name) genres.push(name);
      }
    }

    const desc = attrs.description?.en || (attrs.description ? (Object.values(attrs.description)[0] as string | undefined) : null);

    return {
      externalKey: `mangadex-${mangaId}`,
      provider: "mangadex" as const,
      providerId: mangaId,
      title: primaryTitle,
      alternativeTitles: Array.from(new Set(altTitles)).slice(0, 5),
      originalTitle: titles.ja || titles.ko || null,
      description: stripHtmlTags(desc ?? null),
      coverUrl,
      contentType,
      origin,
      publicationState: pubState,
      genres: genres.slice(0, 6),
      totalChapters: attrs.lastChapter ? parseFloat(attrs.lastChapter) || null : null,
      totalVolumes: attrs.lastVolume ? parseFloat(attrs.lastVolume) || null : null,
      creators,
      siteUrl: `https://mangadex.org/title/${mangaId}`,
    };
  });
}

async function searchOpenLibrary(trimmed: string, signal?: AbortSignal): Promise<CatalogCandidate[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(trimmed)}&limit=10`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Open Library returned HTTP ${res.status}`);
  }
  const json = await res.json();
  const docs = Array.isArray(json?.docs) ? json.docs : [];
  return docs.map((doc: Record<string, any>) => {
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
      provider: "openlibrary" as const,
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
}

async function searchGoogleBooks(trimmed: string, signal?: AbortSignal): Promise<CatalogCandidate[]> {
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(trimmed)}&maxResults=10`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Google Books returned HTTP ${res.status}`);
  }
  const json = await res.json();
  const items = Array.isArray(json?.items) ? json.items : [];
  return items.map((item: any) => {
    const vol = item.volumeInfo ?? {};
    const bookId = String(item.id ?? "");
    const authors: Array<{ name: string; role: "author" | "artist" | "studio" }> =
      Array.isArray(vol.authors)
        ? vol.authors.map((name: string) => ({ name, role: "author" as const }))
        : [];
    const coverUrl =
      vol.imageLinks?.extraLarge ||
      vol.imageLinks?.large ||
      vol.imageLinks?.medium ||
      vol.imageLinks?.thumbnail ||
      vol.imageLinks?.smallThumbnail ||
      null;

    const safeCover = coverUrl ? coverUrl.replace(/^http:\/\//i, "https://") : null;

    return {
      externalKey: `gbooks-${bookId}`,
      provider: "gbooks" as const,
      providerId: bookId,
      title: String(vol.title ?? "Untitled"),
      alternativeTitles: Array.isArray(vol.categories) ? vol.categories : [],
      originalTitle: null,
      description: stripHtmlTags(vol.description ?? null),
      coverUrl: safeCover,
      contentType: ContentType.WesternNovel,
      origin: ContentOrigin.Western,
      publicationState: PublicationState.Completed,
      genres: Array.isArray(vol.categories) ? vol.categories.slice(0, 5) : ["Literature"],
      totalChapters: null,
      totalVolumes: typeof vol.pageCount === "number" ? vol.pageCount : null,
      creators: authors,
      siteUrl: vol.infoLink || (bookId ? `https://books.google.com/books?id=${bookId}` : null),
    };
  });
}

function searchImdb(trimmed: string): CatalogCandidate[] {
  return [
    {
      externalKey: `imdb-search-${encodeURIComponent(trimmed)}`,
      provider: "imdb" as const,
      providerId: trimmed,
      title: `${trimmed} (IMDb Movies & TV)`,
      alternativeTitles: [`${trimmed} (Cinema & Series Hub)`],
      originalTitle: null,
      description: `IMDb catalog gateway for "${trimmed}". Explore official synopses, cast and crew, parental guides, user ratings, and streaming release dates for Movies, TV Series, and Limited Series.`,
      coverUrl: null,
      contentType: ContentType.Movie,
      origin: ContentOrigin.Western,
      publicationState: PublicationState.Completed,
      genres: ["Movie", "TV Series", "Cinema", "Drama"],
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: `https://www.imdb.com/find/?q=${encodeURIComponent(trimmed)}&s=tt`,
    },
  ];
}

function searchRottenTomatoes(trimmed: string): CatalogCandidate[] {
  return [
    {
      externalKey: `rottentomatoes-search-${encodeURIComponent(trimmed)}`,
      provider: "rottentomatoes" as const,
      providerId: trimmed,
      title: `${trimmed} (Rotten Tomatoes)`,
      alternativeTitles: [`${trimmed} (Tomatometer & Audience Score)`],
      originalTitle: null,
      description: `Rotten Tomatoes review aggregator and synopsis explorer for "${trimmed}". Verify certified fresh ratings, critical consensus, audience reviews, and official trailers.`,
      coverUrl: null,
      contentType: ContentType.Movie,
      origin: ContentOrigin.Western,
      publicationState: PublicationState.Completed,
      genres: ["Critics Reviews", "Tomatometer", "Cinema"],
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: `https://www.rottentomatoes.com/search?search=${encodeURIComponent(trimmed)}`,
    },
  ];
}

function searchKissAsian(trimmed: string): CatalogCandidate[] {
  return [
    {
      externalKey: `kissasian-search-${encodeURIComponent(trimmed)}`,
      provider: "kissasian" as const,
      providerId: trimmed,
      title: `${trimmed} (KissAsian Drama Hub)`,
      alternativeTitles: [`${trimmed} (K-Drama / C-Drama)`],
      originalTitle: null,
      description: `Direct catalog and streaming access path link for "${trimmed}" on KissAsian. Browse Korean Dramas, Chinese Historical/Xianxia Dramas, Japanese Live Actions, and English subtitles.`,
      coverUrl: null,
      contentType: ContentType.KDrama,
      origin: ContentOrigin.Korean,
      publicationState: PublicationState.Ongoing,
      genres: ["K-Drama", "C-Drama", "Asian Drama", "Live Action"],
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: `https://kissasian.cam/search?keyword=${encodeURIComponent(trimmed)}`,
    },
  ];
}

function searchWebnovel(trimmed: string): CatalogCandidate[] {
  return [
    {
      externalKey: `webnovel-search-${encodeURIComponent(trimmed)}`,
      provider: "webnovel" as const,
      providerId: trimmed,
      title: `${trimmed} (Webnovel / Qidian)`,
      alternativeTitles: [`${trimmed} (Webnovel Hub)`],
      originalTitle: null,
      description: `Official Webnovel (Qidian International) catalog candidate for "${trimmed}". Discover official serialized web novels, original progression fantasy, power rankings, and authorized translations.`,
      coverUrl: null,
      contentType: ContentType.WebNovel,
      origin: ContentOrigin.Chinese,
      publicationState: PublicationState.Ongoing,
      genres: ["Progression Fantasy", "Xianxia", "LitRPG", "Web Novel"],
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: `https://www.webnovel.com/search?keywords=${encodeURIComponent(trimmed)}`,
    },
  ];
}

function searchKemono(trimmed: string): CatalogCandidate[] {
  return [
    {
      externalKey: `kemono-search-${encodeURIComponent(trimmed)}`,
      provider: "kemono" as const,
      providerId: trimmed,
      title: `${trimmed} (Kemono Creator Index)`,
      alternativeTitles: [`${trimmed} (Patreon / Fanbox / Pixiv Archive)`],
      originalTitle: null,
      description: `Community creator archive lookup for "${trimmed}" on Kemono. Track serialized illustrations, creator side-stories, bonus light novel chapters, and fan fiction releases.`,
      coverUrl: null,
      contentType: ContentType.Fanfiction,
      origin: ContentOrigin.Japanese,
      publicationState: PublicationState.Ongoing,
      genres: ["Creator Archive", "Fanbox", "Patreon", "Illustrations"],
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: `https://kemono.cr/artists?q=${encodeURIComponent(trimmed)}`,
    },
  ];
}

function searchNovelUpdates(trimmed: string): CatalogCandidate[] {
  return [
    {
      externalKey: `novelupdates-search-${encodeURIComponent(trimmed)}`,
      provider: "novelupdates" as const,
      providerId: trimmed,
      title: `${trimmed} (NovelUpdates Search)`,
      alternativeTitles: [],
      originalTitle: null,
      description: `Direct deep search link for "${trimmed}" on NovelUpdates. Open external catalog to browse web novels, light novels, translations, user ratings, and chapter releases.`,
      coverUrl: null,
      contentType: ContentType.LightNovel,
      origin: ContentOrigin.Korean,
      publicationState: PublicationState.Ongoing,
      genres: ["Web Novel", "Light Novel", "Translations"],
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: `https://www.novelupdates.com/?s=${encodeURIComponent(trimmed)}`,
    },
  ];
}

function searchGoodreads(trimmed: string): CatalogCandidate[] {
  return [
    {
      externalKey: `goodreads-search-${encodeURIComponent(trimmed)}`,
      provider: "goodreads" as const,
      providerId: trimmed,
      title: `${trimmed} (Goodreads Book Catalog)`,
      alternativeTitles: [`${trimmed} (Goodreads Reviews & Ratings)`],
      originalTitle: null,
      description: `Direct deep search query on Goodreads for "${trimmed}". Browse user ratings, member reviews, reading progress statistics, author quotes, user-created bookshelves, and global literary discussions.`,
      coverUrl: null,
      contentType: ContentType.WesternNovel,
      origin: ContentOrigin.Western,
      publicationState: PublicationState.Completed,
      genres: ["Goodreads", "Literature", "Community Ratings", "Book Discussions"],
      totalChapters: null,
      totalVolumes: null,
      creators: [],
      siteUrl: `https://www.goodreads.com/search?q=${encodeURIComponent(trimmed)}`,
    },
  ];
}

export function Discover({ onNavigateWork }: DiscoverProps) {
  const refreshLibrary = useLibraryStore((s) => s.refresh);
  const { dismissedWorkIds, dismissRecommendation, restoreAllDismissed } =
    useRecommendationsStore();

  const [libraryItems, setLibraryItems] = React.useState<HydratedWorkItem[]>(() =>
    clientRepository.getItems(),
  );
  const [query, setQuery] = React.useState("");
  const [provider, setProvider] = React.useState<ProviderSource>("all");
  const [searching, setSearching] = React.useState(false);
  const [hasSearchedCatalog, setHasSearchedCatalog] = React.useState(false);
  const [catalogResults, setCatalogResults] = React.useState<CatalogCandidate[]>([]);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const activeAbortControllerRef = React.useRef<AbortController | null>(null);
  const searchSeqRef = React.useRef(0);

  type ProviderCategory = "all" | "manga" | "books" | "media";
  const [selectedCategory, setSelectedCategory] = React.useState<ProviderCategory>("all");
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -260, behavior: "smooth" });
  };
  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: 260, behavior: "smooth" });
  };

  const visibleProviders = React.useMemo(() => {
    if (selectedCategory === "all") return PROVIDER_OPTIONS;
    return PROVIDER_OPTIONS.filter((opt) => opt.id === "all" || opt.category === selectedCategory);
  }, [selectedCategory]);

  const activeProviderMeta = React.useMemo(() => {
    return PROVIDER_OPTIONS.find((opt) => opt.id === provider) ?? PROVIDER_OPTIONS[0];
  }, [provider]);

  React.useEffect(() => {
    return () => {
      if (activeAbortControllerRef.current) {
        activeAbortControllerRef.current.abort();
      }
    };
  }, []);

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

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    const currentSeq = ++searchSeqRef.current;

    setSearching(true);
    setSearchError(null);
    setHasSearchedCatalog(true);

    try {
      let results: CatalogCandidate[] = [];
      if (provider === "all") {
        const [aniRes, muRes, gbRes] = await Promise.allSettled([
          searchAniList(trimmed, controller.signal),
          searchMangaUpdates(trimmed, controller.signal),
          searchGoogleBooks(trimmed, controller.signal),
        ]);
        if (currentSeq !== searchSeqRef.current || controller.signal.aborted) return;
        const combined: CatalogCandidate[] = [];
        if (aniRes.status === "fulfilled") combined.push(...aniRes.value);
        if (muRes.status === "fulfilled") combined.push(...muRes.value);
        if (gbRes.status === "fulfilled") combined.push(...gbRes.value);
        if (combined.length === 0 && (aniRes.status === "rejected" || muRes.status === "rejected" || gbRes.status === "rejected")) {
          const err = aniRes.status === "rejected"
            ? aniRes.reason
            : muRes.status === "rejected"
            ? muRes.reason
            : (gbRes as PromiseRejectedResult).reason;
          throw err;
        }
        results = combined;
      } else if (provider === "anilist") {
        results = await searchAniList(trimmed, controller.signal);
      } else if (provider === "mangaupdates") {
        results = await searchMangaUpdates(trimmed, controller.signal);
      } else if (provider === "goodreads") {
        results = searchGoodreads(trimmed);
      } else if (provider === "mangadex") {
        results = await searchMangaDex(trimmed, controller.signal);
      } else if (provider === "openlibrary") {
        results = await searchOpenLibrary(trimmed, controller.signal);
      } else if (provider === "gbooks") {
        results = await searchGoogleBooks(trimmed, controller.signal);
      } else if (provider === "imdb") {
        results = searchImdb(trimmed);
      } else if (provider === "rottentomatoes") {
        results = searchRottenTomatoes(trimmed);
      } else if (provider === "kissasian") {
        results = searchKissAsian(trimmed);
      } else if (provider === "webnovel") {
        results = searchWebnovel(trimmed);
      } else if (provider === "novelupdates") {
        results = searchNovelUpdates(trimmed);
      } else if (provider === "kemono") {
        results = searchKemono(trimmed);
      }

      if (currentSeq !== searchSeqRef.current || controller.signal.aborted) return;
      setCatalogResults(results);
    } catch (err) {
      if (currentSeq !== searchSeqRef.current || controller.signal.aborted) return;
      setSearchError(
        err instanceof Error ? err.message : "Could not reach public metadata catalog.",
      );
    } finally {
      if (currentSeq === searchSeqRef.current) {
        setSearching(false);
      }
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
            provider: PROVIDER_NAMES[candidate.provider] ?? candidate.provider,
            url: candidate.siteUrl,
            label: `${PROVIDER_NAMES[candidate.provider] ?? candidate.provider} Catalog Page`,
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
            <Compass className="h-6 w-6 text-[var(--gm-accent-strong)]" />
            <h1 className="text-gm-2xl sm:text-gm-3xl font-extrabold tracking-tight text-[var(--gm-text)]">
              Discover & Recommendations
            </h1>
          </div>
          <p className="mt-1 text-gm-sm text-[var(--gm-text-muted)]">
            Search your library first, query official metadata catalogs (AniList, MangaUpdates, MangaDex, Open Library, NovelUpdates), or explore local explainable recommendations.
          </p>
        </div>
      </div>

      {/* Search Bar & Provider Selector */}
      <form
        onSubmit={handleCatalogSearch}
        className="rounded-gm-2xl border border-[var(--gm-border-strong)] bg-[var(--gm-bg-elevated)] p-4 sm:p-5 mb-8 shadow-sm space-y-4"
      >
        {/* Row 1: Unified High-Fidelity Command Search Bar */}
        <div className="relative flex items-center rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-surface)] shadow-inner transition-all duration-200 focus-within:border-[var(--gm-accent-strong)] focus-within:ring-2 focus-within:ring-[var(--gm-accent-strong)]/20">
          <div className="pl-3.5 sm:pl-4 pr-2 flex items-center pointer-events-none text-[var(--gm-accent-strong)]">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any title, author, or keyword (e.g. Omniscient Reader, Solo Leveling, Dune)..."
            className="w-full bg-transparent py-3 sm:py-3.5 px-2 text-gm-sm sm:text-gm-base text-[var(--gm-text)] placeholder:text-[var(--gm-text-subtle)] focus:outline-none"
          />
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 mr-1.5 rounded-full text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-bg-elevated)] transition-colors cursor-pointer"
              title="Clear query"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <div className="pr-2 shrink-0">
            <Button
              type="submit"
              variant="default"
              disabled={searching}
              className="gap-2 px-3.5 sm:px-4 py-2 text-gm-xs sm:text-gm-sm font-semibold shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              <Globe className="h-4 w-4" />
              <span>{searching ? "Searching…" : "Search Catalog"}</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Category Filter & Scroll Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--gm-text-subtle)] mr-1 hidden sm:inline flex items-center gap-1">
              <Filter className="h-3 w-3" /> Filters:
            </span>
            {(
              [
                { id: "all", label: "All Catalogs", count: PROVIDER_OPTIONS.length },
                { id: "manga", label: "Manga & Anime", count: 3 },
                { id: "books", label: "Books & Novels", count: 5 },
                { id: "media", label: "Drama & Media", count: 4 },
              ] as const
            ).map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-full text-gm-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? "bg-[var(--gm-accent-muted)] text-[var(--gm-accent-strong)] font-bold border border-[var(--gm-accent-strong)]/30"
                      : "text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface)]"
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              );
            })}
          </div>

          {/* Quick Scroll Left/Right arrows for desktop/large screens */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={scrollLeft}
              className="p-1 rounded-md border border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-bg-elevated)] transition-colors cursor-pointer"
              title="Scroll left"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              className="p-1 rounded-md border border-[var(--gm-border)] bg-[var(--gm-surface)] text-[var(--gm-text-muted)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-bg-elevated)] transition-colors cursor-pointer"
              title="Scroll right"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Row 3: Horizontal Scrollable Provider Pill Strip */}
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth"
          >
            {visibleProviders.map((opt) => {
              const isSelected = provider === opt.id;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setProvider(opt.id)}
                  className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-gm-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 border ${
                    isSelected
                      ? "bg-[var(--gm-accent-strong)] text-white border-[var(--gm-accent-strong)] shadow-sm scale-[1.02]"
                      : "bg-[var(--gm-surface)] text-[var(--gm-text-muted)] border-[var(--gm-border)] hover:border-[var(--gm-border-strong)] hover:text-[var(--gm-text)] hover:bg-[var(--gm-surface-hover)]"
                  }`}
                  title={opt.description}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 transition-transform group-hover:scale-110 ${isSelected ? "text-white" : "text-[var(--gm-text-subtle)]"}`} />
                  <span className="font-semibold">{opt.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-normal ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-[var(--gm-bg-elevated)] text-[var(--gm-text-subtle)] border border-[var(--gm-border)]"
                    }`}
                  >
                    {opt.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 4: Active Catalog Info Banner & Privacy Footnote */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[var(--gm-border)]/60 text-gm-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--gm-text-subtle)] shrink-0">
              Active Source:
            </span>
            <span className="font-bold text-[var(--gm-accent-strong)] shrink-0">
              {activeProviderMeta?.label ?? "All Catalogs"}
            </span>
            <span className="text-[var(--gm-text-muted)] truncate hidden md:inline">
              — {activeProviderMeta?.description ?? ""}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-[var(--gm-text-subtle)] shrink-0">
            <span>🔒 Direct Public Catalog API</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline">Zero Background Telemetry</span>
          </div>
        </div>
      </form>

      {/* Step 1: Own-Library Matches (shown whenever query is non-empty) */}
      {query.trim().length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-gm-sm font-bold uppercase tracking-wider text-[var(--gm-text-muted)] flex items-center gap-2">
              <LibraryIcon className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              <span>In Your Library ({localMatches.length})</span>
            </h2>
          </div>

          {localMatches.length === 0 ? (
            <div className="rounded-gm-lg border border-dashed border-[var(--gm-border)] bg-[var(--gm-surface)]/40 p-4 text-gm-xs text-[var(--gm-text-muted)]">
              No exact or partial matches found in your local Library for &ldquo;{query.trim()}&rdquo;. Click <strong>Search Catalog</strong> above to query {PROVIDER_NAMES[provider]}.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {localMatches.map((item) => (
                <div
                  key={item.work.id}
                  className="flex items-center justify-between gap-3 rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-3"
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
                      <p className="mt-1 truncate text-gm-sm font-semibold text-[var(--gm-text)]">
                        {item.work.title}
                      </p>
                      <p className="text-gm-xs text-[var(--gm-text-muted)]">
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
            <h2 className="text-gm-sm font-bold uppercase tracking-wider text-[var(--gm-text-muted)] flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              <span>
                {PROVIDER_NAMES[provider]} Results ({catalogResults.length})
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setHasSearchedCatalog(false);
                setCatalogResults([]);
              }}
              className="text-gm-xs text-[var(--gm-text-muted)]"
            >
              Clear Results
            </Button>
          </div>

          {searchError ? (
            <div className="rounded-gm-lg border border-red-500/40 bg-red-500/10 p-4 text-gm-xs text-red-300">
              {searchError}
            </div>
          ) : catalogResults.length === 0 && !searching ? (
            <div className="rounded-gm-lg border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6 text-center text-gm-sm text-[var(--gm-text-muted)]">
              No catalog results found.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {catalogResults.map((cand) => {
                const matchState = classifyAgainstLibrary(cand, libraryItems);
                return (
                  <div
                    key={cand.externalKey}
                    className="flex gap-4 rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 shadow-xs"
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
                          <span className="rounded-gm-sm bg-[var(--gm-accent)]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--gm-accent-strong)] border border-[var(--gm-accent)]/20">
                            {PROVIDER_NAMES[cand.provider] ?? cand.provider}
                          </span>
                          <span className="rounded-gm-sm bg-[var(--gm-surface)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--gm-text-muted)] border border-[var(--gm-border)]">
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

                        <h3 className="text-gm-sm font-bold text-[var(--gm-text)] line-clamp-1">
                          {cand.title}
                        </h3>
                        {cand.creators.length > 0 && (
                          <p className="text-gm-xs text-[var(--gm-text-muted)] mt-0.5">
                            {cand.creators.map((c) => c.name).join(" · ")}
                          </p>
                        )}
                        {cand.description && (
                          <p className="mt-1.5 text-gm-xs text-[var(--gm-text-subtle)] line-clamp-2">
                            {cand.description}
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {matchState.kind === "already_in_library" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-gm-xs"
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
                              className="gap-1.5 text-gm-xs"
                              onClick={() => onNavigateWork?.(matchState.item.work.id)}
                            >
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                              <span>View Similar</span>
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="gap-1.5 text-gm-xs"
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
                            className="gap-1.5 text-gm-xs"
                            onClick={() => handleAddCandidateToLibrary(cand)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Add to Library</span>
                          </Button>
                        )}
                        {cand.siteUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-gm-xs text-[var(--gm-text-subtle)] hover:text-[var(--gm-text)]"
                            onClick={() => window.open(cand.siteUrl!, "_blank")}
                          >
                            <Globe className="h-3.5 w-3.5" />
                            <span>{cand.provider === "novelupdates" ? "Search Web" : "Open Link"}</span>
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
            <h2 className="text-gm-base font-bold text-[var(--gm-text)] flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--gm-accent-strong)]" />
              <span>Local Explainable Recommendations</span>
            </h2>
            <p className="text-gm-xs text-[var(--gm-text-muted)]">
              Computed 100% locally from your adaptation graph, favorite creators, and top genres — with an explicit reason for every suggestion.
            </p>
          </div>
          {dismissedWorkIds.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={restoreAllDismissed}
              className="gap-1.5 text-gm-xs text-[var(--gm-text-muted)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restore Dismissed ({dismissedWorkIds.length})</span>
            </Button>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-6">
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
                className="flex flex-col justify-between rounded-gm-xl border border-[var(--gm-border)] bg-[var(--gm-bg-elevated)] p-4 shadow-xs hover:border-[var(--gm-border-strong)] transition-colors"
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
                      className="rounded-gm-sm p-1 text-[var(--gm-text-subtle)] hover:bg-[var(--gm-surface)] hover:text-[var(--gm-text)] cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <h3 className="text-gm-sm font-bold text-[var(--gm-text)] line-clamp-1">
                    {rec.title}
                  </h3>
                  <p className="mt-1.5 rounded-cv bg-[var(--gm-surface)] px-2.5 py-1.5 text-[11px] leading-snug text-[var(--gm-accent-strong)] border border-[var(--gm-border)]">
                    {rec.reasonLabel}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[var(--gm-border)] flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase text-[var(--gm-text-subtle)]">
                    {rec.contentType}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigateWork?.(rec.workId)}
                    className="h-7 px-2 text-gm-xs gap-1 text-[var(--gm-text)]"
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
