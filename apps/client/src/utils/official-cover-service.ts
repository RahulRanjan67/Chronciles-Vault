import { clientRepository, useLibraryStore } from "@grimoire/state";
import { toast } from "@grimoire/ui";
import type { WorkId } from "@grimoire/shared";

/**
 * Cache of work IDs attempted during the current session to avoid duplicate network calls.
 */
const sessionAttemptedIds = new Set<string>();

/**
 * Clean a fiction title for database lookup (strip [VAULT], season indicators, volume tags, etc.)
 */
export function cleanTitleForCoverSearch(rawTitle: string): string {
  if (!rawTitle) return "";
  let clean = rawTitle.replace(/\[(?:VAULT|PRIVATE)\]/gi, "").trim();
  clean = clean.replace(/\s*\((?:Novel|Manhwa|Manga|Webtoon|Anime|Light Novel)\)/gi, "").trim();
  clean = clean.replace(/\s*-\s*Season\s*\d+/gi, "").trim();
  clean = clean.replace(/\s*Vol(?:ume)?\.?\s*\d+/gi, "").trim();
  return clean.trim();
}

/**
 * Discovered access path item for connecting external catalogs.
 */
export interface DiscoveredAccessPathCandidate {
  id: string;
  provider: string;
  providerKey: "gutenberg" | "internetarchive" | "comick" | "openlibrary" | "goodreads" | "mangadex";
  label: string;
  url: string;
  kind: "web";
  format?: string;
  description?: string;
}

/**
 * Query multi-catalog services (AniList, Open Library, Gutenberg, Internet Archive, Comick, MangaUpdates) for an official cover.
 */
export async function fetchOfficialCoverForTitle(title: string): Promise<string | null> {
  const clean = cleanTitleForCoverSearch(title);
  if (!clean) return null;

  // 1. Primary Strategy: AniList GraphQL (Covers Anime, Manga, Manhwa, Light Novels)
  try {
    const query = `query ($search: String) {
      Media(search: $search) {
        coverImage {
          extraLarge
          large
          medium
        }
      }
    }`;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { search: clean } }),
    });
    if (res.ok) {
      const data = await res.json();
      const media = data?.data?.Media;
      const url = media?.coverImage?.extraLarge || media?.coverImage?.large || media?.coverImage?.medium;
      if (url && typeof url === "string" && url.startsWith("http")) {
        return url;
      }
    }
  } catch {
    // Continue to next strategy on network failure
  }

  // 2. Secondary Strategy: Open Library (Covers Western Fiction, Sci-Fi Classics, Literature)
  try {
    const olRes = await fetch(
      `https://openlibrary.org/search.json?title=${encodeURIComponent(clean)}&limit=1`,
      { headers: { Accept: "application/json" } }
    );
    if (olRes.ok) {
      const olData = await olRes.json();
      const coverId = olData?.docs?.[0]?.cover_i;
      if (coverId) {
        return `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
      }
    }
  } catch {
    // Continue to next strategy on network failure
  }

  // 3. Project Gutenberg / Gutendex (Public domain classics & historical literature)
  try {
    const gRes = await fetch(
      `https://gutendex.com/books/?search=${encodeURIComponent(clean)}`,
      { headers: { Accept: "application/json" } }
    );
    if (gRes.ok) {
      const gData = await gRes.json();
      const firstBook = gData?.results?.[0];
      const cover = firstBook?.formats?.["image/jpeg"];
      if (cover && typeof cover === "string" && cover.startsWith("http")) {
        return cover;
      }
    }
  } catch {
    // Continue
  }

  // 4. Internet Archive (Texts, historic editions, rare scans)
  try {
    const iaRes = await fetch(
      `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(clean)})+AND+mediatype:(texts)&fl[]=identifier&rows=1&output=json`,
      { headers: { Accept: "application/json" } }
    );
    if (iaRes.ok) {
      const iaData = await iaRes.json();
      const id = iaData?.response?.docs?.[0]?.identifier;
      if (id) {
        return `https://archive.org/services/img/${id}`;
      }
    }
  } catch {
    // Continue
  }

  // 5. Comick API (Manga, Manhwa, Manhua)
  try {
    const cRes = await fetch(
      `https://api.comick.fun/v1.0/search?q=${encodeURIComponent(clean)}&limit=1`,
      { headers: { Accept: "application/json" } }
    );
    if (cRes.ok) {
      const cData = await cRes.json();
      const b2key = cData?.[0]?.md_covers?.[0]?.b2key;
      if (b2key) {
        return `https://meo.comick.pictures/${b2key}`;
      }
    }
  } catch {
    // Continue
  }

  // 6. Tertiary Strategy: MangaUpdates (Asian Web Novels, Manhua, Indie Scanlations)
  try {
    const muRes = await fetch("https://api.mangaupdates.com/v1/series/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ search: clean, perpage: 1 }),
    });
    if (muRes.ok) {
      const muData = await muRes.json();
      const rawImg = muData?.results?.[0]?.record?.image?.url?.original;
      if (rawImg && typeof rawImg === "string" && rawImg.startsWith("http")) {
        return rawImg;
      }
    }
  } catch {
    // Silent fallback
  }

  return null;
}

/**
 * Scan online open directories (Gutenberg, Internet Archive, Comick, Open Library/Goodreads, MangaDex)
 * to locate recommended reading access paths for a work.
 */
export async function scanDirectoryAccessPathsForTitle(
  rawTitle: string,
): Promise<DiscoveredAccessPathCandidate[]> {
  const clean = cleanTitleForCoverSearch(rawTitle);
  if (!clean) return [];

  const candidates: DiscoveredAccessPathCandidate[] = [];

  const [gutenbergRes, iaRes, olRes, mdRes] = await Promise.allSettled([
    // 1. Project Gutenberg / Gutendex
    (async () => {
      const res = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(clean)}`);
      if (!res.ok) return [];
      const data = await res.json();
      const results: DiscoveredAccessPathCandidate[] = [];
      const first = data?.results?.[0];
      if (first) {
        const titleMatch = first.title ?? clean;
        if (first.formats?.["application/epub+zip"]) {
          results.push({
            id: `gutenberg-epub-${first.id}`,
            provider: "Project Gutenberg",
            providerKey: "gutenberg",
            label: "Download EPUB (Project Gutenberg)",
            url: first.formats["application/epub+zip"],
            kind: "web",
            format: "EPUB",
            description: `Public domain edition: "${titleMatch}"`,
          });
        }
        if (first.formats?.["text/html"]) {
          results.push({
            id: `gutenberg-html-${first.id}`,
            provider: "Project Gutenberg",
            providerKey: "gutenberg",
            label: "Read Online (Gutenberg Web Reader)",
            url: first.formats["text/html"],
            kind: "web",
            format: "HTML Reader",
            description: `Official web browser reader: "${titleMatch}"`,
          });
        }
      }
      return results;
    })(),

    // 2. Internet Archive
    (async () => {
      const url = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(clean)})+AND+mediatype:(texts)&fl[]=identifier,title,creator,downloads&sort[]=downloads+desc&rows=2&output=json`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const docs = data?.response?.docs ?? [];
      const results: DiscoveredAccessPathCandidate[] = [];
      for (const doc of docs) {
        if (!doc.identifier) continue;
        results.push({
          id: `ia-details-${doc.identifier}`,
          provider: "Internet Archive",
          providerKey: "internetarchive",
          label: `Read & Borrow on Archive.org (${doc.downloads ? `${doc.downloads.toLocaleString()} borrows` : "Digital Edition"})`,
          url: `https://archive.org/details/${doc.identifier}`,
          kind: "web",
          format: "Digital Archive",
          description: doc.title || "Full digitized book archive",
        });
        results.push({
          id: `ia-pdf-${doc.identifier}`,
          provider: "Internet Archive",
          providerKey: "internetarchive",
          label: "Archive.org PDF Edition",
          url: `https://archive.org/download/${doc.identifier}/${doc.identifier}.pdf`,
          kind: "web",
          format: "PDF",
          description: "Direct PDF download from archive.org",
        });
        break; // take best match
      }
      return results;
    })(),

    // 3. Open Library & Goodreads Bridge
    (async () => {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(clean)}&fields=key,title,author_name,id_goodreads,isbn&limit=1`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const doc = data?.docs?.[0];
      const results: DiscoveredAccessPathCandidate[] = [];
      if (doc) {
        if (Array.isArray(doc.id_goodreads) && doc.id_goodreads[0]) {
          results.push({
            id: `goodreads-${doc.id_goodreads[0]}`,
            provider: "Goodreads",
            providerKey: "goodreads",
            label: "Goodreads Reviews & Catalog Page",
            url: `https://www.goodreads.com/book/show/${doc.id_goodreads[0]}`,
            kind: "web",
            format: "Goodreads",
            description: "Community ratings, user reviews, and edition index",
          });
        } else {
          results.push({
            id: `goodreads-search-${clean}`,
            provider: "Goodreads",
            providerKey: "goodreads",
            label: "Goodreads Reviews & Community Search",
            url: `https://www.goodreads.com/search?q=${encodeURIComponent(clean)}`,
            kind: "web",
            format: "Goodreads",
            description: "Search community bookshelves, ratings, and reviews",
          });
        }
        if (doc.key) {
          results.push({
            id: `ol-${doc.key}`,
            provider: "Open Library",
            providerKey: "openlibrary",
            label: "Open Library Digital Archive",
            url: `https://openlibrary.org${doc.key}`,
            kind: "web",
            format: "Open Library",
            description: "Internet Archive universal open book catalog",
          });
        }
      }
      return results;
    })(),

    // 4. MangaDex API
    (async () => {
      const url = `https://api.mangadex.org/manga?title=${encodeURIComponent(clean)}&limit=1`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      const manga = data?.data?.[0];
      const results: DiscoveredAccessPathCandidate[] = [];
      if (manga?.id) {
        results.push({
          id: `mangadex-${manga.id}`,
          provider: "MangaDex",
          providerKey: "mangadex",
          label: "Read on MangaDex (Scanlations)",
          url: `https://mangadex.org/title/${manga.id}`,
          kind: "web",
          format: "Manga Reader",
          description: "Open community scanlation chapters",
        });
      }
      return results;
    })(),
  ]);

  if (gutenbergRes.status === "fulfilled") candidates.push(...gutenbergRes.value);
  if (iaRes.status === "fulfilled") candidates.push(...iaRes.value);
  if (olRes.status === "fulfilled") candidates.push(...olRes.value);
  if (mdRes.status === "fulfilled") candidates.push(...mdRes.value);

  // 5. Comick.io direct gateway path
  const slug = clean.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  candidates.push({
    id: `comick-${slug}`,
    provider: "Comick.io",
    providerKey: "comick",
    label: "Read on Comick.io (Manga/Manhwa)",
    url: `https://comick.io/comic/${slug}`,
    kind: "web",
    format: "Web Reader",
    description: "Online manga, manhwa, and manhua chapter reader",
  });

  return candidates;
}

export interface FetchCoverOptions {
  silent?: boolean;
}

/**
 * Fetch and assign official cover for a specific work.
 * - If silent: true, never displays error or failure notifications.
 * - If silent: false (manual user action), displays user notifications.
 */
export async function autoFetchCoverForWork(
  workId: string,
  title: string,
  options: FetchCoverOptions = { silent: true },
): Promise<string | null> {
  sessionAttemptedIds.add(workId);

  try {
    const coverUrl = await fetchOfficialCoverForTitle(title);
    if (coverUrl) {
      // Concurrency check: verify the work still exists and hasn't been given a manual cover in the meantime
      const currentItem = clientRepository.getItem(workId as WorkId);
      if (!currentItem || currentItem.work.deletedAt) {
        return null;
      }
      if (options.silent && currentItem.work.coverRef) {
        return currentItem.work.coverRef;
      }
      clientRepository.updateWork(workId as WorkId, { coverRef: coverUrl });
      useLibraryStore.getState().refresh();

      if (!options.silent) {
        toast({
          title: "Official Cover Found",
          description: `Updated official cover for "${title}".`,
          variant: "success",
        });
      }
      return coverUrl;
    } else {
      if (!options.silent) {
        toast({
          title: "Cover Not Found",
          description: `Could not locate an official cover for "${title}". You can upload an image manually.`,
          variant: "warning",
        });
      }
      return null;
    }
  } catch (err) {
    if (!options.silent) {
      toast({
        title: "Fetch Failed",
        description: err instanceof Error ? err.message : "Network error fetching official cover.",
        variant: "destructive",
      });
    }
    return null;
  }
}

let isBatchAutoFetching = false;

/**
 * Run background auto-fetch for all works in the library that currently lack a cover image.
 * Completely silent: does not display any failure messages for un-fetched works.
 */
export async function autoFetchMissingLibraryCovers(
  options: FetchCoverOptions = { silent: true },
): Promise<number> {
  if (isBatchAutoFetching) return 0;
  isBatchAutoFetching = true;

  try {
    const items = clientRepository.getItems();
    // Filter for works missing coverRef that haven't been attempted yet this session
    const candidates = items.filter(
      (item) =>
        (!item.work.coverRef || item.work.coverRef.trim() === "") &&
        !sessionAttemptedIds.has(item.work.id) &&
        !item.work.deletedAt,
    );

    if (candidates.length === 0) return 0;

    let updatedCount = 0;

    for (const item of candidates) {
      // Gentle pacing to prevent hitting rate limits
      await new Promise((resolve) => setTimeout(resolve, 350));
      const result = await autoFetchCoverForWork(item.work.id, item.work.title, {
        silent: true,
      });
      if (result) {
        updatedCount++;
      }
    }

    return updatedCount;
  } finally {
    isBatchAutoFetching = false;
  }
}
