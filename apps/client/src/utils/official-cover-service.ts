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
 * Query multi-catalog services (AniList, Open Library, MangaUpdates) for an official cover.
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

  // 3. Tertiary Strategy: MangaUpdates (Asian Web Novels, Manhua, Indie Scanlations)
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
