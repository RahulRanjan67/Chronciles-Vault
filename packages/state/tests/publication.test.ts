import { describe, expect, it } from "vitest";
import {
  contentTypeLabel,
  evaluatePublication,
  renderPublicationHtml,
  renderPublicationMarkdown,
  privateNeedles,
  isPrivateTagName,
  type PublicationInput,
  type PublicationWork,
} from "../src/publication/publication-engine";
import { useListsStore } from "../src/stores/use-lists-store";

const work = (over: Partial<PublicationWork> = {}): PublicationWork => ({
  id: "w1",
  title: "Lord of the Mysteries",
  author: "Cuttlefish",
  contentType: "web_novel",
  genres: ["Mystery", "Dark Fantasy"],
  tags: ["potion"],
  synopsis: "Klein Moretti wakes in a steampunk world governed by potion pathways.",
  privacyState: "public",
  coverRef: "https://example.org/cover.jpg",
  totalChapters: "1432 Chapters",
  rating: 9.9,
  ...over,
});

const base = (over: Partial<PublicationInput> = {}): PublicationInput => ({
  list: {
    id: "l1",
    title: "Fantasy Picks",
    description: "Worlds worth the time.",
    privacyState: "public",
    items: [{ id: "i1", workId: "w1", position: 0, personalNote: "Potion pathways are addictive." }],
  },
  works: [work()],
  privateSources: [],
  vaultStatus: "uninitialized",
  generatedAt: "2026-10-06T00:00:00.000Z",
  ...over,
});

const kinds = (input: PublicationInput) => {
  const result = evaluatePublication(input);
  return result.status === "blocked" ? result.findings.map((f) => f.kind) : [];
};

describe("publication gate: clean lists", () => {
  it("is ready with zero findings when every check passes", () => {
    const result = evaluatePublication(base());
    expect(result.status).toBe("ready");
    expect(result.findings).toHaveLength(0);
    expect(result.document?.entries).toHaveLength(1);
    expect(result.document?.entries[0]?.title).toBe("Lord of the Mysteries");
  });

  it("orders entries by position and renumbers them", () => {
    const result = evaluatePublication(
      base({
        list: {
          id: "l1",
          title: "Order",
          description: null,
          privacyState: "public",
          items: [
            { id: "b", workId: "w2", position: 1, personalNote: null },
            { id: "a", workId: "w1", position: 0, personalNote: null },
          ],
        },
        works: [work(), work({ id: "w2", title: "Solo Leveling" })],
      }),
    );
    expect(result.document?.entries.map((e) => e.title)).toEqual(["Lord of the Mysteries", "Solo Leveling"]);
    expect(result.document?.entries.map((e) => e.position)).toEqual([0, 1]);
  });
});

describe("publication gate: blocking leaks", () => {
  it("blocks a private list", () => {
    expect(kinds(base({ list: { ...base().list, privacyState: "private" } }))).toContain("list_not_public");
  });

  it("blocks entries whose work is private or in the vault", () => {
    expect(kinds(base({ works: [work({ privacyState: "private" })] }))).toContain("work_private");
    expect(kinds(base({ works: [work({ privacyState: "vault" })] }))).toContain("work_private");
  });

  it("blocks dangling references to deleted works", () => {
    expect(kinds(base({ works: [] }))).toContain("work_missing");
  });

  it("blocks private tags on the work", () => {
    expect(kinds(base({ works: [work({ tags: ["private:drafts"] })] }))).toContain("private_tag");
    expect(kinds(base({ works: [work({ genres: ["vault"] })] }))).toContain("private_tag");
  });

  it("blocks inline private markers in the personal note", () => {
    const input = base();
    const withMarker = base({
      list: {
        ...input.list,
        items: [{ id: "i1", workId: "w1", position: 0, personalNote: "Keep this [private]spoiler[/private]" }],
      },
    });
    expect(kinds(withMarker)).toContain("private_marker");
  });

  it("blocks references to the Private Vault in notes or descriptions", () => {
    const input = base();
    const withRef = base({
      list: { ...input.list, description: "Notes stored in my private vault." },
    });
    expect(kinds(withRef)).toContain("vault_reference");
  });

  it("blocks text copied from a private memory", () => {
    const secret =
      "The lantern scene reveals that the sect elder has been hiding the bloodline oath all along";
    const copied = base({
      list: {
        ...base().list,
        items: [
          {
            id: "i1",
            workId: "w1",
            position: 0,
            personalNote: "Remember that the lantern scene reveals that the sect elder has been hiding it",
          },
        ],
      },
      privateSources: [{ label: "memory", text: secret }],
    });
    expect(kinds(copied)).toContain("private_text_match");
  });

  it("blocks when the vault is locked, because private text cannot be checked", () => {
    expect(kinds(base({ vaultStatus: "locked" }))).toContain("vault_unverified");
  });

  it("allows publication when the vault has never been set up", () => {
    expect(evaluatePublication(base({ vaultStatus: "uninitialized" })).status).toBe("ready");
  });

  it("never builds a document while any finding exists", () => {
    const result = evaluatePublication(base({ works: [work({ privacyState: "private" })] }));
    expect(result.status).toBe("blocked");
    expect(result.document).toBeNull();
  });
});

describe("publication gate: exclusion as the fix path", () => {
  it("excluding a leaking entry removes its findings and output", () => {
    const input = base({
      list: {
        ...base().list,
        items: [
          { id: "i1", workId: "w1", position: 0, personalNote: null },
          { id: "i2", workId: "w2", position: 1, personalNote: null },
        ],
      },
      works: [work(), work({ id: "w2", title: "Secret Draft", privacyState: "private" })],
    });
    expect(kinds(input)).toContain("work_private");

    const fixed = evaluatePublication({ ...input, excludedEntryIds: ["i2"] });
    expect(fixed.status).toBe("ready");
    expect(fixed.document?.entries.map((e) => e.title)).toEqual(["Lord of the Mysteries"]);
  });
});

describe("publication helpers", () => {
  it("labels content types readably and title-cases unknown values", () => {
    expect(contentTypeLabel("web_novel")).toBe("Web novel");
    expect(contentTypeLabel("manhwa")).toBe("Manhwa");
    expect(contentTypeLabel("audio_drama")).toBe("Audio drama");
  });

  it("builds eight-word needles from long private text and whole needles from short text", () => {
    expect(privateNeedles("one two three four five six seven eight nine")).toHaveLength(2);
    expect(privateNeedles("secret")).toEqual([]);
    expect(privateNeedles("a short but long enough secret")).toHaveLength(1);
  });

  it("recognises private tag names and prefixes", () => {
    expect(isPrivateTagName("#Vault")).toBe(true);
    expect(isPrivateTagName("secret:plot")).toBe(true);
    expect(isPrivateTagName("R18")).toBe(false);
  });
});

describe("publication renderers escape everything", () => {
  const doc = () => {
    const result = evaluatePublication(
      base({
        list: {
          id: "l1",
          title: "<script>alert(1)</script> Picks",
          description: "Ben & Jerry's <img src=x onerror=alert(2)>",
          privacyState: "public",
          items: [
            {
              id: "i1",
              workId: "w1",
              position: 0,
              personalNote: "<b>bold</b> \"quoted\" [link](http://x)",
            },
          ],
        },
        works: [work({ title: "Tower <of> God", coverRef: "javascript:alert(3)" })],
      }),
    );
    if (!result.document) throw new Error("expected ready document");
    return result.document;
  };

  it("escapes HTML and never emits raw script or event handler markup", () => {
    const html = renderPublicationHtml(doc());
    expect(html).not.toContain("<script>alert(1)");
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Tower &lt;of&gt; God");
  });

  it("includes a restrictive Content-Security-Policy and drops non-https covers", () => {
    const html = renderPublicationHtml(doc());
    expect(html).toContain("default-src 'none'");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("<img");
  });

  it("escapes Markdown control characters", () => {
    const md = renderPublicationMarkdown(doc());
    expect(md).toContain("\\[link\\]");
    expect(md).toContain("# \\<script\\>");
  });
});

describe("lists store: reorder, notes and publication history", () => {
  it("moves an item down and back up, renumbering positions", () => {
    const store = useListsStore.getState();
    const listId = "list-all-time-favorites";
    store.moveListItem(listId, "item-1", "down");
    let list = useListsStore.getState().myLists.find((l) => l.id === listId)!;
    expect(list.items.find((i) => i.id === "item-1")?.position).toBe(1);

    useListsStore.getState().moveListItem(listId, "item-1", "up");
    list = useListsStore.getState().myLists.find((l) => l.id === listId)!;
    expect(list.items.find((i) => i.id === "item-1")?.position).toBe(0);
  });

  it("ignores moves beyond the ends of the list", () => {
    const listId = "list-all-time-favorites";
    useListsStore.getState().moveListItem(listId, "item-1", "up");
    const list = useListsStore.getState().myLists.find((l) => l.id === listId)!;
    expect(list.items.find((i) => i.id === "item-1")?.position).toBe(0);
  });

  it("sets and clears a personal note, capped at 500 characters", () => {
    const listId = "list-all-time-favorites";
    useListsStore.getState().setListItemNote(listId, "item-2", "  great pacing  ");
    let item = useListsStore.getState().myLists.find((l) => l.id === listId)!.items.find((i) => i.id === "item-2");
    expect(item?.personalNote).toBe("great pacing");

    useListsStore.getState().setListItemNote(listId, "item-2", "   ");
    item = useListsStore.getState().myLists.find((l) => l.id === listId)!.items.find((i) => i.id === "item-2");
    expect(item?.personalNote).toBeNull();

    useListsStore.getState().setListItemNote(listId, "item-2", "x".repeat(900));
    item = useListsStore.getState().myLists.find((l) => l.id === listId)!.items.find((i) => i.id === "item-2");
    expect(item?.personalNote?.length).toBe(500);
  });

  it("records publication metadata without content, newest first", () => {
    useListsStore.getState().recordPublication({
      listId: "l1",
      title: "First",
      format: "html",
      generatedAt: "2026-10-06T00:00:00.000Z",
      entryCount: 2,
      excludedCount: 1,
    });
    useListsStore.getState().recordPublication({
      listId: "l1",
      title: "Second",
      format: "markdown",
      generatedAt: "2026-10-06T01:00:00.000Z",
      entryCount: 3,
      excludedCount: 0,
    });
    const records = useListsStore.getState().publications;
    expect(records[0]?.title).toBe("Second");
    expect(Object.keys(records[0] ?? {})).not.toContain("content");
  });
});
