export interface PdfOutlineSource {
  readonly title: string;
  readonly dest: string | readonly unknown[] | null;
  readonly url?: string | null;
  readonly items?: readonly PdfOutlineSource[];
}

export interface PdfOutlineDestinationResolver {
  getDestination(name: string): Promise<readonly unknown[] | null>;
  getPageIndex(reference: { readonly num: number; readonly gen: number }): Promise<number>;
}

export interface PdfOutlineEntry {
  readonly title: string;
  readonly pageNumber: number;
  readonly children: readonly PdfOutlineEntry[];
}

const MAX_OUTLINE_DEPTH = 12;
const MAX_OUTLINE_ITEMS = 1000;

export async function resolvePdfOutline(
  source: readonly PdfOutlineSource[],
  resolver: PdfOutlineDestinationResolver,
): Promise<PdfOutlineEntry[]> {
  let count = 0;

  const resolveNodes = async (
    nodes: readonly PdfOutlineSource[],
    depth: number,
  ): Promise<PdfOutlineEntry[]> => {
    if (depth > MAX_OUTLINE_DEPTH || count >= MAX_OUTLINE_ITEMS) return [];
    const entries: PdfOutlineEntry[] = [];
    for (const node of nodes) {
      if (count >= MAX_OUTLINE_ITEMS) break;
      count += 1;
      let pageNumber: number | null = null;
      if (node.dest && !node.url) {
        const destination =
          typeof node.dest === "string" ? await resolver.getDestination(node.dest) : node.dest;
        const reference = destination?.[0];
        if (typeof reference === "number" && Number.isInteger(reference) && reference >= 0) {
          pageNumber = reference + 1;
        } else if (reference && typeof reference === "object") {
          const num = Reflect.get(reference, "num");
          const gen = Reflect.get(reference, "gen");
          if (typeof num === "number" && typeof gen === "number") {
            const index = await resolver.getPageIndex({ num, gen });
            if (Number.isInteger(index) && index >= 0) pageNumber = index + 1;
          }
        }
      }
      const children = node.items ? await resolveNodes(node.items, depth + 1) : [];
      if (pageNumber !== null) {
        entries.push({ title: node.title, pageNumber, children });
      } else {
        entries.push(...children);
      }
    }
    return entries;
  };

  return resolveNodes(source, 0);
}
